const { upload } = require("../utils/cloudinary");
const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getAdminProducts,
  getProductBySlug,
  getRelatedProducts,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
} = require("../controllers/productController");
const { protect, adminOnly } = require("../middlewares/auth");

router.get("/", getAllProducts);
router.get("/admin", protect, adminOnly, getAdminProducts);
router.get("/:slug/related", getRelatedProducts);
router.get("/:slug", getProductBySlug);
router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

router.post("/:id/images", protect, adminOnly, (req, res, next) => {
  upload.array("images", 5)(req, res, (error) => {
    if (error) return res.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Each image must be 5 MB or smaller" : "Upload up to five image files only" });
    next();
  });
}, uploadProductImages);
router.delete("/:id/images", protect, adminOnly, deleteProductImage);

module.exports = router;
