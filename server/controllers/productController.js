const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const slugify = require("slugify");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");

const editableFields = [
  "name", "sku", "description", "price", "discountPrice", "stock", "category", "images", "gallery",
  "variants", "suitableUses", "storage", "allergenInfo", "shelfLife", "eco_certified",
  "origin", "certifications", "organicCertifications", "faqs",
];

const invalid = (res, message) => res.status(400).json({ message });
const validObjectId = (value) => mongoose.isValidObjectId(value);

const assignProductFields = (product, body) => {
  const unknown = Object.keys(body).filter((field) => !editableFields.includes(field));
  if (unknown.length) return `Unknown or read-only field: ${unknown[0]}`;
  for (const field of ["name", "description", "origin"]) {
    if (body[field] !== undefined && typeof body[field] !== "string") return `${field} must be a string`;
  }
  if (body.name !== undefined && !body.name.trim()) return "name cannot be empty";
  if (body.description !== undefined && !body.description.trim()) return "description cannot be empty";
  for (const field of editableFields) {
    if (body[field] !== undefined) product[field] = body[field];
  }
  if (body.name) product.slug = slugify(body.name, { lower: true, strict: true });
  if (product.slug && !product.slug.trim()) return "Name must produce a valid slug";
  if (body.price !== undefined && (!Number.isFinite(Number(body.price)) || Number(body.price) < 0)) return "Price must be a non-negative number";
  if (body.discountPrice !== undefined && (!Number.isFinite(Number(body.discountPrice)) || Number(body.discountPrice) < 0)) return "Discount price must be a non-negative number";
  if (body.stock !== undefined && (!Number.isInteger(Number(body.stock)) || Number(body.stock) < 0)) return "Stock must be a non-negative integer";
  if (body.category !== undefined && !validObjectId(body.category)) return "Category must be a valid id";
  if (body.sku !== undefined && body.sku !== null && typeof body.sku !== "string") return "SKU must be a string";
  return null;
};

