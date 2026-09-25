const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");

const createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const hasPurchased = await Order.findOne({
      user: req.user._id,
      "items.product": productId,
      status: "delivered",
    });

    if (!hasPurchased) {
      return res.status(403).json({
        message: "You can only review products you have purchased and received",
      });
    }

    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      product: productId,
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating,
      comment,
    });

    const allReviews = await Review.find({ product: productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    product.avgRating = Math.round(avgRating * 10) / 10;
    product.numReviews = allReviews.length;
    await product.save();

    await review.populate("user", "name avatar");
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await review.deleteOne();

    const allReviews = await Review.find({ product: req.params.id });
    const product = await Product.findById(req.params.id);

    if (allReviews.length === 0) {
      product.avgRating = 0;
      product.numReviews = 0;
    } else {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      product.avgRating = Math.round(avgRating * 10) / 10;
      product.numReviews = allReviews.length;
    }

    await product.save();
    res.json({ message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReview, getProductReviews, deleteReview };