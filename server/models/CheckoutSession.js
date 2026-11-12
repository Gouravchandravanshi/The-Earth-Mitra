const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  firstName: { type: String, trim: true, maxlength: 80 },
  lastName: { type: String, trim: true, maxlength: 80 },
  company: { type: String, trim: true, maxlength: 120 },
  street: { type: String, required: true, trim: true, maxlength: 240 },
  apartment: { type: String, trim: true, maxlength: 120 },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  state: { type: String, required: true, trim: true, maxlength: 100 },
  pincode: { type: String, required: true, trim: true, match: /^\d{6}$/ },
  phone: { type: String, required: true, trim: true, match: /^\d{10}$/ },
  country: { type: String, default: "India", trim: true },
}, { _id: false });

const checkoutSessionSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
  }],
  customerName: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  shippingAddress: { type: addressSchema, required: true },
  parcel: { weightKg: Number, lengthCm: Number, breadthCm: Number, heightCm: Number },
  billingAddress: { type: addressSchema, required: true },
  subtotal: { type: Number, required: true, min: 0 },
  shippingFee: { type: Number, required: true, min: 0, default: 0 },
  discount: { type: Number, required: true, min: 0, default: 0 },
  couponCode: { type: String, default: "" },
  totalAmount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["pending", "processing", "completed", "failed", "refunded", "needs_review"], default: "pending", index: true },
  paymentId: { type: String, default: "" },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

module.exports = mongoose.model("CheckoutSession", checkoutSessionSchema);
