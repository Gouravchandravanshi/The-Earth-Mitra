const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const CheckoutSession = require("../models/CheckoutSession");
const { sendOrderConfirmationEmail } = require("../utils/orderConfirmationEmail");
const razorpay = require("../config/razorpay");
const { checkCheckoutDelivery, packedCart } = require('../services/shippingSettings');

const SHIPPING_THRESHOLD = 599;
const STANDARD_SHIPPING_FEE = 49;

function cleanAddress(input) {
  if (!input || typeof input !== "object") return null;
  const address = {
    firstName: String(input.firstName || "").trim(),
    lastName: String(input.lastName || "").trim(),
    company: String(input.company || "").trim(),
    street: String(input.street || "").trim(),
    apartment: String(input.apartment || "").trim(),
    city: String(input.city || "").trim(),
    state: String(input.state || "").trim(),
    pincode: String(input.pincode || "").trim(),
    phone: String(input.phone || "").replace(/\D/g, "").slice(-10),
    country: "India",
  };
  if (!address.firstName || !address.lastName || !address.street || !address.city || !address.state
    || !/^\d{6}$/.test(address.pincode) || !/^\d{10}$/.test(address.phone)) return null;
  return address;
}

function calculateCouponDiscount(coupon, subtotal) {
  if (coupon.discountType === "percent") return Math.min(subtotal, subtotal * coupon.discountValue / 100);
  return Math.min(subtotal, coupon.discountValue);
}

function safeStringEqual(left, right) {
  const a = Buffer.from(String(left || ""), "hex");
  const b = Buffer.from(String(right || ""), "hex");
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}

const createGuestRazorpayOrder = async (req, res) => {
  try {
    if (!razorpay) return res.status(503).json({ message: "Online payments are not configured yet. Add Razorpay credentials to the server environment." });
    const { items, email, shippingAddress, billingAddress, couponCode } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ message: "Enter a valid email address" });
    if (!Array.isArray(items) || items.length < 1 || items.length > 50) return res.status(400).json({ message: "Your cart must contain between 1 and 50 products" });
    const shipTo = cleanAddress(shippingAddress);
    const billTo = billingAddress ? cleanAddress(billingAddress) : shipTo;
    if (!shipTo) return res.status(400).json({ message: "Enter a valid delivery address with a 10 digit phone number and 6 digit PIN code" });
    if (!billTo) return res.status(400).json({ message: "Enter a valid billing address" });

    const quantities = new Map();
    for (const line of items) {
      const productId = String(line?.productId || "");
      const qty = Number(line?.qty);
      if (!mongoose.isValidObjectId(productId) || !Number.isInteger(qty) || qty < 1 || qty > 100) {
        return res.status(400).json({ message: "One or more cart items are invalid. Refresh your cart and try again." });
      }
      quantities.set(productId, (quantities.get(productId) || 0) + qty);
    }
    if ([...quantities.values()].some((qty) => qty > 100)) return res.status(400).json({ message: "A product quantity cannot exceed 100" });
    const products = await Product.find({ _id: { $in: [...quantities.keys()] } }).select("name price discountPrice stock images gallery shippingParcel");
    if (products.length !== quantities.size) return res.status(400).json({ message: "A product in your cart is no longer available" });
    const productById = new Map(products.map((product) => [product._id.toString(), product]));
    const orderItems = [...quantities].map(([id, qty]) => {
      const product = productById.get(id);
      if (product.stock < qty) throw Object.assign(new Error(`${product.name} has only ${product.stock} left in stock`), { status: 409 });
      const price = product.discountPrice > 0 && product.discountPrice < product.price ? product.discountPrice : product.price;
      const images = product.gallery?.length ? product.gallery : product.images;
      return { product: product._id, name: product.name, image: images?.[0]?.url || "", price, qty };
    });
    const subtotal = Math.round(orderItems.reduce((sum, item) => sum + item.price * item.qty, 0) * 100) / 100;
    const shippingFee = subtotal >= SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    let discount = 0;
    let normalizedCouponCode = "";
    if (couponCode) {
      normalizedCouponCode = String(couponCode).trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: normalizedCouponCode });
      if (!coupon || !coupon.isActive || coupon.expiresAt <= new Date() || coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ message: "This coupon is invalid, expired, or has reached its usage limit" });
      }
      if (subtotal < coupon.minOrderAmount) return res.status(400).json({ message: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}` });
      discount = Math.round(calculateCouponDiscount(coupon, subtotal) * 100) / 100;
    }
    const totalAmount = Math.round((subtotal + shippingFee - discount) * 100) / 100;
    if (totalAmount < 1) return res.status(400).json({ message: "The order total must be at least ₹1" });

    const customerName = `${shipTo.firstName} ${shipTo.lastName}`.trim();
    const shippingItems = [...quantities].map(([id, qty]) => ({ product: productById.get(id), qty }));
    let parcel;
    if (process.env.SHIPROCKET_CHECKOUT_CHECK_ENABLED?.trim().toLowerCase() === 'false') {
      // Temporary checkout bypass: retain known measurements without requiring
      // courier setup. Missing measurements can be entered by admin before dispatch.
      try { parcel = packedCart(shippingItems); }
      catch (error) { if (error.status !== 422) throw error; }
    } else {
      parcel = await checkCheckoutDelivery(shippingItems, shipTo.pincode);
    }
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `guest_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    });
    await CheckoutSession.create({
      razorpayOrderId: razorpayOrder.id,
      user: req.user?._id || null,
      items: orderItems,
      customerName,
      email: normalizedEmail,
      phone: shipTo.phone,
      shippingAddress: shipTo,
      parcel,
      billingAddress: billTo,
      subtotal,
      shippingFee,
      discount,
      couponCode: normalizedCouponCode,
      totalAmount,
      currency: "INR",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    return res.status(201).json({
      key_id: process.env.RAZORPAY_KEY_ID,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      customer: { name: customerName, email: normalizedEmail, contact: shipTo.phone },
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: "Unable to start checkout. Please try again." });
  }
};

