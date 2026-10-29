const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");

const invalid = (res, message) => res.status(400).json({ message });
const isId = mongoose.isValidObjectId;

const refreshRatingSummary = async (productId) => {
  const groups = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), isApproved: { $ne: false } } },
    { $group: { _id: "$rating", count: { $sum: 1 }, ratingTotal: { $sum: "$rating" } } },
  ]);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let count = 0;
  let ratingTotal = 0;
  for (const row of groups) {
    count += row.count;
    ratingTotal += row.ratingTotal;
    distribution[row._id] = row.count;
  }
  const average = count ? ratingTotal / count : 0;
  await Product.updateOne({ _id: productId }, {
    $set: { avgRating: Math.round(average * 10) / 10, numReviews: count, ratingDistribution: distribution },
  });
  return { average: Math.round(average * 10) / 10, count, distribution };
};

const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body || {};
    const productId = req.params.id;
    const unexpectedField = Object.keys(req.body || {}).find((field) => !["rating", "comment"].includes(field));
    if (unexpectedField) return invalid(res, `Unknown review field: ${unexpectedField}`);
    if (!isId(productId)) return invalid(res, "Invalid product id");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return invalid(res, "rating must be an integer from 1 to 5");
    if (typeof comment !== "string" || !comment.trim() || comment.trim().length > 2000) return invalid(res, "comment must contain 1 to 2000 characters");
    const product = await Product.findById(productId).select("_id");
    if (!product) return res.status(404).json({ message: "Product not found" });

    const hasPurchased = await Order.exists({ user: req.user._id, "items.product": productId, status: "delivered" });
    if (!hasPurchased) return res.status(403).json({ message: "You can only review products you have purchased and received" });

    const review = await Review.create({ user: req.user._id, product: productId, rating, comment: comment.trim() });
    const ratingSummary = await refreshRatingSummary(productId);
    await review.populate("user", "name avatar");
    return res.status(201).json({ review, ratingSummary });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "You have already reviewed this product" });
    if (error.name === "ValidationError" || error.name === "CastError") return invalid(res, error.message);
    return res.status(500).json({ message: "Unable to create review" });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const rating = req.query.rating === undefined ? undefined : Number(req.query.rating);
    if (!isId(productId)) return invalid(res, "Invalid product id");
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) return invalid(res, "page must be >= 1 and limit must be between 1 and 50");
    if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) return invalid(res, "rating must be an integer from 1 to 5");
    if (!await Product.exists({ _id: productId })) return res.status(404).json({ message: "Product not found" });

    const filter = { product: productId, isApproved: { $ne: false } };
    if (rating !== undefined) filter.rating = rating;
    const [total, reviews] = await Promise.all([
      Review.countDocuments(filter),
      Review.find(filter).select("rating comment createdAt user +demoData")
        .populate("user", "name avatar")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return res.json({ reviews: reviews.map(({ demoData, ...review }) => ({ ...review, sampleData: Boolean(demoData) })), page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to retrieve reviews" });
  }
};

const getAllAdminReviews = async (req, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 100);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return invalid(res, "page must be >= 1 and limit must be between 1 and 100");
    }
    const filter = {};
    if (req.query.status === "hidden") filter.isApproved = false;
    else if (req.query.status === "published") filter.isApproved = { $ne: false };
    else if (req.query.status !== undefined && req.query.status !== "all") return invalid(res, "status must be all, published, or hidden");

    const [total, reviews] = await Promise.all([
      Review.countDocuments(filter),
      Review.find(filter).select("rating comment isApproved createdAt product user +demoData")
        .populate("product", "name slug")
        .populate("user", "name email")
        .sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    return res.json({ reviews: reviews.map(({ demoData, ...review }) => ({ ...review, sampleData: Boolean(demoData) })), page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch {
    return res.status(500).json({ message: "Unable to retrieve admin reviews" });
  }
};

const moderateReview = async (req, res) => {
  try {
    if (!isId(req.params.reviewId)) return invalid(res, "Invalid review id");
    if (typeof req.body?.isApproved !== "boolean") return invalid(res, "isApproved must be a boolean");
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });
    review.isApproved = req.body.isApproved;
    await review.save();
    const ratingSummary = await refreshRatingSummary(review.product);
    await review.populate([{ path: "product", select: "name slug" }, { path: "user", select: "name email" }]);
    return res.json({ review, ratingSummary });
  } catch {
    return res.status(500).json({ message: "Unable to update review visibility" });
  }
};

const getReviewSummary = async (req, res) => {
  try {
    if (!isId(req.params.id)) return invalid(res, "Invalid product id");
    const product = await Product.findById(req.params.id).select("avgRating numReviews ratingDistribution").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    const distribution = Object.fromEntries([1, 2, 3, 4, 5].map((star) => [star, product.ratingDistribution?.[star] || 0]));
    return res.json({ average: product.avgRating || 0, count: product.numReviews || 0, distribution });
  } catch (error) {
    return res.status(500).json({ message: "Unable to retrieve rating summary" });
  }
};

const deleteReview = async (req, res) => {
  try {
    if (!isId(req.params.id) || !isId(req.params.reviewId)) return invalid(res, "Invalid product or review id");
    const review = await Review.findOne({ _id: req.params.reviewId, product: req.params.id });
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== "admin") return res.status(403).json({ message: "Not authorized" });
    await review.deleteOne();
    const ratingSummary = await refreshRatingSummary(req.params.id);
    return res.json({ message: "Review deleted", ratingSummary });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete review" });
  }
};

module.exports = { createReview, getProductReviews, getReviewSummary, deleteReview, getAllAdminReviews, moderateReview };
