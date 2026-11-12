const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const pinPattern = /^[1-9][0-9]{5}$/;

// Tokens stay on the server, shared by concurrent requests, and are never logged.
function createShiprocketClient(fetcher = (...args) => fetch(...args), env = process.env) {
  let token, expires = 0, login;
  async function request(method, path, body, params, retry = true) {
    if (!env.SHIPROCKET_EMAIL || !env.SHIPROCKET_PASSWORD) throw fail('Shiprocket credentials are not configured on the server.', 503);
    if (!token || Date.now() >= expires) {
      if (!login) login = (async () => {
        const response = await fetcher(`${BASE_URL}/auth/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: env.SHIPROCKET_EMAIL, password: env.SHIPROCKET_PASSWORD }), signal: AbortSignal.timeout(25000),
        });
        const data = await response.json();
        if (!response.ok || !data.token) throw fail('Shiprocket login failed. Check the API user credentials in server/.env.', 503);
        token = data.token; expires = Date.now() + 8 * 86400000;
      })().finally(() => { login = null; });
      try { await login; } catch (error) { throw error.status ? error : fail('Unable to connect to Shiprocket authentication.', 503); }
    }
    const url = new URL(BASE_URL + path);
    for (const [key, value] of Object.entries(params || {})) if (value !== undefined) url.searchParams.set(key, String(value));
    let response, data;
    try {
      response = await fetcher(url.toString(), {
        method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(25000),
      });
      data = await response.json();
    } catch { throw fail('Shiprocket did not confirm the request. Reconcile the order before repeating shipment actions.', 502); }
    if (response.status === 401 && retry) { token = null; return request(method, path, body, params, false); }
    if (!response.ok || data.status_code >= 400 || data.error || data.errors || data.success === false) {
      // Do not return provider bodies: they can contain credentials or customer data.
      throw fail(`Shiprocket rejected the request (HTTP ${response.status}, code ${Number(data.status_code) || response.status}). Check the account, wallet, address and shipment status.`, response.status === 429 ? 503 : 502);
    }
    return data;
  }
  return request;
}
const sr = createShiprocketClient();
function parcelValues(input = {}) {
  const parcel = {};
  for (const key of ['weightKg', 'lengthCm', 'breadthCm', 'heightCm']) {
    const value = Number(input[key]);
    if (!Number.isFinite(value) || value < (key === 'weightKg' ? 0.001 : 0.5) || value > (key === 'weightKg' ? 1000 : 500)) throw fail('Enter a valid packed weight (kg) and dimensions of at least 0.5 cm.');
    parcel[key] = value;
  }
  return parcel;
}
function orderReference(order) { return `EM-${order._id}`; }
function totals(order) {
  const subtotal = Math.round(order.items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0) * 100) / 100;
  const shipping = Number(order.shippingFee || 0), discount = Number(order.discount || 0);
  if (![subtotal, shipping, discount, Number(order.totalAmount)].every(Number.isFinite) || Math.abs(subtotal + shipping - discount - order.totalAmount) > 0.02) throw fail('Order totals do not reconcile. Review billing before shipping.', 409);
  return { subtotal, shipping, discount, total: Number(order.totalAmount) };
}
function shiprocketPayload(order, settings) {
  const parcel = parcelValues(order.parcel);
  const billing = order.billingAddress || order.shippingAddress, shipping = order.shippingAddress;
  const email = order.guestEmail || order.user?.email;
  if (!email || !pinPattern.test(String(shipping.pincode)) || !/^\d{10}$/.test(String(shipping.phone).replace(/^\+91/, ''))) throw fail('Order email, phone or delivery PIN is incomplete.', 409);
  const address = (prefix, a) => ({
    [`${prefix}_customer_name`]: a.firstName || order.guestName || order.user?.name || 'Customer',
    [`${prefix}_last_name`]: a.lastName || '', [`${prefix}_address`]: a.street,
    [`${prefix}_address_2`]: a.apartment || '', [`${prefix}_city`]: a.city,
    [`${prefix}_pincode`]: a.pincode, [`${prefix}_state`]: a.state,
    [`${prefix}_country`]: a.country || 'India', [`${prefix}_email`]: email,
    [`${prefix}_phone`]: String(a.phone).replace(/^\+91/, ''),
  });
  const amounts = totals(order);
  if (!settings.pickupLocation) throw fail('Select a verified pickup location in Shipping settings.', 409);
  return {
    order_id: orderReference(order), order_date: new Date(new Date(order.createdAt).getTime() + 19800000).toISOString().slice(0, 19).replace('T', ' '),
    pickup_location: settings.pickupLocation, ...address('billing', billing), shipping_is_billing: false, ...address('shipping', shipping),
    order_items: order.items.map(item => ({ name: item.name, sku: item.sku || String(item.product?._id || item.product), units: item.qty, selling_price: item.price, discount: 0 })),
    payment_method: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid', shipping_charges: amounts.shipping,
    total_discount: amounts.discount, sub_total: amounts.subtotal,
    length: parcel.lengthCm, breadth: parcel.breadthCm, height: parcel.heightCm, weight: parcel.weightKg,
  };
}
async function pickupLocations() {
  const data = await sr('GET', '/settings/company/pickup');
  const locations = data.data?.shipping_address || data.shipping_address || (Array.isArray(data.data) ? data.data : []);
  return locations.map(p => ({ id: p.id, name: p.pickup_location, pincode: String(p.pin_code || p.pincode || ''), active: ![0, '0', false].includes(p.status), primary: [1, '1', true].includes(p.is_primary_location) }));
}
async function serviceability(settings, pincode, parcel, cod = false, orderId) {
  if (!pinPattern.test(String(pincode))) throw fail('Enter a valid 6-digit Indian PIN code.');
  if (!pinPattern.test(String(settings.pickupPincode))) throw fail('Select the pickup warehouse in Admin > Shipping settings.', 503);
  const p = parcelValues(parcel);
  const data = await sr('GET', '/courier/serviceability/', undefined, {
    pickup_postcode: settings.pickupPincode, delivery_postcode: pincode, weight: p.weightKg, cod: cod ? 1 : 0,
    length: p.lengthCm, breadth: p.breadthCm, height: p.heightCm, ...(orderId ? { order_id: orderId } : {}),
  });
  const list = data.data?.available_courier_companies;
  if (!Array.isArray(list)) throw fail('Shiprocket could not confirm courier availability. Please retry.', 503);
  return list.filter(c => ![1, '1', true].includes(c.blocked)).map(c => ({
    id: Number(c.courier_company_id), name: c.courier_name, rate: Number(c.rate), etd: c.etd || '',
    estimatedDays: c.estimated_delivery_days, rating: c.rating,
  })).filter(c => c.id > 0 && Number.isFinite(c.rate));
}
module.exports = { sr, fail, pinPattern, parcelValues, orderReference, totals, shiprocketPayload, pickupLocations, serviceability, createShiprocketClient };
