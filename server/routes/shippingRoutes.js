const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const ShippingSettings = require('../models/ShippingSettings');
const { protect, adminOnly } = require('../middlewares/auth');
const shiprocket = require('../services/shiprocket');
const { fail, parcelValues, orderReference, totals, shiprocketPayload } = shiprocket;
const { getSettings, resolveSettings } = require('../services/shippingSettings');
const { syncTracking, safeUrl } = require('../services/shipmentTracking');
const router = express.Router();
const wrap = fn => async (req, res, next) => { try { await fn(req, res); } catch (error) { next(error); } };
router.use(protect, adminOnly);
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

router.get('/settings', wrap(async (req, res) => res.json({ settings: await getSettings(), configured: Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD), webhookConfigured: Boolean(process.env.SHIPROCKET_WEBHOOK_KEY) })));
router.get('/connection', wrap(async (req, res) => res.json({ connected: true, locations: await shiprocket.pickupLocations(), settings: await resolveSettings() })));
router.put('/settings', wrap(async (req, res) => {
  const body = req.body || {};
  const location = (await shiprocket.pickupLocations()).find(p => p.name === body.pickupLocation && p.active);
  if (!location) throw fail('Add an active pickup address in Shiprocket, then select it here.');
  const settings = { pickupLocation: location.name, pickupPincode: location.pincode };
  for (const field of ['businessName', 'businessAddress', 'businessGstin']) {
    if (typeof body[field] !== 'string' || body[field].length > 1000) throw fail(`Invalid ${field}.`);
    settings[field] = body[field].trim();
  }
  res.json(await ShippingSettings.findByIdAndUpdate('shipping', { $set: settings }, { new: true, upsert: true, runValidators: true }));
}));
router.get('/billing', wrap(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1), limit = 50;
  const [orders, count, summary] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('user', 'name email').lean(),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: null, orders: { $sum: 1 }, sales: { $sum: '$totalAmount' }, paid: { $sum: { $cond: [{ $eq: ['$paymentInfo.status', 'paid'] }, '$totalAmount', 0] } }, shippingCollected: { $sum: '$shippingFee' }, shippingQuoted: { $sum: '$shipping.quotedRate' } } }]),
  ]);
  res.json({ orders, count, page, pages: Math.ceil(count / limit), summary: summary[0] || {} });
}));
router.get('/orders', wrap(async (req, res) => res.json(await Order.find().sort({ createdAt: -1 }).limit(100).populate('user', 'name email'))));
router.param('id', (req, res, next, id) => mongoose.isValidObjectId(id) ? next() : res.status(400).json({ message: 'Invalid order ID.' }));
async function getOrder(id) {
  const order = await Order.findById(id).populate('user', 'name email phone');
  if (!order) throw fail('Order not found.', 404);
  return order;
}
router.get('/orders/:id', wrap(async (req, res) => res.json(await getOrder(req.params.id))));
function need(condition, message) { if (!condition) throw fail(message, 409); }
function ready(order) {
  need(!['cancelled', 'delivered'].includes(order.status), 'This order is already cancelled or delivered.');
  need(order.paymentMethod === 'COD' || order.paymentInfo?.status === 'paid', 'Prepaid payment must be paid before processing.');
}

