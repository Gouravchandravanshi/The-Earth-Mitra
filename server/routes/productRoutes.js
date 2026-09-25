const { upload } = require("../utils/cloudinary");
const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
} = require("../controllers/productController");
const { protect, adminOnly } = require("../middlewares/auth");

router.get("/", getAllProducts);
router.get("/:slug", getProductBySlug);
router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

router.post("/:id/images", protect, adminOnly, upload.array("images", 5), uploadProductImages);
router.delete("/:id/images", protect, adminOnly, deleteProductImage);

module.exports = router;