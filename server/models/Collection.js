const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  description: { type: String, trim: true, maxlength: 3000, default: "" },
  image: { type: String, trim: true, default: "", validate: { validator: value => !value || /^https?:\/\//i.test(value), message: "Image must be an HTTP or HTTPS URL" } },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, min: 0, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Collection", collectionSchema);
