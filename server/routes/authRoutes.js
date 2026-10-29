const express = require("express");
const router = express.Router();
const { register, login, phoneTestLogin, requestEmailOtp, verifyEmailOtp, logout } = require("../controllers/authController");
const { protect } = require("../middlewares/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/phone-test-login", phoneTestLogin);
router.post("/email-otp/request", requestEmailOtp);
router.post("/email-otp/verify", verifyEmailOtp);
router.post("/logout", protect, logout);

module.exports = router;
