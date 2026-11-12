const mongoose = require("mongoose");

const contentPostSchema = new mongoose.Schema({
  type: { type: String, enum: ["blog", "recipe"], required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, trim: true, lowercase: true, index: true },
  excerpt: { type: String, required: true, trim: true, maxlength: 600 },
  content: { type: String, required: true, trim: true, maxlength: 50000 },
  coverImage: { type: String, trim: true, default: "", validate: { validator: value => !value || /^https?:\/\//i.test(value), message: "Cover image must be an HTTP or HTTPS URL" } },
  category: { type: String, trim: true, maxlength: 80, default: "" },
  author: { type: String, trim: true, maxlength: 100, default: "Earth Mitra" },
  readTime: { type: Number, min: 1, max: 240, default: 5 },
  tags: [{ type: String, trim: true, maxlength: 40 }],
  isPublished: { type: Boolean, default: false, index: true },
  publishedAt: { type: Date, default: null },
}, { timestamps: true });

contentPostSchema.index({ type: 1, slug: 1 }, { unique: true });
contentPostSchema.index({ type: 1, isPublished: 1, publishedAt: -1 });

module.exports = mongoose.model("ContentPost", contentPostSchema);
