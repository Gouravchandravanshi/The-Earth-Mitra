const express = require("express");
const router = express.Router();
const { upload, uploadToCloudinary } = require("../utils/cloudinary");
const { protect, adminOnly } = require("../middlewares/auth");

router.post("/images", protect, adminOnly, (req, res, next) => {
  upload.array("images", 5)(req, res, error => {
    if (error) return res.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Each image must be 5 MB or smaller" : error.message || "Upload up to five image files only" });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ message: "Select at least one image" });
    const images = await Promise.all(req.files.map(file => uploadToCloudinary(file.buffer, "earth-mitra/content")));
    return res.status(201).json({ images: images.map(({ secure_url, public_id }) => ({ url: secure_url, public_id })) });
  } catch { return res.status(500).json({ message: "Unable to upload images. Check Cloudinary configuration." }); }
});

module.exports = router;
