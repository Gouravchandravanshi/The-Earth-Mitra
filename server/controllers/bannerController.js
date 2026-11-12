const mongoose = require("mongoose");
const Banner = require("../models/Banner");

const invalid = (res, message) => res.status(400).json({ message });
const allowed = ["title", "altText", "desktopImage", "mobileImage", "link", "placement", "sortOrder", "isActive", "startsAt", "endsAt"];
function validate(body, { partial = false } = {}) {
  const unknown = Object.keys(body || {}).find(key => !allowed.includes(key));
  if (unknown) return `Unknown field: ${unknown}`;
  if (!partial && (typeof body.title !== "string" || !body.title.trim())) return "title is required";
  if (body.title !== undefined && (typeof body.title !== "string" || !body.title.trim() || body.title.length > 160)) return "title must be 1 to 160 characters";
  for (const key of ["desktopImage", "mobileImage"]) if (body[key] !== undefined && (typeof body[key] !== "string" || !/^https?:\/\//i.test(body[key]))) return `${key} must be an HTTP or HTTPS URL`;
  if (body.link !== undefined && (typeof body.link !== "string" || body.link.length > 500 || (body.link && !body.link.startsWith("/") && !/^https?:\/\//i.test(body.link)))) return "link must be a relative path or HTTP(S) URL";
  if (body.altText !== undefined && (typeof body.altText !== "string" || body.altText.length > 240)) return "altText must be at most 240 characters";
  if (body.placement !== undefined && !["hero", "midpage", "promo"].includes(body.placement)) return "placement must be hero, midpage, or promo";
  if (body.sortOrder !== undefined && (!Number.isInteger(Number(body.sortOrder)) || Number(body.sortOrder) < 0)) return "sortOrder must be a non-negative integer";
  if (body.isActive !== undefined && typeof body.isActive !== "boolean") return "isActive must be a boolean";
  for (const key of ["startsAt", "endsAt"]) if (body[key] !== undefined && body[key] !== null && Number.isNaN(Date.parse(body[key]))) return `${key} must be a valid date`;
  const startsAt = body.startsAt && new Date(body.startsAt), endsAt = body.endsAt && new Date(body.endsAt);
  if (startsAt && endsAt && startsAt >= endsAt) return "endsAt must be after startsAt";
  return null;
}
const isId = value => mongoose.isValidObjectId(value);

const publicList = async (req, res) => {
  try {
    const now = new Date();
    const query = { isActive: true, $and: [{ $or: [{ startsAt: null }, { startsAt: { $lte: now } }] }, { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] }] };
    if (req.query.placement) query.placement = req.query.placement;
    return res.json(await Banner.find(query).sort({ sortOrder: 1, createdAt: -1 }).lean());
  } catch { return res.status(500).json({ message: "Unable to retrieve banners" }); }
};
const adminList = async (_req, res) => {
  try { return res.json({ banners: await Banner.find().sort({ sortOrder: 1, updatedAt: -1 }).lean() }); }
  catch { return res.status(500).json({ message: "Unable to retrieve banners" }); }
};
const create = async (req, res) => {
  const error = validate(req.body || {});
  if (error) return invalid(res, error);
  try { return res.status(201).json(await Banner.create(req.body)); }
  catch (error) { return res.status(400).json({ message: error.message || "Unable to create banner" }); }
};
const update = async (req, res) => {
  if (!isId(req.params.id)) return invalid(res, "Invalid banner id");
  const error = validate(req.body || {}, { partial: true });
  if (error) return invalid(res, error);
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    return res.json(banner);
  } catch (error) { return res.status(400).json({ message: error.message || "Unable to update banner" }); }
};
const remove = async (req, res) => {
  if (!isId(req.params.id)) return invalid(res, "Invalid banner id");
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) return res.status(404).json({ message: "Banner not found" });
  return res.json({ message: "Banner deleted" });
};

module.exports = { publicList, adminList, create, update, remove };