const createProduct = async (req, res) => {
  try {
    const product = new Product();
    const validationError = assignProductFields(product, req.body || {});
    if (validationError) return invalid(res, validationError);
    if (!product.name || !product.description || product.price == null || !product.category) {
      return invalid(res, "name, description, price, and category are required");
    }
    if (!await Category.exists({ _id: product.category })) return invalid(res, "Category does not exist");
    const created = await product.save();
    return res.status(201).json(created);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "A product with this slug or SKU already exists" });
    if (error.name === "ValidationError" || error.name === "CastError") return invalid(res, error.message);
    return res.status(500).json({ message: "Unable to create product" });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, eco_certified, sort } = req.query;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 12);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return invalid(res, "page must be >= 1 and limit must be between 1 and 100");
    }
    if (category && !validObjectId(category)) return invalid(res, "category must be a valid id");
    const query = {};
    if (search) query.name = { $regex: String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    if (category) query.category = category;
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
      if (Object.values(query.price).some((value) => !Number.isFinite(value) || value < 0)) return invalid(res, "Price filters must be non-negative numbers");
    }
    if (eco_certified === "true") query.eco_certified = true;
    if (eco_certified !== undefined && !["true", "false"].includes(eco_certified)) return invalid(res, "eco_certified must be true or false");

    const sortOptions = { newest: { createdAt: -1, _id: -1 }, price_asc: { price: 1, _id: 1 }, price_desc: { price: -1, _id: -1 }, rating: { avgRating: -1, _id: -1 }, reviews: { numReviews: -1, _id: -1 } };
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .select("name slug sku price discountPrice stock images category eco_certified avgRating numReviews")
      .populate("category", "name slug")
      .sort(sortOptions[sort] || sortOptions.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return res.json({ products, page, limit, totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    return res.status(500).json({ message: "Unable to retrieve products" });
  }
};

const getAdminProducts = async (req, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 100);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return invalid(res, "page must be >= 1 and limit must be between 1 and 100");
    }
    const [total, products] = await Promise.all([
      Product.countDocuments(),
      Product.find()
        .select("name slug sku description price discountPrice stock images gallery category variants suitableUses storage allergenInfo shelfLife eco_certified origin certifications organicCertifications faqs createdAt updatedAt")
        .populate("category", "name slug")
        .sort({ updatedAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return res.json({ products, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch {
    return res.status(500).json({ message: "Unable to retrieve admin products" });
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate("category", "name slug")
      .select("+demoData")
      .lean();
    if (!product) return res.status(404).json({ message: "Product not found" });

    const relatedProducts = await Product.find({ category: product.category?._id || product.category, _id: { $ne: product._id } })
      .select("name slug price discountPrice stock images avgRating numReviews")
      .sort({ avgRating: -1, numReviews: -1, _id: 1 })
      .limit(4)
      .lean();
    const { avgRating = 0, numReviews = 0 } = product;
    const ratingDistribution = Object.fromEntries([1, 2, 3, 4, 5].map((star) => [star, product.ratingDistribution?.[star] || 0]));
    return res.json({
      ...product,
      sku: product.sku || null,
      gallery: product.gallery?.length ? product.gallery : (product.images || []),
      variants: product.variants || [],
      suitableUses: product.suitableUses || [],
      storage: {
        instructions: product.storage?.instructions ?? null,
        minTemperatureC: product.storage?.minTemperatureC ?? null,
        maxTemperatureC: product.storage?.maxTemperatureC ?? null,
      },
      allergenInfo: product.allergenInfo || { status: "unknown", allergens: [], warnings: [] },
      shelfLife: product.shelfLife || null,
      certifications: product.certifications || [],
      organicCertifications: product.organicCertifications || [],
      faqs: product.faqs || [],
      sampleData: Boolean(product.demoData),
      availability: { inStock: (product.stock ?? 0) > 0, quantity: product.stock ?? 0 },
      ratingSummary: { average: avgRating, count: numReviews, distribution: ratingDistribution },
      relatedProducts,
      reviewsEndpoint: `/api/products/${product._id}/reviews`,
      ratingSummaryEndpoint: `/api/products/${product._id}/reviews/summary`,
      relatedProductsEndpoint: `/api/products/${product.slug}/related`,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to retrieve product details" });
  }
};

const getRelatedProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit ?? 8);
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) return invalid(res, "limit must be between 1 and 20");
    const product = await Product.findOne({ slug: req.params.slug }).select("_id category").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    const products = await Product.find({ category: product.category, _id: { $ne: product._id } })
      .select("name slug price discountPrice stock images avgRating numReviews")
      .sort({ avgRating: -1, numReviews: -1, _id: 1 }).limit(limit).lean();
    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ message: "Unable to retrieve related products" });
  }
};

const updateProduct = async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) return invalid(res, "Invalid product id");
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const validationError = assignProductFields(product, req.body || {});
    if (validationError) return invalid(res, validationError);
    if (req.body?.category && !await Category.exists({ _id: product.category })) return invalid(res, "Category does not exist");
    const updated = await product.save();
    return res.json(updated);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "A product with this slug or SKU already exists" });
    if (error.name === "ValidationError" || error.name === "CastError") return invalid(res, error.message);
    return res.status(500).json({ message: "Unable to update product" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) return invalid(res, "Invalid product id");
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    await product.deleteOne();
    return res.json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete product" });
  }
};

const uploadProductImages = async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) return invalid(res, "Invalid product id");
    if (!req.files?.length) return invalid(res, "At least one image is required");
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const results = await Promise.all(req.files.map((file) => uploadToCloudinary(file.buffer, "earth-mitra/products")));
    const newImages = results.map(({ secure_url, public_id }) => ({ url: secure_url, public_id }));
    product.images.push(...newImages);
    product.gallery.push(...newImages);
    await product.save();
    return res.json({ images: product.images, gallery: product.gallery });
  } catch (error) {
    return res.status(500).json({ message: "Unable to upload product images" });
  }
};

const deleteProductImage = async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) return invalid(res, "Invalid product id");
    const { public_id } = req.body || {};
    if (typeof public_id !== "string" || !public_id.trim()) return invalid(res, "public_id is required");
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!product.images.some((image) => image.public_id === public_id)) return res.status(404).json({ message: "Image not found on product" });
    await deleteFromCloudinary(public_id);
    product.images = product.images.filter((image) => image.public_id !== public_id);
    product.gallery = product.gallery.filter((image) => image.public_id !== public_id);
    await product.save();
    return res.json({ images: product.images, gallery: product.gallery });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete product image" });
  }
};

module.exports = { createProduct, getAllProducts, getAdminProducts, getProductBySlug, getRelatedProducts, updateProduct, deleteProduct, uploadProductImages, deleteProductImage };
