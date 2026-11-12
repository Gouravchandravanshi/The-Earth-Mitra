const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');
const ShippingSettings = require('../models/ShippingSettings');
const shiprocket = require('../services/shiprocket');
process.env.JWT_SECRET = 'shipping-test-secret-not-for-production';
process.env.SHIPROCKET_WEBHOOK_KEY = 'shipping-webhook-test-secret';
const id = '507f1f77bcf86cd799439011', adminId = '507f1f77bcf86cd799439099';
const parcel = { weightKg: 1, lengthCm: 20, breadthCm: 15, heightCm: 10 };
let order, provider, calls, cancelled, server, base, events;
const settings = { pickupLocation: 'Warehouse', pickupPincode: '462001', businessName: 'Test Store', businessAddress: 'Test address' };
function seed() {
  return { _id: id, createdAt: new Date('2026-11-10T00:00:00Z'), guestName: 'Test Buyer', guestEmail: 'buyer@example.test',
    items: [{ product: '507f1f77bcf86cd799439012', name: 'Rice', price: 120, qty: 2 }],
    shippingAddress: { firstName: 'Buyer', lastName: 'Test', street: 'Street 1', city: 'Bhopal', state: 'MP', pincode: '462001', phone: '9999999999' },
    subtotal: 240, shippingFee: 49, discount: 20, totalAmount: 269, parcel: { ...parcel }, approval: 'pending', status: 'processing', paymentInfo: { status: 'paid' }, shipping: {}, shippingAudit: [],
  };
}
const get = (obj, path) => path.split('.').reduce((v, key) => v?.[key], obj);
function matches(filter) {
  for (const [key, expected] of Object.entries(filter)) {
    if (key === '$or') { if (!expected.some(matches)) return false; continue; }
    if (key === 'shipping.events.eventKey') { if (order.shipping.events?.some(e => e.eventKey === expected.$ne)) return false; continue; }
    const value = get(order, key);
    if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
      for (const [op, v] of Object.entries(expected)) {
        if (op === '$ne' && value === v) return false;
        if (op === '$exists' && (value !== undefined) !== v) return false;
        if (op === '$in' && !v.some(x => x == value)) return false;
        if (op === '$lt' && !(value < v)) return false;
        if (op === '$lte' && !(value <= v)) return false;
      }
    } else if (String(value) !== String(expected)) return false;
  }
  return true;
}
function setPath(path, value) {
  const parts = path.split('.'); const key = parts.pop();
  let target = order; for (const part of parts) target = target[part] ||= {};
  target[key] = value;
}
function update(filter, change) {
  if (!matches(filter)) return { modifiedCount: 0 };
  for (const [key, value] of Object.entries(change.$set || {})) setPath(key, value);
  for (const [key, value] of Object.entries(change.$push || {})) {
    const list = get(order, key) || []; list.push(...(value.$each || [value]));
    setPath(key, value.$slice ? list.slice(value.$slice) : list);
  }
  return { modifiedCount: 1 };
}
const originals = [];
function replace(target, key, value) { originals.push([target, key, target[key]]); target[key] = value; }
replace(shiprocket, 'sr', async (method, path, body, params) => { calls.push({ method, path, body, params }); return provider(method, path, body, params); });
replace(shiprocket, 'serviceability', async () => [{ id: 1, name: 'Test Courier', rate: 65, etd: '3 days' }]);
replace(Order, 'findById', value => ({ populate: async () => String(value) === id ? structuredClone(order) : null }));
replace(Order, 'findOne', async filter => matches(filter) ? structuredClone(order) : null);
replace(Order, 'findOneAndUpdate', async (filter, change) => { if (!matches(filter)) return null; update(filter, change); return structuredClone(order); });
replace(Order, 'updateOne', async (filter, change) => update(filter, change));
replace(User, 'findById', userId => ({ select: async () => ({ _id: userId, role: userId === adminId ? 'admin' : 'user' }) }));
replace(ShippingSettings, 'findById', () => ({ lean: async () => settings }));
const app = express(); app.use(express.json()); app.use(cookieParser());
app.use('/api/admin/shipping', require('../routes/shippingRoutes'));
app.use('/api/webhooks', require('../routes/courierWebhookRoutes'));
app.use('/api/delivery', require('../routes/deliveryRoutes'));
const adminCookie = `token=${jwt.sign({ id: adminId }, process.env.JWT_SECRET)}`;
async function request(path, method = 'POST', body, cookie = adminCookie) {
  const r = await fetch(`${base}/api${path}`, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: r.status, data: await r.json() };
}
async function action(name, body, method = 'POST') { return request(`/admin/shipping/orders/${id}/${name}`, method, body); }
async function remote(method, path) {
  if (path === '/orders') return { data: [] };
  if (path === '/orders/create/adhoc') return { order_id: 900, shipment_id: 901 };
  if (path === '/courier/assign/awb') return { awb_assign_status: 1, response: { data: { awb_code: 'TESTAWB123', courier_name: 'Test Courier' } } };
  if (path === '/courier/generate/pickup') return { pickup_status: 1 };
  if (path === '/courier/generate/label') return { label_url: 'https://example.test/label.pdf' };
  if (path === '/manifests/generate' || path === '/manifests/print') return { manifest_url: 'https://example.test/manifest.pdf' };
  if (path === '/orders/print/invoice') return { invoice_url: 'https://example.test/invoice.pdf' };
  if (path.startsWith('/courier/track/awb/')) return { tracking_data: { track_status: 1, shipment_status: 7, shipment_track: [{ current_status: 'Delivered' }], shipment_track_activities: [{ date: '2026-11-10 12:30:00', activity: 'Delivered', location: 'Bhopal' }], track_url: 'https://example.test/track' } };
  if (path === '/orders/cancel') { cancelled = true; return { status_code: 200 }; }
  if (path === '/orders/show/900') return { data: { id: 900, channel_order_id: `EM-${id}`, status: cancelled ? 'CANCELED' : 'NEW', shipments: [{ id: 901, awb: order.shipping.awb, pickup_scheduled_date: order.shipping.pickupRequested ? '2026-11-10' : null }] } };
  throw new Error(`Unexpected test provider endpoint ${path}`);
}
test.before(async () => { server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}`; });
test.beforeEach(() => { order = seed(); calls = []; events = []; cancelled = false; provider = remote; });
test.after(async () => { for (const [target, key, original] of originals) target[key] = original; await new Promise(resolve => server.close(resolve)); });
test('shipping operations require a verified admin session', async () => {
  assert.equal((await request(`/admin/shipping/orders/${id}/approve`, 'POST', {}, '')).status, 401);
  const userCookie = `token=${jwt.sign({ id: '507f1f77bcf86cd799439098' }, process.env.JWT_SECRET)}`;
  assert.equal((await request(`/admin/shipping/orders/${id}/approve`, 'POST', {}, userCookie)).status, 403);
  assert.equal(calls.length, 0);
});
test('unpaid, terminal and invalid parcels are blocked before remote writes', async () => {
  order.paymentInfo.status = 'pending'; assert.equal((await action('approve')).status, 409);
  order.paymentInfo.status = 'paid'; order.status = 'cancelled'; assert.equal((await action('approve')).status, 409);
  order.status = 'processing'; assert.equal((await action('parcel', { ...parcel, weightKg: -1 }, 'PUT')).status, 400);
  assert.equal(calls.length, 0);
});
test('full admin order workflow uses the correct provider IDs and creates valid PDF billing', async () => {
  assert.equal((await action('parcel', parcel, 'PUT')).status, 200);
  assert.equal((await action('approve')).status, 200);
  assert.equal((await action('create-shipment')).status, 200);
  assert.equal(order.shipping.shiprocketOrderId, 900); assert.equal(order.shipping.shipmentId, 901);
  assert.equal((await action('assign-courier', { courierId: 1 })).status, 200);
  assert.equal(order.shipping.awb, 'TESTAWB123'); assert.equal(order.shipping.quotedRate, 65);
  assert.equal((await action('pickup')).status, 200); assert.equal(order.status, 'processing');
  for (const name of ['label', 'manifest', 'print-manifest', 'invoice']) assert.equal((await action(name)).status, 200, name);
  assert.deepEqual(calls.find(c => c.path === '/courier/generate/label').body, { shipment_id: [901] });
  assert.deepEqual(calls.find(c => c.path === '/manifests/print').body, { order_ids: [900] });
  assert.deepEqual(calls.find(c => c.path === '/orders/print/invoice').body, { ids: [900] });
  const pdf = await fetch(`${base}/api/admin/shipping/orders/${id}/invoice.pdf`, { headers: { Cookie: adminCookie } });
  assert.equal(pdf.status, 200); assert.match(pdf.headers.get('content-type'), /application\/pdf/);
  assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');
  assert.equal((await action('track', undefined, 'GET')).status, 200); assert.equal(order.status, 'delivered');
});
test('repeated shipment requests are idempotent and concurrent requests cannot double-create', async () => {
  order.approval = 'approved';
  provider = async (...args) => { if (args[1] === '/orders/create/adhoc') await new Promise(resolve => setTimeout(resolve, 40)); return remote(...args); };
  const results = await Promise.all([action('create-shipment'), action('create-shipment')]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  assert.equal((await action('create-shipment')).status, 200);
  assert.equal(calls.filter(c => c.path === '/orders/create/adhoc').length, 1);
});
test('timed-out creation blocks repeats and recovers by exact channel reference', async () => {
  order.approval = 'approved';
  provider = async (...args) => { if (args[1] === '/orders/create/adhoc') throw shiprocket.fail('Unconfirmed', 502); return remote(...args); };
  assert.equal((await action('create-shipment')).status, 502); assert.equal(order.shipping.needsReview, true);
  assert.equal((await action('create-shipment')).status, 409);
  provider = async (...args) => args[1] === '/orders' ? { data: [{ id: 900, channel_order_id: `EM-${id}`, shipments: [{ id: 901 }] }] } : remote(...args);
  assert.equal((await action('reconcile')).status, 200); assert.equal(order.shipping.shipmentId, 901);
  assert.equal(order.shipping.needsReview, false);
  assert.equal(calls.filter(c => c.path === '/orders/create/adhoc').length, 1);
});
test('unconfirmed pickup response does not mark pickup success or permit blind retries', async () => {
  Object.assign(order.shipping, { shipmentId: 901, shiprocketOrderId: 900, awb: 'TESTAWB123' });
  provider = async (...args) => args[1] === '/courier/generate/pickup' ? {} : remote(...args);
  assert.equal((await action('pickup')).status, 409); assert.notEqual(order.shipping.pickupRequested, true);
  assert.equal(order.shipping.needsReview, true); assert.equal((await action('pickup')).status, 409);
  assert.equal((await action('reconcile')).status, 409); assert.equal(order.shipping.needsReview, true);
});
test('stale interrupted pickup retains uncertainty until remote pickup is confirmed', async () => {
  Object.assign(order.shipping, { shipmentId: 901, shiprocketOrderId: 900, awb: 'TESTAWB123', operation: 'pickup', pendingAction: 'pickup', operationStartedAt: new Date(Date.now() - 180000) });
  assert.equal((await action('reconcile')).status, 409);
  assert.equal(order.shipping.pendingAction, 'pickup');
  assert.equal((await action('pickup')).status, 409);
});
test('documents and courier assignment enforce prerequisites', async () => {
  assert.equal((await action('label')).status, 409);
  assert.equal((await action('assign-courier', { courierId: -1 })).status, 400);
  order.shipping.shipmentId = 901;
  assert.equal((await action('assign-courier', { courierId: 999 })).status, 409);
  assert.equal((await action('manifest')).status, 409);
  assert.equal(calls.length, 0);
});
test('cancellation requires remote confirmation and does not alter payment status', async () => {
  Object.assign(order.shipping, { shipmentId: 901, shiprocketOrderId: 900 });
  assert.equal((await action('cancel')).status, 200); assert.equal(order.status, 'cancelled'); assert.equal(order.paymentInfo.status, 'paid');
});
test('webhook rejects invalid secrets, deduplicates events and syncs current tracking', async () => {
  order.shipping.awb = 'TESTAWB123'; order.paymentMethod = 'COD'; order.paymentInfo.status = 'pending';
  const body = { awb: 'TESTAWB123', current_status: 'In Transit', current_timestamp: '10 11 2026 10:00:00' };
  const send = key => fetch(`${base}/api/webhooks/courier-events`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key }, body: JSON.stringify(body) });
  assert.equal((await send('wrong')).status, 401);
  assert.equal((await send(process.env.SHIPROCKET_WEBHOOK_KEY)).status, 200);
  const count = order.shipping.events.length;
  assert.equal((await send(process.env.SHIPROCKET_WEBHOOK_KEY)).status, 200);
  assert.equal(order.shipping.events.length, count); assert.equal(order.status, 'delivered'); assert.equal(order.paymentInfo.status, 'pending');
});
test('late tracking cannot regress a delivered order', async () => {
  order.status = 'delivered'; order.shipping.awb = 'TESTAWB123'; order.shipping.status = 'Delivered'; order.shipping.statusAt = new Date('2026-11-12');
  assert.equal((await action('track', undefined, 'GET')).status, 200);
  assert.equal(order.shipping.status, 'Delivered'); assert.equal(order.shipping.statusAt.toISOString(), '2026-11-12T00:00:00.000Z');
});
test('public pincode endpoint rejects malformed input without provider calls', async () => {
  assert.equal((await request('/delivery/check?pincode=000000', 'GET', undefined, '')).status, 400); assert.equal(calls.length, 0);
});
