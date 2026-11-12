const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  _id: { type: String, default: 'shipping' },
  pickupLocation: String, pickupPincode: String,
  businessName: { type: String, default: 'Earth Mitra Farmers' }, businessAddress: String, businessGstin: String,
}, { timestamps: true });
module.exports = mongoose.model('ShippingSettings', schema);
