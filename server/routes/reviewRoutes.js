const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  createReview,
  getProductReviews,
  getReviewSummary,
  deleteReview,
} = require("../controllers/reviewController");
const { protect } = require("../middlewares/auth");

router.get("/summary", getReviewSummary);
router.get("/", getProductReviews);
router.post("/", protect, createReview);
router.delete("/:reviewId", protect, deleteReview);

module.exports = router;