// Durable per-order mutex. Ambiguous remote writes remain locked for reconciliation;
// retries must never silently duplicate a shipment, debit, or pickup request.
async function operation(req, action, fn, { reconcile = false } = {}) {
  const filter = { _id: req.params.id, ...(reconcile ? {
    $or: [{ 'shipping.operation': { $in: [null, ''] } }, { 'shipping.operationStartedAt': { $lt: new Date(Date.now() - 120000) } }],
  } : { 'shipping.operation': { $in: [null, ''] }, 'shipping.pendingAction': { $in: [null, ''] }, 'shipping.needsReview': { $ne: true } }) };
  const claimed = await Order.findOneAndUpdate(filter, { $set: { 'shipping.operation': action, 'shipping.operationStartedAt': new Date() } }, { new: true });
  if (!claimed) throw fail('Another action is running or needs reconciliation. Use Reconcile after two minutes for interrupted requests.', 409);
  let remoteWrite = false;
  const remote = async (...args) => {
    await Order.updateOne({ _id: req.params.id, 'shipping.operation': action }, { $set: { 'shipping.pendingAction': action } });
    remoteWrite = true;
    return shiprocket.sr(...args);
  };
  try {
    const order = await getOrder(req.params.id);
    const result = await fn(order, remote);
    await Order.updateOne({ _id: order._id, 'shipping.operation': action }, {
      $set: { ...(result.set || {}), 'shipping.operation': '', 'shipping.pendingAction': '', 'shipping.needsReview': false },
      $push: { shippingAudit: { $each: [{ action, at: new Date(), actor: req.user._id, outcome: 'confirmed' }], $slice: -100 } },
    });
    return { ...result.response, order: await getOrder(order._id) };
  } catch (error) {
    await Order.updateOne({ _id: req.params.id, 'shipping.operation': action }, {
      $set: { 'shipping.operation': '', ...(remoteWrite || claimed.shipping?.pendingAction ? { 'shipping.needsReview': true } : {}) },
      $push: { shippingAudit: { $each: [{ action, at: new Date(), actor: req.user._id, outcome: remoteWrite ? 'needs_review' : 'rejected' }], $slice: -100 } },
    });
    throw error;
  }
}
router.put('/orders/:id/parcel', wrap(async (req, res) => {
  const parcel = parcelValues(req.body);
  res.json(await operation(req, 'parcel', async order => {
    ready(order); need(!order.shipping?.shipmentId, 'Parcel cannot be edited after shipment creation.');
    return { set: { parcel, approval: 'pending' } };
  }));
}));
router.post('/orders/:id/approve', wrap(async (req, res) => res.json(await operation(req, 'approve', async order => {
  ready(order); parcelValues(order.parcel); totals(order);
  need(!order.shipping?.shipmentId, 'Shipment is already created.');
  shiprocketPayload(order, await resolveSettings());
  return { set: { approval: 'approved', approvedAt: new Date(), approvedBy: req.user._id } };
}))));
async function couriersFor(order) {
  const settings = order.shipping?.pickupLocation ? { pickupLocation: order.shipping.pickupLocation, pickupPincode: order.shipping.pickupPincode } : await resolveSettings();
  return shiprocket.serviceability(settings, order.shippingAddress.pincode, order.parcel, order.paymentMethod === 'COD', order.shipping?.shiprocketOrderId);
}
router.get('/orders/:id/couriers', wrap(async (req, res) => {
  const order = await getOrder(req.params.id); ready(order);
  res.json({ couriers: await couriersFor(order) });
}));
async function findRemote(order) {
  if (order.shipping?.shiprocketOrderId) return (await shiprocket.sr('GET', `/orders/show/${order.shipping.shiprocketOrderId}`)).data;
  const result = await shiprocket.sr('GET', '/orders', undefined, { filter_by: 'channel_order_id', filter: orderReference(order), per_page: 100 });
  const matches = (result.data || []).filter(r => String(r.channel_order_id) === orderReference(order));
  need(matches.length <= 1, 'Multiple Shiprocket orders have this reference. Review them in Shiprocket before proceeding.');
  return matches[0];
}
function remoteFields(remote) {
  const shipment = Array.isArray(remote.shipments) ? remote.shipments[0] : remote.shipments;
  need(remote.id && shipment?.id, 'Remote order has no shipment ID yet. Check Shiprocket and reconcile again.');
  return { 'shipping.shiprocketOrderId': Number(remote.id), 'shipping.shipmentId': Number(shipment.id),
    ...(/^cancell?ed(?: before dispatched)?$/i.test(String(remote.status)) ? { status: 'cancelled' } : {}),
    ...(/^delivered$/i.test(String(remote.status)) ? { status: 'delivered' } : {}),
    ...(shipment.awb ? { 'shipping.awb': String(shipment.awb), 'shipping.courierName': shipment.courier || shipment.courier_name || '' } : {}),
    ...(shipment.pickup_scheduled_date || shipment.pickup_token_number ? { 'shipping.pickupRequested': true } : {}),
    ...(remote.status ? { 'shipping.status': String(remote.status) } : {}),
  };
}
router.post('/orders/:id/create-shipment', wrap(async (req, res) => res.json(await operation(req, 'create-shipment', async (order, remote) => {
  ready(order); need(order.approval === 'approved', 'Save parcel details and approve the order first.');
  if (order.shipping?.shipmentId) return {};
  const existing = await findRemote(order);
  if (existing) return { set: remoteFields(existing), response: { message: 'Existing Shiprocket order linked.' } };
  const settings = await resolveSettings();
  const payload = shiprocketPayload(order, settings);
  need((await couriersFor(order)).length > 0, 'No courier is available for this parcel and PIN code.');
  const data = await remote('POST', '/orders/create/adhoc', payload);
  need(data.order_id && data.shipment_id, 'Shiprocket has not confirmed both order and shipment IDs. Reconcile before retrying.');
  return { set: { 'shipping.shiprocketOrderId': data.order_id, 'shipping.shipmentId': data.shipment_id, 'shipping.status': 'Created', 'shipping.pickupLocation': settings.pickupLocation, 'shipping.pickupPincode': settings.pickupPincode } };
}))));
router.post('/orders/:id/reconcile', wrap(async (req, res) => res.json(await operation(req, 'reconcile', async order => {
  const remote = await findRemote(order);
  need(remote, 'No matching remote order found. If a request timed out, check Shiprocket support before retrying; the safety hold remains.');
  const set = remoteFields(remote);
  if (order.shipping?.needsReview || order.shipping?.pendingAction) {
    const action = order.shipping.pendingAction || [...(order.shippingAudit || [])].reverse().find(a => a.outcome === 'needs_review')?.action;
    if (action === 'assign-courier') need(set['shipping.awb'], 'AWB assignment is still unconfirmed. Review in Shiprocket.');
    if (action === 'pickup') need(set['shipping.pickupRequested'], 'Pickup is still unconfirmed. Review in Shiprocket.');
    if (action === 'cancel') need(set.status === 'cancelled', 'Cancellation is still unconfirmed. Review in Shiprocket.');
  }
  return { set, response: { message: 'Shiprocket order reconciled.' } };
}, { reconcile: true }))));
router.post('/orders/:id/assign-courier', wrap(async (req, res) => {
  const courierId = Number(req.body?.courierId);
  if (!Number.isInteger(courierId) || courierId <= 0) throw fail('Select a valid courier.');
  res.json(await operation(req, 'assign-courier', async (order, remote) => {
    ready(order); need(order.shipping?.shipmentId, 'Create the shipment first.');
    if (order.shipping.awb) return {};
    const courier = (await couriersFor(order)).find(c => c.id === courierId);
    need(courier, 'Selected courier is no longer available. Refresh courier rates.');
    const data = await remote('POST', '/courier/assign/awb', { shipment_id: order.shipping.shipmentId, courier_id: courierId });
    const result = data.response?.data;
    need(Number(data.awb_assign_status) === 1 && result?.awb_code, 'AWB assignment was not confirmed. Reconcile before retrying.');
    return { set: { 'shipping.awb': String(result.awb_code), 'shipping.courierId': courierId, 'shipping.courierName': result.courier_name || courier.name, 'shipping.quotedRate': courier.rate, 'shipping.status': 'AWB assigned' } };
  }));
}));
router.post('/orders/:id/pickup', wrap(async (req, res) => res.json(await operation(req, 'pickup', async (order, remote) => {
  ready(order); need(order.shipping?.awb, 'Assign an AWB first.');
  if (order.shipping.pickupRequested) return {};
  const data = await remote('POST', '/courier/generate/pickup', { shipment_id: [order.shipping.shipmentId] });
  need(Number(data.pickup_status) === 1, 'Pickup was not confirmed. Reconcile and check the pickup status in Shiprocket.');
  return { set: { 'shipping.pickupRequested': true, 'shipping.status': 'Pickup requested' } };
}))));
for (const [action, path, field, idKey, responseKey] of [
  ['label', '/courier/generate/label', 'labelUrl', 'shipment_id', 'label_url'],
  ['manifest', '/manifests/generate', 'manifestUrl', 'shipment_id', 'manifest_url'],
  ['print-manifest', '/manifests/print', 'manifestUrl', 'order_ids', 'manifest_url'],
  ['invoice', '/orders/print/invoice', 'invoiceUrl', 'ids', 'invoice_url'],
]) router.post(`/orders/:id/${action}`, wrap(async (req, res) => res.json(await operation(req, action, async order => {
  need(order.shipping?.shipmentId, 'Create the Shiprocket shipment first.');
  if (action !== 'invoice') need(order.shipping.awb, 'Assign an AWB first.');
  if (action.includes('manifest')) need(order.shipping.pickupRequested, 'Request pickup before generating the manifest.');
  const data = await shiprocket.sr('POST', path, { [idKey]: [idKey === 'shipment_id' ? order.shipping.shipmentId : order.shipping.shiprocketOrderId] });
  const url = safeUrl(data[responseKey]); need(url, 'Shiprocket did not return a document URL. Try again after processing finishes.');
  return { set: { [`shipping.${field}`]: url }, response: { url } };
}))));
router.get('/orders/:id/track', wrap(async (req, res) => {
  const result = await syncTracking(await getOrder(req.params.id));
  res.json({ ...result, order: await getOrder(req.params.id) });
}));
router.post('/orders/:id/cancel', wrap(async (req, res) => res.json(await operation(req, 'cancel', async (order, remote) => {
  need(order.status !== 'delivered', 'Delivered orders cannot be cancelled.');
  if (order.status === 'cancelled') return {};
  if (order.shipping?.shiprocketOrderId) {
    await remote('POST', '/orders/cancel', { ids: [order.shipping.shiprocketOrderId] });
    const confirmed = await findRemote(order);
    need(/^cancell?ed(?: before dispatched)?$/i.test(String(confirmed?.status)), 'Cancellation is pending at Shiprocket. Reconcile to confirm.');
  }
  return { set: { status: 'cancelled', 'shipping.status': 'Cancelled' }, response: { message: 'Order cancelled. Payment refund must be handled separately.' } };
}))));
router.get('/orders/:id/invoice.pdf', wrap(async (req, res) => {
  const order = await getOrder(req.params.id); need(order.approval === 'approved', 'Approve the order before generating its invoice.');
  totals(order);
  await Order.updateOne({ _id: order._id, 'invoice.number': { $exists: false } }, { $set: { 'invoice.number': `EM-${order._id}`, 'invoice.issuedAt': new Date() } });
  const current = await getOrder(order._id);
  require('../utils/orderInvoice').renderInvoice(res, current, await getSettings());
}));
router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to process shipping request. Please retry or reconcile the order.' });
});
module.exports = router;
module.exports.operation = operation;
module.exports.remoteFields = remoteFields;