const verifyGuestPayment = async (req, res) => {
  try {
    if (!razorpay || !process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ message: "Online payments are not configured" });
    const { razorpay_order_id: razorpayOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
    if (!razorpayOrderId || !paymentId || !signature) return res.status(400).json({ message: "Payment verification details are incomplete" });
    const checkout = await CheckoutSession.findOne({ razorpayOrderId });
    if (!checkout) return res.status(404).json({ message: "Checkout session not found or expired" });
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${paymentId}`).digest("hex");
    if (!safeStringEqual(expectedSignature, signature)) return res.status(400).json({ message: "Payment verification failed" });
    if (checkout.status === "completed" && checkout.order) {
      const existingOrder = await Order.findById(checkout.order);
      if (existingOrder) await sendOrderConfirmationEmail(existingOrder._id);
      return res.json({ message: "Order already placed", order: existingOrder });
    }
    if (checkout.expiresAt <= new Date()) return res.status(410).json({ message: "Checkout expired. Please start again." });
    if (checkout.status !== "pending") return res.status(409).json({ message: "This payment is already being processed or needs support" });

    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.order_id !== razorpayOrderId || Number(payment.amount) !== Math.round(checkout.totalAmount * 100) || payment.currency !== checkout.currency) {
      return res.status(400).json({ message: "Payment details do not match this checkout" });
    }
    if (payment.status === "authorized") {
      await razorpay.payments.capture(paymentId, payment.amount, payment.currency);
    } else if (payment.status !== "captured") {
      return res.status(400).json({ message: "Payment has not been captured" });
    }

    const claimed = await CheckoutSession.findOneAndUpdate(
      { _id: checkout._id, status: "pending" },
      { $set: { status: "processing", paymentId } },
      { new: true }
    );
    if (!claimed) return res.status(409).json({ message: "This payment is already being processed" });

    const decremented = [];
    try {
      for (const item of claimed.items) {
        const result = await Product.updateOne({ _id: item.product, stock: { $gte: item.qty } }, { $inc: { stock: -item.qty } });
        if (!result.modifiedCount) throw new Error(`${item.name} is no longer available in the requested quantity`);
        decremented.push(item);
      }
      const order = await Order.create({
        user: claimed.user || null,
        guestName: claimed.customerName,
        guestEmail: claimed.email,
        guestPhone: claimed.phone,
        items: claimed.items,
        shippingAddress: claimed.shippingAddress,
        parcel: claimed.parcel,
        billingAddress: claimed.billingAddress,
        subtotal: claimed.subtotal,
        shippingFee: claimed.shippingFee,
        couponCode: claimed.couponCode,
        totalAmount: claimed.totalAmount,
        discount: claimed.discount,
        paymentInfo: { razorpay_order_id: razorpayOrderId, razorpay_payment_id: paymentId, status: "paid" },
      });
      if (claimed.couponCode) {
        await Coupon.updateOne({ code: claimed.couponCode }, { $inc: { usedCount: 1 } });
      }
      await CheckoutSession.updateOne({ _id: claimed._id }, { $set: { status: "completed", order: order._id } });
      // Email delivery is best-effort after the paid order has been committed.
      // The mail helper handles its own failures so a Resend outage cannot
      // turn a successful payment into an order failure or refund.
      await sendOrderConfirmationEmail(order._id);
      return res.status(201).json({ message: "Order placed successfully", order });
    } catch (error) {
      for (const item of decremented) await Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } });
      try {
        await razorpay.payments.refund(paymentId, { amount: payment.amount });
        await CheckoutSession.updateOne({ _id: claimed._id }, { $set: { status: "refunded" } });
      } catch {
        await CheckoutSession.updateOne({ _id: claimed._id }, { $set: { status: "needs_review" } });
      }
      return res.status(409).json({ message: "Payment was received but we could not complete the order. If it is not refunded shortly, contact support with payment reference " + paymentId });
    }
  } catch (error) {
    return res.status(500).json({ message: "Unable to verify payment right now. Please contact support if your account was charged." });
  }
};

// Both checkout entry points use the same trusted price, address and parcel snapshot.
const createRazorpayOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart?.items?.length) return res.status(400).json({ message: "Cart is empty" });
    req.body = {
      ...(req.body || {}), email: req.user.email,
      items: cart.items.map(item => ({ productId: String(item.product?._id || item.product), qty: item.qty })),
    };
    return createGuestRazorpayOrder(req, res);
  } catch { return res.status(500).json({ message: "Unable to start checkout. Please retry." }); }
};

const verifyPaymentAndCreateOrder = async (req, res) => {
  try {
    const checkout = await CheckoutSession.findOne({ razorpayOrderId: req.body?.razorpay_order_id });
    if (!checkout || String(checkout.user) !== String(req.user._id)) return res.status(404).json({ message: "Checkout session not found" });
    return verifyGuestPayment(req, res);
  } catch { return res.status(500).json({ message: "Unable to verify payment. Please retry." }); }
};

const getMyOrders = async (req, res) => {
  try {
    const ownership = [{ user: req.user._id }];
    if (req.user.email) ownership.push({ user: null, guestEmail: req.user.email.trim().toLowerCase() });
    const orders = await Order.find({ $or: ownership })
      .sort({ createdAt: -1 })
      .populate("items.product", "name images");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name images")
      .populate("user", "name email phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const orderUserId = order.user?._id || order.user;
    const ownsUserOrder = orderUserId && orderUserId.toString() === req.user._id.toString();
    const ownsGuestOrder = !order.user && order.guestEmail && order.guestEmail.toLowerCase() === req.user.email?.toLowerCase();
    if (!ownsUserOrder && !ownsGuestOrder && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("items.product", "name");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }
    const { status } = req.body || {};
    const allowedStatuses = ["processing", "shipped", "delivered", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowedStatuses.join(", ")}` });
    }
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.shipping?.shipmentId || order.shipping?.operation || order.shipping?.pendingAction || order.shipping?.needsReview) {
      return res.status(409).json({ message: "Use Shiprocket tracking, cancellation or reconciliation for this order." });
    }
    order.status = status;
    await order.save();
    return res.json({ message: "Order status updated", order });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Unable to update order status" });
  }
};

module.exports = {
  createGuestRazorpayOrder,
  verifyGuestPayment,
  createRazorpayOrder,
  verifyPaymentAndCreateOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
