const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  createReview,
  getProductReviews,
  deleteReview,
} = require("../controllers/reviewController");
const { protect, adminOnly } = require("../middlewares/auth");

router.get("/", getProductReviews);
router.post("/", protect, createReview);
router.delete("/:reviewId", protect, deleteReview);

module.exports = router;