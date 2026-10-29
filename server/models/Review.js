const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
    // Existing reviews remain visible by default; admins can hide them later.
    isApproved: { type: Boolean, default: true },
    demoData: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1, _id: -1 });
reviewSchema.index({ product: 1, rating: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
