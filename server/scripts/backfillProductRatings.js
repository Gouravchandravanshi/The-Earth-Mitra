require("dotenv").config();
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  await mongoose.connect(process.env.MONGO_URI);
  const groups = await Review.aggregate([
    { $group: { _id: { product: "$product", rating: "$rating" }, count: { $sum: 1 }, ratingTotal: { $sum: "$rating" } } },
    { $sort: { "_id.product": 1, "_id.rating": 1 } },
  ]);
  const summaries = new Map();
  for (const row of groups) {
    const id = String(row._id.product);
    const value = summaries.get(id) || { count: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    value.count += row.count;
    value.total += row.ratingTotal;
    value.distribution[row._id.rating] = row.count;
    summaries.set(id, value);
  }
  const productIds = await Product.find().distinct("_id");
  const operations = productIds.map((id) => {
    const value = summaries.get(String(id)) || { count: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    return { updateOne: { filter: { _id: id }, update: { $set: {
      numReviews: value.count,
      avgRating: value.count ? Math.round((value.total / value.count) * 10) / 10 : 0,
      ratingDistribution: value.distribution,
    } } } };
  });
  const apply = process.argv.includes("--apply");
  console.log(`Computed rating summaries for ${operations.length} products. ${apply ? "Applying updates." : "Dry run: no writes made. Use --apply to write."}`);
  if (apply && operations.length) {
    for (let offset = 0; offset < operations.length; offset += 500) {
      await Product.bulkWrite(operations.slice(offset, offset + 500), { ordered: false });
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
});
