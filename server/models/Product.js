const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  { url: { type: String, trim: true }, public_id: { type: String, trim: true } },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    sku: { type: String, trim: true, uppercase: true, sparse: true, unique: true },
    description: { type: String, required: true, trim: true },
    mrp: { type: Number, min: 0, default: 0 },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    shippingParcel: {
      weightKg: { type: Number, min: 0.001 }, lengthCm: { type: Number, min: 0.5 },
      breadthCm: { type: Number, min: 0.5 }, heightCm: { type: Number, min: 0.5 },
    },
    images: { type: [imageSchema], default: [] },
    gallery: { type: [imageSchema], default: [] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    packContains: [{ type: String, trim: true, maxlength: 200 }],
    variants: [{
      name: { type: String, trim: true },
      sku: { type: String, trim: true, uppercase: true },
      price: { type: Number, min: 0 },
      stock: { type: Number, min: 0 },
      attributes: [{ name: { type: String, trim: true }, value: { type: String, trim: true } }],
    }],
    suitableUses: [{ type: String, trim: true }],
    storage: {
      instructions: { type: String, trim: true },
      minTemperatureC: { type: Number },
      maxTemperatureC: { type: Number },
    },
    allergenInfo: {
      status: { type: String, enum: ["unknown", "contains", "none_confirmed"], default: "unknown" },
      allergens: [{ type: String, trim: true }],
      warnings: [{ type: String, trim: true }],
    },
    shelfLife: {
      duration: { type: Number, min: 0 },
      unit: { type: String, enum: ["days", "months", "years"] },
      afterOpening: { type: String, trim: true },
    },
    // Legacy string labels are retained; structured records are optional and verified explicitly.
    eco_certified: { type: Boolean, default: false },
    origin: { type: String, default: "", trim: true },
    certifications: [{ type: String, trim: true }],
    organicCertifications: [{
      name: { type: String, required: true, trim: true },
      issuingAuthority: { type: String, trim: true },
      documentUrl: {
        type: String,
        trim: true,
        validate: { validator: (value) => !value || /^https?:\/\//i.test(value), message: "Certificate document URL must use HTTP or HTTPS" },
      },
      validFrom: { type: Date },
      validUntil: { type: Date },
      verificationStatus: { type: String, enum: ["unverified", "pending", "verified", "expired"], default: "unverified" },
    }],
    faqs: [{
      question: { type: String, required: true, trim: true, maxlength: 500 },
      answer: { type: String, required: true, trim: true, maxlength: 3000 },
    }],
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    ratingDistribution: {
      1: { type: Number, default: 0, min: 0 },
      2: { type: Number, default: 0, min: 0 },
      3: { type: Number, default: 0, min: 0 },
      4: { type: Number, default: 0, min: 0 },
      5: { type: Number, default: 0, min: 0 },
    },
    demoData: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ avgRating: -1, numReviews: -1 });

module.exports = mongoose.model("Product", productSchema);
