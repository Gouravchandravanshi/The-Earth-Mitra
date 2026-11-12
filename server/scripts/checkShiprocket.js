// Read-only live checks. Never creates orders, AWBs, pickups or wallet debits.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const { sr, pickupLocations, serviceability } = require('../services/shiprocket');
const { resolveSettings } = require('../services/shippingSettings');
const Product = require('../models/Product');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
async function checkLocalApi() {
  const { app } = require('../index');
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const unauthorized = await fetch(`${base}/api/admin/shipping/settings`);
    console.log(JSON.stringify({ check: 'admin_auth_guard', status: unauthorized.status, passed: unauthorized.status === 401 }));
    if (unauthorized.status !== 401) throw new Error('Auth guard failed');
    const admin = await User.findOne({ role: 'admin' }).select('_id');
    if (!admin) { console.log(JSON.stringify({ check: 'admin_routes', skipped: true, reason: 'No admin account in MongoDB.' })); return; }
    const token = jwt.sign({ id: String(admin._id) }, process.env.JWT_SECRET, { expiresIn: '1m' });
    for (const path of ['/api/health', '/api/admin/shipping/settings', '/api/admin/shipping/connection', '/api/admin/shipping/billing', '/api/orders/all']) {
      const response = await fetch(`${base}${path}`, { headers: { Cookie: `token=${token}` } });
      const data = await response.json();
      console.log(JSON.stringify({ check: 'live_local_api', path, status: response.status, passed: response.ok, ...(path.endsWith('/billing') ? { orderCount: data.count } : {}) }));
      if (!response.ok) throw new Error('Live API check failed');
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
}
async function main() {
  const locations = await pickupLocations();
  console.log(JSON.stringify({ check: 'authentication_and_pickup', connected: true, locations }));
  // Keys only help detect an unexpected account response without exposing PII.
  if (!locations.length) {
    const shape = await sr('GET', '/settings/company/pickup');
    console.log(JSON.stringify({ check: 'pickup_response_shape', keys: Object.keys(shape), dataKeys: Object.keys(shape.data || {}), message: typeof shape.message === 'string' ? shape.message.slice(0, 160) : undefined }));
  }
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000, autoIndex: false });
  const settings = await resolveSettings();
  const count = await Product.countDocuments();
  const ready = await Product.countDocuments({ 'shippingParcel.weightKg': { $gt: 0 }, 'shippingParcel.lengthCm': { $gt: 0 }, 'shippingParcel.breadthCm': { $gt: 0 }, 'shippingParcel.heightCm': { $gt: 0 } });
  console.log(JSON.stringify({ check: 'database_and_shipping_setup', connected: true, products: count, productsWithMeasurements: ready, pickupConfigured: Boolean(settings.pickupLocation && settings.pickupPincode) }));
  await checkLocalApi();
  if (settings.pickupPincode) {
    for (const pincode of ['462001', '110001', '400001']) {
      const couriers = await serviceability(settings, pincode, { weightKg: 1, lengthCm: 20, breadthCm: 15, heightCm: 10 });
      console.log(JSON.stringify({ check: 'serviceability', pincode, courierCount: couriers.length }));
    }
  } else console.log(JSON.stringify({ check: 'serviceability', skipped: true, reason: 'No pickup location available. Add a verified warehouse in Shiprocket.' }));
}
main().catch(error => { console.error(JSON.stringify({ check: 'failed', message: error.status ? error.message : 'Read-only live check could not finish.', code: error.cause?.code || error.code || error.name })); process.exitCode = 1; }).finally(() => mongoose.disconnect());
