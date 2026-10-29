const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");

const slugify = (text) => text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
const invalid = (res, message) => res.status(400).json({ message });
const validObjectId = (value) => mongoose.isValidObjectId(value);
const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function validateCategoryBody(body, { partial = false } = {}) {
  if (!isPlainObject(body)) return "A category object is required";
  const allowedFields = ["name", "image", "parentCategory"];
  const unknownField = Object.keys(body).find((key) => !allowedFields.includes(key));
  if (unknownField) return `Unknown field: ${unknownField}`;
  if (!partial && (typeof body.name !== "string" || !body.name.trim())) return "name is required";
  if (body.name !== undefined && (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 100)) {
    return "name must be a non-empty string of at most 100 characters";
  }
  if (body.image !== undefined && (typeof body.image !== "string" || (body.image && !/^https?:\/\//i.test(body.image)))) {
    return "image must be an HTTP or HTTPS URL";
  }
  if (body.parentCategory !== undefined && body.parentCategory !== null && !validObjectId(body.parentCategory)) {
    return "parentCategory must be a valid category id or null";
  }
  return null;
}

const createCategory = async (req, res) => {
  try {
    const validationError = validateCategoryBody(req.body);
    if (validationError) return invalid(res, validationError);
    const name = req.body.name.trim();
    const slug = slugify(name);
    if (!slug) return invalid(res, "name must contain letters or numbers");

    if (req.body.parentCategory) {
      if (!await Category.exists({ _id: req.body.parentCategory })) return invalid(res, "Parent category does not exist");
    }
    const category = await Category.create({ name, slug, image: req.body.image || "", parentCategory: req.body.parentCategory || null });
    return res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "A category with this name already exists" });
    if (error.name === "ValidationError" || error.name === "CastError") return invalid(res, error.message);
    return res.status(500).json({ message: "Unable to create category" });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().select("name slug image parentCategory createdAt updatedAt").populate("parentCategory", "name slug").sort({ name: 1 }).lean();
    return res.json(categories);
  } catch {
    return res.status(500).json({ message: "Unable to retrieve categories" });
  }
};

const updateCategory = async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) return invalid(res, "Invalid category id");
    const validationError = validateCategoryBody(req.body, { partial: true });
    if (validationError) return invalid(res, validationError);
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (req.body.parentCategory === req.params.id) return invalid(res, "A category cannot be its own parent");
    if (req.body.parentCategory) {
      if (!await Category.exists({ _id: req.body.parentCategory })) return invalid(res, "Parent category does not exist");
      category.parentCategory = req.body.parentCategory;
    } else if (req.body.parentCategory === null) {
      category.parentCategory = null;
    }
    if (req.body.name !== undefined) {
      const slug = slugify(req.body.name.trim());
      if (!slug) return invalid(res, "name must contain letters or numbers");
      category.name = req.body.name.trim();
      category.slug = slug;
    }
    if (req.body.image !== undefined) category.image = req.body.image;
    return res.json(await category.save());
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "A category with this name already exists" });
    if (error.name === "ValidationError" || error.name === "CastError") return invalid(res, error.message);
    return res.status(500).json({ message: "Unable to update category" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) return invalid(res, "Invalid category id");
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    if (await Product.exists({ category: category._id })) {
      return res.status(409).json({ message: "Move or delete products in this category before deleting it" });
    }
    if (await Category.exists({ parentCategory: category._id })) {
      return res.status(409).json({ message: "Move or delete child categories before deleting this category" });
    }
    await category.deleteOne();
    return res.json({ message: "Category deleted" });
  } catch {
    return res.status(500).json({ message: "Unable to delete category" });
  }
};

module.exports = { createCategory, getAllCategories, updateCategory, deleteCategory };
