const express = require("express");
const router = express.Router();
const {
  createCoupon,
  applyCoupon,
  getAllCoupons,
  toggleCoupon,
  deleteCoupon,
} = require("../controllers/couponController");
const { protect, adminOnly } = require("../middlewares/auth");

router.get("/", protect, adminOnly, getAllCoupons);
router.post("/", protect, adminOnly, createCoupon);
router.post("/apply", protect, applyCoupon);
router.put("/:id/toggle", protect, adminOnly, toggleCoupon);
router.delete("/:id", protect, adminOnly, deleteCoupon);

module.exports = router;