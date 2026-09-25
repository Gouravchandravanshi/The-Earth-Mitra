const Product = require("../models/Product");
const slugify = require("slugify");

const createProduct = async (req, res) => {
  try {
    const { name, description, price, discountPrice, stock, category, eco_certified, origin, certifications } = req.body;

    const slug = slugify(name, { lower: true, strict: true });

    const exists = await Product.findOne({ slug });
    if (exists) {
      return res.status(400).json({ message: "Product with this name already exists" });
    }

    const product = await Product.create({
      name,
      slug,
      description,
      price,
      discountPrice,
      stock,
      category,
      eco_certified,
      origin,
      certifications,
      images: [],
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, eco_certified, sort, page = 1, limit = 12 } = req.query;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (category) {
      query.category = category;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (eco_certified === "true") {
      query.eco_certified = true;
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { avgRating: -1 },
    };
    const sortBy = sortOptions[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort(sortBy)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      products,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate("category", "name slug");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const fields = ["name", "description", "price", "discountPrice", "stock", "category", "eco_certified", "origin", "certifications"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    if (req.body.name) {
      product.slug = slugify(req.body.name, { lower: true, strict: true });
    }

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");

const uploadProductImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, "earth-mitra/products")
    );

    const results = await Promise.all(uploadPromises);

    const newImages = results.map((result) => ({
      url: result.secure_url,
      public_id: result.public_id,
    }));

    product.images.push(...newImages);
    await product.save();

    res.json(product.images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { public_id } = req.body;
    await deleteFromCloudinary(public_id);

    product.images = product.images.filter((img) => img.public_id !== public_id);
    await product.save();

    res.json(product.images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = { createProduct, getAllProducts, getProductBySlug, updateProduct, deleteProduct, uploadProductImages, deleteProductImage };