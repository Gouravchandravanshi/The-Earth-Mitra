const express = require("express");
const router = express.Router();
const { getDashboard } = require("../controllers/adminController");
const { protect, adminOnly } = require("../middlewares/auth");

router.get("/dashboard", protect, adminOnly, getDashboard);

module.exports = router;
