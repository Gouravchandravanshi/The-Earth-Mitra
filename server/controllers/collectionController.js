const mongoose = require("mongoose");
const slugify = require("slugify");
const Collection = require("../models/Collection");
const Product = require("../models/Product");

const invalid = (res, message) => res.status(400).json({ message });
const validId = value => mongoose.isValidObjectId(value);
const validate = async (body, { partial = false } = {}) => {
  const allowed = ["name", "description", "image", "products", "isActive", "sortOrder"];
  const unknown = Object.keys(body || {}).find(key => !allowed.includes(key));
  if (unknown) return `Unknown field: ${unknown}`;
  if (!partial && (typeof body.name !== "string" || !body.name.trim())) return "name is required";
  if (body.name !== undefined && (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 120)) return "name must be 1 to 120 characters";
  if (body.description !== undefined && (typeof body.description !== "string" || body.description.length > 3000)) return "description must be at most 3000 characters";
  if (body.image !== undefined && (typeof body.image !== "string" || (body.image && !/^https?:\/\//i.test(body.image)))) return "image must be an HTTP or HTTPS URL";
  if (body.products !== undefined) {
    if (!Array.isArray(body.products) || body.products.some(id => !validId(id))) return "products must be an array of product ids";
    if (new Set(body.products.map(String)).size !== body.products.length) return "products cannot contain duplicates";
    if (body.products.length && await Product.countDocuments({ _id: { $in: body.products } }) !== body.products.length) return "One or more products do not exist";
  }
  if (body.isActive !== undefined && typeof body.isActive !== "boolean") return "isActive must be a boolean";
  if (body.sortOrder !== undefined && (!Number.isInteger(Number(body.sortOrder)) || Number(body.sortOrder) < 0)) return "sortOrder must be a non-negative integer";
  if (body.name !== undefined && !slugify(body.name, { lower: true, strict: true })) return "name must contain letters or numbers";
  return null;
};

const publicList = async (_req, res) => {
  try {
    const collections = await Collection.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).select("name slug description image products sortOrder").lean();
    return res.json(collections.map(({ products, ...collection }) => ({ ...collection, productCount: products.length })));
  } catch { return res.status(500).json({ message: "Unable to retrieve collections" }); }
};

const publicDetail = async (req, res) => {
  try {
    const collection = await Collection.findOne({ slug: req.params.slug, isActive: true }).populate("products", "name slug sku description mrp price discountPrice stock images category avgRating numReviews").lean();
    if (!collection) return res.status(404).json({ message: "Collection not found" });
    return res.json(collection);
  } catch { return res.status(500).json({ message: "Unable to retrieve collection" }); }
};

const adminList = async (_req, res) => {
  try {
    const collections = await Collection.find().populate("products", "name slug").sort({ sortOrder: 1, updatedAt: -1 }).lean();
    return res.json({ collections });
  } catch { return res.status(500).json({ message: "Unable to retrieve collections" }); }
};

const create = async (req, res) => {
  try {
    const error = await validate(req.body || {});
    if (error) return invalid(res, error);
    const collection = await Collection.create({ ...req.body, name: req.body.name.trim(), slug: slugify(req.body.name, { lower: true, strict: true }) });
    return res.status(201).json(collection);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "A collection with this name already exists" });
    return res.status(500).json({ message: "Unable to create collection" });
  }
};

const update = async (req, res) => {
  try {
    if (!validId(req.params.id)) return invalid(res, "Invalid collection id");
    const error = await validate(req.body || {}, { partial: true });
    if (error) return invalid(res, error);
    const update = { ...req.body };
    if (update.name !== undefined) update.slug = slugify(update.name, { lower: true, strict: true });
    const collection = await Collection.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).populate("products", "name slug");
    if (!collection) return res.status(404).json({ message: "Collection not found" });
    return res.json(collection);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "A collection with this name already exists" });
    return res.status(500).json({ message: "Unable to update collection" });
  }
};

const remove = async (req, res) => {
  if (!validId(req.params.id)) return invalid(res, "Invalid collection id");
  const collection = await Collection.findByIdAndDelete(req.params.id);
  if (!collection) return res.status(404).json({ message: "Collection not found" });
  return res.json({ message: "Collection deleted" });
};

module.exports = { publicList, publicDetail, adminList, create, update, remove };
