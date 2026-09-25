const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  image: String,
  price: Number,
  qty: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      phone: String,
    },
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);