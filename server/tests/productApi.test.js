const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const cookieParser = require("cookie-parser");
const Product = require("../models/Product");
const Review = require("../models/Review");
const productRoutes = require("../routes/productRoutes");
const reviewRoutes = require("../routes/reviewRoutes");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/products", productRoutes);
app.use("/api/products/:id/reviews", reviewRoutes);

let server;
let baseUrl;
const originals = {};

test.before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  for (const [object, methods] of Object.entries(originals)) {
    const target = object === "Product" ? Product : Review;
    for (const [method, original] of Object.entries(methods)) target[method] = original;
  }
  if (server) await new Promise((resolve) => server.close(resolve));
});

function mockMethod(model, method, implementation) {
  originals[model.modelName] ||= {};
  if (!(method in originals[model.modelName])) originals[model.modelName][method] = model[method];
  model[method] = implementation;
}

test("product detail returns explicit unknown allergen status and related products", async () => {
  const id = "507f1f77bcf86cd799439011";
  const relatedId = "507f1f77bcf86cd799439012";
  const details = {
    _id: id,
    name: "Fixture product",
    slug: "fixture-product",
    price: 12,
    stock: 1,
    images: [],
    category: { _id: "507f1f77bcf86cd799439013", name: "Food", slug: "food" },
    avgRating: 4,
    numReviews: 2,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
    demoData: true,
  };
  mockMethod(Product, "findOne", () => ({ populate() { return this; }, select() { return this; }, lean: async () => details }));
  mockMethod(Product, "find", () => ({
    select() { return this; }, sort() { return this; }, limit() { return this; },
    lean: async () => [{ _id: relatedId, name: "Related fixture", slug: "related-fixture" }],
  }));

  const response = await fetch(`${baseUrl}/api/products/fixture-product`);
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.sampleData, true);
  assert.equal(payload.availability.inStock, true);
  assert.equal(payload.allergenInfo.status, "unknown");
  assert.deepEqual(payload.gallery, []);
  assert.equal(payload.relatedProducts[0]._id, relatedId);
  assert.notEqual(payload.relatedProducts[0]._id, payload._id);
});

test("reviews are paginated and rating summaries are exposed", async () => {
  mockMethod(Product, "exists", async () => true);
  mockMethod(Product, "findById", () => ({ select() { return this; }, lean: async () => ({ avgRating: 4.5, numReviews: 2, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 } }) }));
  mockMethod(Review, "countDocuments", async () => 1);
  mockMethod(Review, "find", () => ({
    select() { return this; }, populate() { return this; }, sort() { return this; }, skip() { return this; }, limit() { return this; },
    lean: async () => [{ _id: "507f1f77bcf86cd799439014", rating: 5, comment: "DEMO REVIEW", demoData: true }],
  }));
  const id = "507f1f77bcf86cd799439011";
  const listResponse = await fetch(`${baseUrl}/api/products/${id}/reviews?page=2&limit=5&rating=5`);
  const list = await listResponse.json();
  assert.equal(listResponse.status, 200);
  assert.equal(list.page, 2);
  assert.equal(list.limit, 5);
  assert.equal(list.reviews[0].sampleData, true);
  const summaryResponse = await fetch(`${baseUrl}/api/products/${id}/reviews/summary`);
  const summary = await summaryResponse.json();
  assert.equal(summaryResponse.status, 200);
  assert.equal(summary.average, 4.5);
  assert.equal(summary.distribution[5], 1);
});

test("admin product writes require authentication", async () => {
  const response = await fetch(`${baseUrl}/api/products/507f1f77bcf86cd799439011`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ price: 1 }),
  });
  assert.equal(response.status, 401);
});

test("admin product listing requires authentication", async () => {
  const response = await fetch(`${baseUrl}/api/products/admin?page=1&limit=20`);
  assert.equal(response.status, 401);
});

test("invalid review pagination is rejected", async () => {
  const id = "507f1f77bcf86cd799439011";
  const response = await fetch(`${baseUrl}/api/products/${id}/reviews?page=0`);
  assert.equal(response.status, 400);
});
