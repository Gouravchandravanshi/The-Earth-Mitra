const crypto = require('crypto');
const Order = require('../models/Order');
const { sr, fail } = require('./shiprocket');
function parseDate(input) {
  const text = String(input || '');
  const match = text.match(/^(\d{2}) (\d{2}) (\d{4}) (\d{2}:\d{2}:\d{2})$/);
  const normalized = match ? `${match[3]}-${match[2]}-${match[1]}T${match[4]}+05:30` : /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(text) ? text.replace(' ', 'T') + '+05:30' : text;
  const date = new Date(normalized);
  return Number.isNaN(date.valueOf()) ? null : date;
}
function statusFor(id) {
  if (Number(id) === 7) return 'delivered';
  if ([8, 45].includes(Number(id))) return 'cancelled';
  if ([6, 17, 18, 19, 21, 22, 38, 42, 51].includes(Number(id))) return 'shipped';
  return null;
}
async function recordEvent(orderId, event) {
  const key = event.eventKey || crypto.createHash('sha256').update(JSON.stringify(event)).digest('hex');
  await Order.updateOne({ _id: orderId, 'shipping.events.eventKey': { $ne: key } }, {
    $push: { 'shipping.events': { $each: [{ ...event, eventKey: key }], $slice: -100 } },
  });
}
async function syncTracking(order) {
  if (!order.shipping?.awb) throw fail('Assign an AWB before tracking.', 409);
  const data = await sr('GET', `/courier/track/awb/${encodeURIComponent(order.shipping.awb)}`);
  const tracking = data.tracking_data;
  if (!tracking || Number(tracking.track_status) !== 1) throw fail('Courier tracking is not available yet. Try again after the courier scans the parcel.', 409);
  const summary = tracking.shipment_track?.[0] || {};
  const activities = tracking.shipment_track_activities || [];
  for (const activity of activities.slice(0, 50)) {
    await recordEvent(order._id, { status: String(activity.activity || activity.status || '').slice(0, 200), at: parseDate(activity.date) || new Date(0), location: String(activity.location || '').slice(0, 200) });
  }
  const observed = parseDate(activities[0]?.date) || new Date();
  const set = {
    'shipping.status': summary.current_status || 'Tracking active', 'shipping.statusAt': observed,
    'shipping.trackingUrl': safeUrl(tracking.track_url), 'shipping.estimatedDelivery': String(tracking.etd || ''), 'shipping.lastSyncedAt': new Date(),
  };
  const status = statusFor(tracking.shipment_status);
  if (status) set.status = status;
  // Older events must not regress current state, nor can delivered orders regress.
  const filter = { _id: order._id, $or: [{ 'shipping.statusAt': { $exists: false } }, { 'shipping.statusAt': { $lte: observed } }] };
  if (status !== 'delivered') filter.status = { $ne: 'delivered' };
  await Order.updateOne(filter, { $set: set });
  return { tracking: { status: summary.current_status, estimatedDelivery: tracking.etd, url: safeUrl(tracking.track_url), activities } };
}
function safeUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.toString() : ''; } catch { return ''; }
}
module.exports = { syncTracking, recordEvent, parseDate, statusFor, safeUrl };
