const ShippingSettings = require('../models/ShippingSettings');
const { pickupLocations, fail, parcelValues, serviceability } = require('./shiprocket');
async function getSettings() {
  const saved = await ShippingSettings.findById('shipping').lean();
  return {
    pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || '', pickupPincode: process.env.SHIPROCKET_PICKUP_PINCODE || '',
    businessName: process.env.BUSINESS_NAME || 'Earth Mitra Farmers', businessAddress: process.env.BUSINESS_ADDRESS || '',
    businessGstin: process.env.BUSINESS_GSTIN || '', ...saved,
  };
}
async function resolveSettings() {
  const settings = await getSettings();
  if (settings.pickupLocation && settings.pickupPincode) return settings;
  const locations = (await pickupLocations()).filter(p => p.active);
  const primary = locations.find(p => p.primary) || (locations.length === 1 ? locations[0] : null);
  return primary ? { ...settings, pickupLocation: primary.name, pickupPincode: primary.pincode } : settings;
}
function packedCart(items) {
  const parcel = { weightKg: 0, lengthCm: 0, breadthCm: 0, heightCm: 0 };
  for (const item of items) {
    let p;
    try { p = parcelValues(item.product?.shippingParcel); } catch { throw fail(`Shipping measurements for ${item.product?.name || 'a product'} are missing. Please contact the store before payment.`, 422); }
    // Each product's dimensions include its packaging; stack units vertically.
    parcel.weightKg += p.weightKg * item.qty;
    parcel.lengthCm = Math.max(parcel.lengthCm, p.lengthCm);
    parcel.breadthCm = Math.max(parcel.breadthCm, p.breadthCm);
    parcel.heightCm += p.heightCm * item.qty;
  }
  parcel.weightKg = Math.round(parcel.weightKg * 1000) / 1000;
  return parcelValues(parcel);
}
async function checkCheckoutDelivery(items, pincode) {
  const parcel = packedCart(items);
  const settings = await resolveSettings();
  const couriers = await serviceability(settings, pincode, parcel, false);
  if (!couriers.length) throw fail('No courier can deliver this parcel to your PIN code. Please use another delivery address.', 422);
  return parcel;
}
module.exports = { getSettings, resolveSettings, packedCart, checkCheckoutDelivery };
