// Query Operators — Advanced Filtering
// Run: node 06-query-operators.js

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  rating: Number,
  inStock: Boolean,
  tags: [String],
  specs: { color: String, weight: Number },
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", productSchema);

async function demo() {
  await Product.deleteMany({});

  // Seed data
  await Product.create([
    { name: "Laptop", price: 999, category: "electronics", rating: 4.5, inStock: true, tags: ["tech", "computer"], specs: { color: "silver", weight: 1.5 } },
    { name: "Phone", price: 699, category: "electronics", rating: 4.2, inStock: true, tags: ["tech", "mobile"], specs: { color: "black", weight: 0.2 } },
    { name: "Headphones", price: 79, category: "electronics", rating: 4.8, inStock: false, tags: ["tech", "audio"], specs: { color: "white", weight: 0.3 } },
    { name: "JS Book", price: 29, category: "books", rating: 4.7, inStock: true, tags: ["programming", "javascript"], specs: {} },
    { name: "Node Book", price: 34, category: "books", rating: 4.3, inStock: true, tags: ["programming", "node"], specs: {} },
    { name: "T-Shirt", price: 19, category: "clothing", rating: 3.9, inStock: true, tags: ["fashion"], specs: { color: "blue", weight: 0.2 } },
    { name: "Sneakers", price: 89, category: "clothing", rating: 4.1, inStock: false, tags: ["fashion", "shoes"], specs: { color: "red", weight: 0.5 } },
    { name: "Backpack", price: 49, category: "accessories", rating: 4.4, inStock: true, tags: ["travel"], specs: { color: "black", weight: 0.8 } },
  ]);

  // ============================================
  // Comparison Operators
  // ============================================

  // $eq — equal (same as { price: 999 })
  const exact = await Product.find({ price: { $eq: 999 } }).select("name price");
  console.log("$eq:", exact.map((p) => p.name));

  // $ne — not equal
  const notElectronics = await Product.find({ category: { $ne: "electronics" } }).select("name");
  console.log("$ne:", notElectronics.map((p) => p.name));

  // $gt — greater than
  const expensive = await Product.find({ price: { $gt: 100 } }).select("name price");
  console.log("$gt 100:", expensive.map((p) => `${p.name}($${p.price})`));

  // $gte — greater than or equal
  const rated4Plus = await Product.find({ rating: { $gte: 4.5 } }).select("name rating");
  console.log("$gte 4.5:", rated4Plus.map((p) => `${p.name}(${p.rating})`));

  // $lt — less than
  const cheap = await Product.find({ price: { $lt: 50 } }).select("name price");
  console.log("$lt 50:", cheap.map((p) => `${p.name}($${p.price})`));

  // $lte — less than or equal
  const affordable = await Product.find({ price: { $lte: 89 } }).select("name price");
  console.log("$lte 89:", affordable.map((p) => p.name));

  // Combined range: price between 30 and 100
  const range = await Product.find({ price: { $gte: 30, $lte: 100 } }).select("name price");
  console.log("30-100:", range.map((p) => `${p.name}($${p.price})`));

  // $in — match any value in array
  const selected = await Product.find({ category: { $in: ["books", "clothing"] } }).select("name category");
  console.log("$in:", selected.map((p) => `${p.name}(${p.category})`));

  // $nin — NOT in array
  const notBooks = await Product.find({ category: { $nin: ["books"] } }).select("name");
  console.log("$nin books:", notBooks.map((p) => p.name));

  // ============================================
  // Logical Operators
  // ============================================

  // $and — ALL conditions must match (implicit when using multiple fields)
  const andResult = await Product.find({
    $and: [{ price: { $gt: 50 } }, { inStock: true }],
  }).select("name price");
  console.log("$and:", andResult.map((p) => p.name));
  // Same as: { price: { $gt: 50 }, inStock: true }

  // $or — ANY condition must match
  const orResult = await Product.find({
    $or: [{ category: "books" }, { price: { $gt: 500 } }],
  }).select("name");
  console.log("$or:", orResult.map((p) => p.name));

  // $not — negate a condition
  const notExpensive = await Product.find({
    price: { $not: { $gt: 100 } },
  }).select("name price");
  console.log("$not >100:", notExpensive.map((p) => p.name));

  // $nor — NONE of the conditions match
  const norResult = await Product.find({
    $nor: [{ category: "electronics" }, { inStock: false }],
  }).select("name");
  console.log("$nor:", norResult.map((p) => p.name));

  // ============================================
  // Element Operators
  // ============================================

  // $exists — field exists (or doesn't)
  const hasSpecs = await Product.find({ "specs.color": { $exists: true } }).select("name");
  console.log("$exists color:", hasSpecs.map((p) => p.name));

  // ============================================
  // Regex — Pattern Matching
  // ============================================

  // $regex — find by pattern
  const startWithS = await Product.find({ name: { $regex: /^S/i } }).select("name");
  console.log("Starts with S:", startWithS.map((p) => p.name));

  const containsBook = await Product.find({ name: { $regex: /book/i } }).select("name");
  console.log("Contains 'book':", containsBook.map((p) => p.name));

  // Case-insensitive search with $options
  const searchTerm = "phone";
  const searched = await Product.find({
    name: { $regex: searchTerm, $options: "i" },
  }).select("name");
  console.log("Search 'phone':", searched.map((p) => p.name));

  // ============================================
  // Array Operators
  // ============================================

  // Find products with specific tag
  const techProducts = await Product.find({ tags: "tech" }).select("name tags");
  console.log("Has 'tech' tag:", techProducts.map((p) => p.name));

  // $all — array contains ALL specified values
  const allTags = await Product.find({ tags: { $all: ["tech", "mobile"] } }).select("name");
  console.log("$all tech+mobile:", allTags.map((p) => p.name));

  // $size — array has exact length
  const twoTags = await Product.find({ tags: { $size: 2 } }).select("name tags");
  console.log("$size 2:", twoTags.map((p) => `${p.name}(${p.tags})`));

  // ============================================
  // Nested Object Queries
  // ============================================

  // Query nested fields with dot notation
  const blackProducts = await Product.find({ "specs.color": "black" }).select("name");
  console.log("Black color:", blackProducts.map((p) => p.name));

  const lightProducts = await Product.find({ "specs.weight": { $lt: 0.5 } }).select("name");
  console.log("Light (<0.5kg):", lightProducts.map((p) => p.name));

  // ============================================
  // Building Dynamic Queries (from API request params)
  // ============================================

  // Simulate request query params
  const queryParams = { category: "electronics", minPrice: "50", maxPrice: "1000", search: "lap" };

  // Build filter dynamically
  const filter = {};
  if (queryParams.category) filter.category = queryParams.category;
  if (queryParams.minPrice) filter.price = { ...filter.price, $gte: Number(queryParams.minPrice) };
  if (queryParams.maxPrice) filter.price = { ...filter.price, $lte: Number(queryParams.maxPrice) };
  if (queryParams.search) filter.name = { $regex: queryParams.search, $options: "i" };

  console.log("Dynamic filter:", filter);
  const dynamicResult = await Product.find(filter).select("name price");
  console.log("Dynamic result:", dynamicResult.map((p) => `${p.name}($${p.price})`));

  // Clean up
  await Product.deleteMany({});
  await mongoose.disconnect();
}

demo();
