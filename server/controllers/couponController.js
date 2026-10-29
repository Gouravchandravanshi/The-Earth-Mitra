const mongoose = require("mongoose");
const Coupon = require("../models/Coupon");

const invalid = (res, message) => res.status(400).json({ message });
const validObjectId = (value) => mongoose.isValidObjectId(value);
const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function validateCouponInput(body) {
  if (!isPlainObject(body)) return "A coupon object is required";
  const allowedFields = ["code", "discountType", "discountValue", "minOrderAmount", "usageLimit", "expiresAt", "isActive"];
  const unknownField = Object.keys(body).find((key) => !allowedFields.includes(key));
  if (unknownField) return `Unknown field: ${unknownField}`;

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return "code must be 3 to 32 letters, numbers, hyphens, or underscores";
  if (!["percent", "flat"].includes(body.discountType)) return "discountType must be percent or flat";
  const discountValue = Number(body.discountValue);
  if (!Number.isFinite(discountValue) || discountValue <= 0 || (body.discountType === "percent" && discountValue > 100)) {
    return body.discountType === "percent" ? "discountValue must be greater than 0 and at most 100" : "discountValue must be greater than 0";
  }
  const minOrderAmount = Number(body.minOrderAmount ?? 0);
  if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) return "minOrderAmount must be a non-negative number";
  const usageLimit = Number(body.usageLimit);
  if (!Number.isInteger(usageLimit) || usageLimit < 1) return "usageLimit must be a positive integer";
  const expiresAt = new Date(body.expiresAt);
  if (!body.expiresAt || Number.isNaN(expiresAt.getTime())) return "expiresAt must be a valid date";
  if (expiresAt <= new Date()) return "expiresAt must be in the future";
  if (body.isActive !== undefined && typeof body.isActive !== "boolean") return "isActive must be a boolean";
  return null;
}

const createCoupon = async (req, res) => {
  try {
    const validationError = validateCouponInput(req.body);
    if (validationError) return invalid(res, validationError);
    const coupon = await Coupon.create({
      code: req.body.code.trim().toUpperCase(),
      discountType: req.body.discountType,
      discountValue: Number(req.body.discountValue),
      minOrderAmount: Number(req.body.minOrderAmount ?? 0),
      usageLimit: Number(req.body.usageLimit),
      expiresAt: new Date(req.body.expiresAt),
      ...(req.body.isActive === undefined ? {} : { isActive: req.body.isActive }),
    });
    return res.status(201).json(coupon);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Coupon code already exists" });
    if (error.name === "ValidationError" || error.name === "CastError") return invalid(res, error.message);
    return res.status(500).json({ message: "Unable to create coupon" });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const code = typeof req.body?.code === "string" ? req.body.code.trim().toUpperCase() : "";
    const orderAmount = Number(req.body?.orderAmount);
    if (!code || code.length > 32) return invalid(res, "A valid coupon code is required");
    if (!Number.isFinite(orderAmount) || orderAmount < 0) return invalid(res, "orderAmount must be a non-negative number");

    const coupon = await Coupon.findOne({ code });
    if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });
    if (!coupon.isActive) return res.status(400).json({ message: "Coupon is no longer active" });
    if (new Date() > coupon.expiresAt) return res.status(400).json({ message: "Coupon has expired" });
    if (coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ message: "Coupon usage limit reached" });
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ message: `Minimum order amount is ₹${coupon.minOrderAmount}` });
    }

    let discount = coupon.discountType === "percent"
      ? (orderAmount * coupon.discountValue) / 100
      : coupon.discountValue;
    discount = Math.min(discount, orderAmount);
    return res.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount: Math.round(discount),
      finalAmount: Math.round(orderAmount - discount),
    });
  } catch {
    return res.status(500).json({ message: "Unable to apply coupon" });
  }
};

const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().select("code discountType discountValue minOrderAmount usageLimit usedCount expiresAt isActive createdAt updatedAt").sort({ createdAt: -1, _id: -1 }).lean();
    return res.json(coupons);
  } catch {
    return res.status(500).json({ message: "Unable to retrieve coupons" });
  }
};

const toggleCoupon = async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) return invalid(res, "Invalid coupon id");
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    return res.json({ message: `Coupon ${coupon.isActive ? "activated" : "deactivated"}`, coupon });
  } catch {
    return res.status(500).json({ message: "Unable to update coupon" });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) return invalid(res, "Invalid coupon id");
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    await coupon.deleteOne();
    return res.json({ message: "Coupon deleted" });
  } catch {
    return res.status(500).json({ message: "Unable to delete coupon" });
  }
};

module.exports = { createCoupon, applyCoupon, getAllCoupons, toggleCoupon, deleteCoupon };
