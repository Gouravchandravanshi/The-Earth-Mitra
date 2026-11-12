const test = require('node:test');
const assert = require('node:assert/strict');
const { createShiprocketClient, parcelValues, shiprocketPayload, totals } = require('../services/shiprocket');
const { packedCart } = require('../services/shippingSettings');
const { parseDate, statusFor, safeUrl } = require('../services/shipmentTracking');
const fixture = () => ({
  _id: '507f1f77bcf86cd799439011', createdAt: new Date('2026-11-10T00:00:00Z'), guestName: 'Test Buyer', guestEmail: 'buyer@example.test',
  items: [{ product: '507f1f77bcf86cd799439012', name: 'Rice', price: 120, qty: 2 }],
  shippingAddress: { firstName: 'Delivery', lastName: 'Buyer', street: 'Street 1', city: 'Bhopal', state: 'MP', pincode: '462001', phone: '9999999999' },
  billingAddress: { firstName: 'Billing', street: 'Street 2', city: 'Delhi', state: 'Delhi', pincode: '110001', phone: '8888888888' },
  subtotal: 240, shippingFee: 49, discount: 20, totalAmount: 269,
  parcel: { weightKg: 1, lengthCm: 20, breadthCm: 15, heightCm: 10 },
});
const response = (status, data) => ({ status, ok: status >= 200 && status < 300, json: async () => data });
test('payload preserves separate billing and delivery addresses, trusted totals and stable order reference', () => {
  const payload = shiprocketPayload(fixture(), { pickupLocation: 'Warehouse' });
  assert.equal(payload.order_id, 'EM-507f1f77bcf86cd799439011');
  assert.equal(payload.billing_address, 'Street 2'); assert.equal(payload.shipping_address, 'Street 1');
  assert.equal(payload.shipping_is_billing, false); assert.equal(payload.payment_method, 'Prepaid');
  assert.equal(payload.sub_total + payload.shipping_charges - payload.total_discount, 269);
  assert.equal(payload.order_date, '2026-11-10 05:30:00');
});
test('invalid parcels and inconsistent order billing cannot ship', () => {
  for (const weightKg of [0, -1, Infinity, 'oops']) assert.throws(() => parcelValues({ ...fixture().parcel, weightKg }));
  assert.throws(() => totals({ ...fixture(), totalAmount: 270 }), /reconcile/);
  assert.throws(() => shiprocketPayload(fixture(), {}), /pickup/);
});
test('checkout packing uses server product data and quantities; missing measurements fail closed', () => {
  const p = packedCart([{ product: { shippingParcel: fixture().parcel }, qty: 2 }]);
  assert.deepEqual(p, { weightKg: 2, lengthCm: 20, breadthCm: 15, heightCm: 20 });
  assert.throws(() => packedCart([{ product: { name: 'Unconfigured rice' }, qty: 1 }]), /measurements/);
});
test('parallel requests share one token; credentials are only sent to login', async () => {
  const calls = [];
  const client = createShiprocketClient(async (url, options) => { calls.push({ url, options }); return response(200, url.endsWith('/auth/login') ? { token: 'private-token' } : { data: [] }); }, { SHIPROCKET_EMAIL: 'api@example.test', SHIPROCKET_PASSWORD: 'private-password' });
  await Promise.all([client('GET', '/orders'), client('GET', '/orders')]);
  assert.equal(calls.filter(c => c.url.endsWith('/auth/login')).length, 1);
  assert.equal(calls[1].options.headers.Authorization, 'Bearer private-token');
  assert.equal(calls[1].options.body, undefined);
});
test('expired authorization retries once with a fresh login', async () => {
  let logins = 0, orders = 0;
  const client = createShiprocketClient(async url => url.endsWith('/auth/login') ? response(200, { token: `token-${++logins}` }) : ++orders === 1 ? response(401, {}) : response(200, { data: [] }), { SHIPROCKET_EMAIL: 'x', SHIPROCKET_PASSWORD: 'y' });
  await client('GET', '/orders'); assert.equal(logins, 2); assert.equal(orders, 2);
});
test('ambiguous POST failures are never automatically retried and provider secrets are not exposed', async () => {
  let attempts = 0;
  const client = createShiprocketClient(async url => { if (url.endsWith('/auth/login')) return response(200, { token: 'secret' }); attempts++; throw new Error('secret'); }, { SHIPROCKET_EMAIL: 'x', SHIPROCKET_PASSWORD: 'y' });
  await assert.rejects(client('POST', '/orders/create/adhoc', {}), e => e.status === 502 && !e.message.includes('secret'));
  assert.equal(attempts, 1);
});
test('provider application errors in HTTP 200 are rejected', async () => {
  const client = createShiprocketClient(async url => response(200, url.endsWith('/auth/login') ? { token: 'secret' } : { status_code: 422, message: 'private-password', errors: { x: 'bad' } }), { SHIPROCKET_EMAIL: 'x', SHIPROCKET_PASSWORD: 'y' });
  await assert.rejects(client('POST', '/orders/create/adhoc', {}), e => e.status === 502 && !e.message.includes('private-password'));
});
test('tracking treats RTO separately and never marks COD payment as paid', () => {
  assert.equal(statusFor(7), 'delivered'); assert.equal(statusFor(10), null); assert.equal(statusFor(18), 'shipped');
  assert.equal(parseDate('10 11 2026 12:30:00').toISOString(), '2026-11-10T07:00:00.000Z');
  assert.equal(parseDate('bad'), null); assert.equal(safeUrl('javascript:alert(1)'), '');
});
module.exports = { fixture };
