const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  altText: { type: String, trim: true, maxlength: 240, default: "" },
  desktopImage: { type: String, required: true, trim: true, match: /^https?:\/\//i },
  mobileImage: { type: String, required: true, trim: true, match: /^https?:\/\//i },
  link: { type: String, trim: true, maxlength: 500, default: "/products" },
  placement: { type: String, enum: ["hero", "midpage", "promo"], default: "hero", index: true },
  sortOrder: { type: Number, min: 0, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  startsAt: { type: Date, default: null },
  endsAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Banner", bannerSchema);
