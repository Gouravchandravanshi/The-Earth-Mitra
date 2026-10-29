const express = require("express");
const router = express.Router();
const { getAllAdminReviews, moderateReview } = require("../controllers/reviewController");
const { protect, adminOnly } = require("../middlewares/auth");

router.get("/", protect, adminOnly, getAllAdminReviews);
router.put("/:reviewId/visibility", protect, adminOnly, moderateReview);

module.exports = router;
