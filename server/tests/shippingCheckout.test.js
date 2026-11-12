const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const CheckoutSession = require('../models/CheckoutSession');
const shipping = require('../services/shippingSettings');
const razorpayPath = require.resolve('../config/razorpay');
let paymentCreates = 0, snapshots = [], deliveryCalls = [], rejectDelivery = false;
require.cache[razorpayPath] = { id: razorpayPath, filename: razorpayPath, loaded: true, exports: { orders: { create: async payload => { paymentCreates++; return { id: 'order_test', amount: payload.amount, currency: 'INR' }; } } } };
process.env.RAZORPAY_KEY_SECRET = 'test-only-secret';
const originalDelivery = shipping.checkCheckoutDelivery;
const originalCheckoutCheck = process.env.SHIPROCKET_CHECKOUT_CHECK_ENABLED;
shipping.checkCheckoutDelivery = async (items, pin) => {
  const parcel = shipping.packedCart(items); deliveryCalls.push({ items, pin });
  if (rejectDelivery) throw Object.assign(new Error('No courier available'), { status: 422 });
  return parcel;
};
const controller = require('../controllers/orderController');
const productId = '507f1f77bcf86cd799439012', userId = '507f1f77bcf86cd799439099';
let product, checkout;
const originals = [Product.find, CheckoutSession.create, Cart.findOne, CheckoutSession.findOne];
Product.find = () => ({ select: async () => [product] });
CheckoutSession.create = async payload => { snapshots.push(payload); return payload; };
Cart.findOne = async () => ({ items: [{ product: productId, qty: 2 }] });
CheckoutSession.findOne = async () => checkout;
function req() {
  return { user: { _id: userId, email: 'buyer@example.test' }, body: { items: [{ productId, qty: 2, price: 0.01, weightKg: 0.001 }], email: 'buyer@example.test', shippingAddress: { firstName: 'Test', lastName: 'Buyer', street: 'Street one', city: 'Bhopal', state: 'MP', pincode: '462001', phone: '9999999999' } } };
}
function response() { return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } }; }
test.beforeEach(() => {
  delete process.env.SHIPROCKET_CHECKOUT_CHECK_ENABLED;
  product = { _id: productId, name: 'Test rice', price: 120, stock: 20, shippingParcel: { weightKg: 1, lengthCm: 20, breadthCm: 10, heightCm: 5 } };
  paymentCreates = 0; snapshots = []; deliveryCalls = []; rejectDelivery = false; checkout = null;
});
test.after(() => { [Product.find, CheckoutSession.create, Cart.findOne, CheckoutSession.findOne] = originals; shipping.checkCheckoutDelivery = originalDelivery; if (originalCheckoutCheck === undefined) delete process.env.SHIPROCKET_CHECKOUT_CHECK_ENABLED; else process.env.SHIPROCKET_CHECKOUT_CHECK_ENABLED = originalCheckoutCheck; });

test('temporary bypass accepts guest checkout without measurements or courier lookup', async () => {
  process.env.SHIPROCKET_CHECKOUT_CHECK_ENABLED = 'false';
  product.shippingParcel = undefined; rejectDelivery = true;
  const res = response(); await controller.createGuestRazorpayOrder(req(), res);
  assert.equal(res.statusCode, 201); assert.equal(paymentCreates, 1); assert.equal(deliveryCalls.length, 0);
  assert.equal(snapshots[0].parcel, undefined);
  assert.equal(snapshots[0].totalAmount, 289); assert.equal(res.data.amount, 28900);
});

test('temporary bypass also accepts authenticated cart checkout and retains trusted measurements', async () => {
  process.env.SHIPROCKET_CHECKOUT_CHECK_ENABLED = 'false'; rejectDelivery = true;
  const res = response(); await controller.createRazorpayOrder(req(), res);
  assert.equal(res.statusCode, 201); assert.equal(deliveryCalls.length, 0); assert.equal(snapshots[0].user, userId);
  assert.deepEqual(snapshots[0].parcel, { weightKg: 2, lengthCm: 20, breadthCm: 10, heightCm: 10 });
});

test('temporary bypass still rejects invalid addresses and insufficient stock before payment', async () => {
  process.env.SHIPROCKET_CHECKOUT_CHECK_ENABLED = 'false';
  const request = req(); request.body.shippingAddress.pincode = '123';
  const invalid = response(); await controller.createGuestRazorpayOrder(request, invalid);
  assert.equal(invalid.statusCode, 400);
  product.stock = 0;
  const unavailable = response(); await controller.createGuestRazorpayOrder(req(), unavailable);
  assert.equal(unavailable.statusCode, 409); assert.equal(paymentCreates, 0);
});

test('checkout serviceability can be enabled again without changing code', async () => {
  process.env.SHIPROCKET_CHECKOUT_CHECK_ENABLED = 'true'; rejectDelivery = true;
  const res = response(); await controller.createGuestRazorpayOrder(req(), res);
  assert.equal(res.statusCode, 422); assert.equal(deliveryCalls.length, 1); assert.equal(paymentCreates, 0);
});
test('checkout checks trusted parcel before payment and saves identical parcel snapshot', async () => {
  const res = response(); await controller.createGuestRazorpayOrder(req(), res);
  assert.equal(res.statusCode, 201); assert.equal(paymentCreates, 1);
  assert.equal(deliveryCalls[0].items[0].product.price, 120);
  assert.equal(snapshots[0].totalAmount, 289); assert.equal(res.data.amount, 28900);
  assert.deepEqual(snapshots[0].parcel, { weightKg: 2, lengthCm: 20, breadthCm: 10, heightCm: 10 });
});
test('missing measurements and no courier availability block payment creation', async () => {
  product.shippingParcel = undefined;
  const missing = response(); await controller.createGuestRazorpayOrder(req(), missing);
  assert.equal(missing.statusCode, 422); assert.equal(paymentCreates, 0);
  product.shippingParcel = { weightKg: 1, lengthCm: 20, breadthCm: 10, heightCm: 5 }; rejectDelivery = true;
  const unavailable = response(); await controller.createGuestRazorpayOrder(req(), unavailable);
  assert.equal(unavailable.statusCode, 422); assert.equal(paymentCreates, 0);
});
test('authenticated cart checkout shares shipping verification and stored prices', async () => {
  const res = response(); await controller.createRazorpayOrder(req(), res);
  assert.equal(res.statusCode, 201); assert.equal(deliveryCalls.length, 1); assert.equal(snapshots[0].user, userId);
});
test('authenticated verification cannot access another user checkout', async () => {
  checkout = { user: 'another-user' };
  const res = response(); await controller.verifyPaymentAndCreateOrder(req(), res);
  assert.equal(res.statusCode, 404);
});
test('completed checkout still requires a valid payment signature', async () => {
  checkout = { status: 'completed', order: 'saved-order' };
  const request = req(); request.body = { razorpay_order_id: 'order_test', razorpay_payment_id: 'pay_test', razorpay_signature: '00' };
  const res = response(); await controller.verifyGuestPayment(request, res);
  assert.equal(res.statusCode, 400);
});
