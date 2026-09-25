const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updatePassword,
  addAddress,
  deleteAddress,
} = require("../controllers/userController");
const { protect } = require("../middlewares/auth");

router.get("/me", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, updatePassword);
router.post("/address", protect, addAddress);
router.delete("/address/:id", protect, deleteAddress);

module.exports = router;