const mongoose = require("mongoose");
const slugify = require("slugify");
const ContentPost = require("../models/ContentPost");

const invalid = (res, message) => res.status(400).json({ message });
const fields = ["title", "excerpt", "content", "coverImage", "category", "author", "readTime", "tags", "isPublished", "publishedAt"];
const validate = body => {
  const unknown = Object.keys(body || {}).find(key => !fields.includes(key));
  if (unknown) return `Unknown field: ${unknown}`;
  if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 180) return "title must be 1 to 180 characters";
  if (typeof body.excerpt !== "string" || !body.excerpt.trim() || body.excerpt.length > 600) return "excerpt must be 1 to 600 characters";
  if (typeof body.content !== "string" || !body.content.trim() || body.content.length > 50000) return "content must be 1 to 50000 characters";
  if (body.coverImage !== undefined && (typeof body.coverImage !== "string" || (body.coverImage && !/^https?:\/\//i.test(body.coverImage)))) return "coverImage must be an HTTP or HTTPS URL";
  if (body.category !== undefined && (typeof body.category !== "string" || body.category.length > 80)) return "category must be at most 80 characters";
  if (body.author !== undefined && (typeof body.author !== "string" || !body.author.trim() || body.author.length > 100)) return "author must be 1 to 100 characters";
  if (body.readTime !== undefined && (!Number.isInteger(Number(body.readTime)) || Number(body.readTime) < 1 || Number(body.readTime) > 240)) return "readTime must be between 1 and 240 minutes";
  if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.some(tag => typeof tag !== "string" || !tag.trim() || tag.length > 40))) return "tags must be an array of non-empty strings up to 40 characters";
  if (body.isPublished !== undefined && typeof body.isPublished !== "boolean") return "isPublished must be a boolean";
  if (body.publishedAt !== undefined && body.publishedAt !== null && Number.isNaN(Date.parse(body.publishedAt))) return "publishedAt must be a valid date";
  return null;
};
const isId = value => mongoose.isValidObjectId(value);

function handlers(type) {
  const publicList = async (req, res) => {
    try {
      const query = { type, isPublished: true };
      if (req.query.category) query.category = String(req.query.category).slice(0, 80);
      const posts = await ContentPost.find(query).sort({ publishedAt: -1, createdAt: -1 }).lean();
      return res.json({ posts });
    } catch { return res.status(500).json({ message: `Unable to retrieve ${type}s` }); }
  };
  const publicDetail = async (req, res) => {
    try {
      const post = await ContentPost.findOne({ type, slug: req.params.slug, isPublished: true }).lean();
      if (!post) return res.status(404).json({ message: "Post not found" });
      return res.json(post);
    } catch { return res.status(500).json({ message: "Unable to retrieve post" }); }
  };
  const adminList = async (_req, res) => {
    try { return res.json({ posts: await ContentPost.find({ type }).sort({ updatedAt: -1 }).lean() }); }
    catch { return res.status(500).json({ message: `Unable to retrieve ${type}s` }); }
  };
  const create = async (req, res) => {
    const body = req.body || {};
    const error = validate(body);
    if (error) return invalid(res, error);
    const slug = slugify(body.title, { lower: true, strict: true });
    if (!slug) return invalid(res, "title must contain letters or numbers");
    try {
      const publishedAt = body.isPublished ? (body.publishedAt || new Date()) : null;
      const post = await ContentPost.create({ ...body, type, slug, publishedAt });
      return res.status(201).json(post);
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ message: "A post with this title already exists" });
      return res.status(500).json({ message: `Unable to create ${type}` });
    }
  };
  const update = async (req, res) => {
    if (!isId(req.params.id)) return invalid(res, "Invalid post id");
    const body = req.body || {};
    const error = validate(body);
    if (error) return invalid(res, error);
    const update = { ...body };
    if (body.title) update.slug = slugify(body.title, { lower: true, strict: true });
    if (body.isPublished === true && body.publishedAt === undefined) update.publishedAt = new Date();
    if (body.isPublished === false) update.publishedAt = null;
    try {
      const post = await ContentPost.findOneAndUpdate({ _id: req.params.id, type }, update, { new: true, runValidators: true });
      if (!post) return res.status(404).json({ message: "Post not found" });
      return res.json(post);
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ message: "A post with this title already exists" });
      return res.status(500).json({ message: `Unable to update ${type}` });
    }
  };
  const remove = async (req, res) => {
    if (!isId(req.params.id)) return invalid(res, "Invalid post id");
    const post = await ContentPost.findOneAndDelete({ _id: req.params.id, type });
    if (!post) return res.status(404).json({ message: "Post not found" });
    return res.json({ message: "Post deleted" });
  };
  return { publicList, publicDetail, adminList, create, update, remove };
}

module.exports = handlers;
