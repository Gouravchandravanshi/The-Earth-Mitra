// Adds clearly labeled, repeatable API preview records. Never run in production.
require("dotenv").config();
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Review = require("../models/Review");
const User = require("../models/User");

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.SEED_DEMO_DATA !== "1") {
    throw new Error("Refusing to seed. Set SEED_DEMO_DATA=1 in a non-production environment.");
  }
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  await mongoose.connect(process.env.MONGO_URI);

  let category = await Category.findOne({ slug: "demo-api-preview" });
  if (!category) category = await Category.create({ name: "DEMO DATA - API Preview", slug: "demo-api-preview" });

  let demoUser = await User.findOne({ email: "demo-reviewer@earth-mitra.invalid" });
  if (!demoUser) {
    demoUser = await User.create({
      name: "DEMO Reviewer",
      email: "demo-reviewer@earth-mitra.invalid",
      password: crypto.randomBytes(32).toString("hex"),
    });
  }

  const products = [
    {
      name: "DEMO Product - Organic Red Lentils",
      slug: "demo-organic-red-lentils",
      sku: "DEMO-LENTIL-500",
      description: "DEMO DATA: API preview record. Replace this text with verified product copy before publishing.",
      price: 180,
      discountPrice: 160,
      stock: 24,
      images: [{ url: "https://placehold.co/600x600?text=DEMO+Lentils", public_id: "demo/lentils" }],
      gallery: [{ url: "https://placehold.co/600x600?text=DEMO+Lentils", public_id: "demo/lentils" }],
      category: category._id,
      origin: "DEMO origin - replace with verified origin",
      eco_certified: false,
      certifications: ["DEMO certification label - unverified"],
      organicCertifications: [{
        name: "DEMO Organic Certificate",
        issuingAuthority: "DEMO issuing authority",
        documentUrl: "https://example.invalid/demo-certificate.pdf",
        verificationStatus: "unverified",
      }],
      suitableUses: ["DEMO: dal", "DEMO: soups"],
      storage: { instructions: "DEMO: store in a cool, dry place.", minTemperatureC: 10, maxTemperatureC: 25 },
      allergenInfo: { status: "unknown", allergens: [], warnings: ["DEMO: allergen information has not been verified"] },
      shelfLife: { duration: 12, unit: "months", afterOpening: "DEMO: transfer to an airtight container." },
      variants: [
        { name: "500 g", sku: "DEMO-LENTIL-500", price: 180, stock: 24, attributes: [{ name: "Weight", value: "500 g" }] },
        { name: "1 kg", sku: "DEMO-LENTIL-1KG", price: 340, stock: 12, attributes: [{ name: "Weight", value: "1 kg" }] },
      ],
      faqs: [
        { question: "DEMO: How should this product be stored?", answer: "DEMO: The storage guidance shown here is sample content. Verify it with the product owner." },
        { question: "DEMO: Is this certification verified?", answer: "No. This is a sample record and its status is unverified." },
      ],
    },
    {
      name: "DEMO Product - Whole Green Moong",
      slug: "demo-whole-green-moong",
      sku: "DEMO-MOONG-500",
      description: "DEMO DATA: Related product fixture used to preview recommendations.",
      price: 150,
      discountPrice: 0,
      stock: 0,
      images: [{ url: "https://placehold.co/600x600?text=DEMO+Moong", public_id: "demo/moong" }],
      gallery: [{ url: "https://placehold.co/600x600?text=DEMO+Moong", public_id: "demo/moong" }],
      category: category._id,
      suitableUses: ["DEMO: khichdi", "DEMO: sprouts"],
      allergenInfo: { status: "unknown", allergens: [], warnings: [] },
      faqs: [{ question: "DEMO: Is this sample in stock?", answer: "No. Its sample stock is set to zero to exercise availability." }],
    },
  ];

  const saved = [];
  for (const data of products) {
    const product = await Product.findOneAndUpdate(
      { slug: data.slug, demoData: true },
      { $set: { ...data, demoData: true } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    saved.push(product);
  }

  const product = saved[0];
  await Review.deleteMany({ product: { $in: saved.map(({ _id }) => _id) }, demoData: true });
  await Review.create([
    { user: demoUser._id, product: product._id, rating: 5, comment: "DEMO REVIEW: sample five-star review for API preview only.", demoData: true },
    { user: demoUser._id, product: saved[1]._id, rating: 4, comment: "DEMO REVIEW: sample four-star review for API preview only.", demoData: true },
  ]);

  for (const item of saved) {
    const grouped = await Review.aggregate([
      { $match: { product: item._id } },
      { $group: { _id: "$rating", count: { $sum: 1 }, total: { $sum: "$rating" } } },
    ]);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const count = grouped.reduce((sum, row) => { distribution[row._id] = row.count; return sum + row.count; }, 0);
    const total = grouped.reduce((sum, row) => sum + row.total, 0);
    await Product.updateOne({ _id: item._id }, { $set: { numReviews: count, avgRating: count ? Math.round((total / count) * 10) / 10 : 0, ratingDistribution: distribution } });
  }

  console.log("Demo API data ready:");
  console.log("  /api/products/demo-organic-red-lentils");
  console.log("  /api/products/demo-organic-red-lentils/reviews");
  console.log("  /api/products/demo-organic-red-lentils/reviews/summary");
  console.log("  /api/products/demo-organic-red-lentils/related");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
});
