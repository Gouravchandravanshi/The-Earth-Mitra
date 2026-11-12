const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  image: String,
  price: Number,
  qty: { type: Number, required: true },
});
const addressSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  company: String,
  street: { type: String, required: true },
  apartment: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  phone: { type: String, required: true },
  country: { type: String, default: "India" },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestName: { type: String, default: "" },
    guestEmail: { type: String, lowercase: true, trim: true, default: "" },
    guestPhone: { type: String, default: "" },
    items: [orderItemSchema],
    shippingAddress: { type: addressSchema, required: true },
    billingAddress: { type: addressSchema },
    subtotal: { type: Number, min: 0, default: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: "" },
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['Prepaid', 'COD'], default: 'Prepaid' },
    approval: { type: String, enum: ['pending', 'approved'], default: 'pending' },
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    parcel: { weightKg: Number, lengthCm: Number, breadthCm: Number, heightCm: Number },
    shipping: {
      shiprocketOrderId: Number, shipmentId: Number, awb: String,
      courierId: Number, courierName: String, quotedRate: Number,
      pickupLocation: String, pickupPincode: String,
      status: String, statusAt: Date, pickupRequested: Boolean,
      labelUrl: String, manifestUrl: String, invoiceUrl: String,
      trackingUrl: String, estimatedDelivery: String, lastSyncedAt: Date,
      operation: String, pendingAction: String, operationStartedAt: Date, needsReview: { type: Boolean, default: false },
      events: [{ status: String, at: Date, location: String, eventKey: String }],
    },
    invoice: { number: String, issuedAt: Date },
    shippingAudit: [{ action: String, at: Date, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, outcome: String }],
    status: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
    paymentInfo: {
      razorpay_order_id: String,
      razorpay_payment_id: String,
      status: { type: String, default: "pending" },
    },
    confirmationEmailStatus: {
      type: String,
      enum: ["pending", "sending", "sent", "failed"],
      default: "pending",
      index: true,
    },
    confirmationEmailSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
