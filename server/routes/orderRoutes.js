const express = require("express");
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPaymentAndCreateOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  createGuestRazorpayOrder,
  verifyGuestPayment,
} = require("../controllers/orderController");
const { protect, optionalProtect, adminOnly } = require("../middlewares/auth");

router.post("/create-razorpay-order", protect, createRazorpayOrder);
router.post("/verify-payment", protect, verifyPaymentAndCreateOrder);
router.post("/guest/create-razorpay-order", optionalProtect, createGuestRazorpayOrder);
router.post("/guest/verify-payment", verifyGuestPayment);
router.get("/my-orders", protect, getMyOrders);
router.get("/all", protect, adminOnly, getAllOrders);
router.get("/", protect, adminOnly, getAllOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;
