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
    {
      name: "Laptop",
      price: 999,
      category: "electronics",
      rating: 4.5,
      inStock: true,
      tags: ["tech", "computer"],
      specs: { color: "silver", weight: 1.5 },
    },
    {
      name: "Phone",
      price: 699,
      category: "electronics",
      rating: 4.2,
      inStock: true,
      tags: ["tech", "mobile"],
      specs: { color: "black", weight: 0.2 },
    },
    {
      name: "Headphones",
      price: 79,
      category: "electronics",
      rating: 4.8,
      inStock: false,
      tags: ["tech", "audio"],
      specs: { color: "white", weight: 0.3 },
    },
    {
      name: "JS Book",
      price: 29,
      category: "books",
      rating: 4.7,
      inStock: true,
      tags: ["programming", "javascript"],
      specs: {},
    },
    {
      name: "Node Book",
      price: 34,
      category: "books",
      rating: 4.3,
      inStock: true,
      tags: ["programming", "node"],
      specs: {},
    },
    {
      name: "T-Shirt",
      price: 19,
      category: "clothing",
      rating: 3.9,
      inStock: true,
      tags: ["fashion"],
      specs: { color: "blue", weight: 0.2 },
    },
    {
      name: "Sneakers",
      price: 89,
      category: "clothing",
      rating: 4.1,
      inStock: false,
      tags: ["fashion", "shoes"],
      specs: { color: "red", weight: 0.5 },
    },
    {
      name: "Backpack",
      price: 49,
      category: "accessories",
      rating: 4.4,
      inStock: true,
      tags: ["travel"],
      specs: { color: "black", weight: 0.8 },
    },
  ]);

  // ============================================
  // Comparison Operators
  // ============================================

  // $eq — equal (same as { price: 999 })
  const exact = await Product.find({ price: { $eq: 999 } }).select(
    "name price",
  );
  console.log(
    "$eq:",
    exact.map((p) => p.name),
  );

  // $ne — not equal
  const notElectronics = await Product.find({
    category: { $ne: "electronics" },
  }).select("name");
  console.log(
    "$ne:",
    notElectronics.map((p) => p.name),
  );

  // $gt — greater than
  const expensive = await Product.find({ price: { $gt: 100 } }).select(
    "name price",
  );
  console.log(
    "$gt 100:",
    expensive.map((p) => `${p.name}($${p.price})`),
  );

  // $gte — greater than or equal
  const rated4Plus = await Product.find({ rating: { $gte: 4.5 } }).select(
    "name rating",
  );
  console.log(
    "$gte 4.5:",
    rated4Plus.map((p) => `${p.name}(${p.rating})`),
  );

  // $lt — less than
  const cheap = await Product.find({ price: { $lt: 50 } }).select("name price");
  console.log(
    "$lt 50:",
    cheap.map((p) => `${p.name}($${p.price})`),
  );

  // $lte — less than or equal
  const affordable = await Product.find({ price: { $lte: 89 } }).select(
    "name price",
  );
  console.log(
    "$lte 89:",
    affordable.map((p) => p.name),
  );

  // Combined range: price between 30 and 100
  const range = await Product.find({ price: { $gte: 30, $lte: 100 } }).select(
    "name price",
  );
  console.log(
    "30-100:",
    range.map((p) => `${p.name}($${p.price})`),
  );

  // $in — match any value in array
  const selected = await Product.find({
    category: { $in: ["books", "clothing"] },
  }).select("name category");
  console.log(
    "$in:",
    selected.map((p) => `${p.name}(${p.category})`),
  );

  // $nin — NOT in array
  const notBooks = await Product.find({ category: { $nin: ["books"] } }).select(
    "name",
  );
  console.log(
    "$nin books:",
    notBooks.map((p) => p.name),
  );

  // ============================================
  // Logical Operators
  // ============================================

  // $and — ALL conditions must match (implicit when using multiple fields)
  const andResult = await Product.find({
    $and: [{ price: { $gt: 50 } }, { inStock: true }],
  }).select("name price");
  console.log(
    "$and:",
    andResult.map((p) => p.name),
  );
  // Same as: { price: { $gt: 50 }, inStock: true }

  // $or — ANY condition must match
  const orResult = await Product.find({
    $or: [{ category: "books" }, { price: { $gt: 500 } }],
  }).select("name");
  console.log(
    "$or:",
    orResult.map((p) => p.name),
  );

  // $not — negate a condition
  const notExpensive = await Product.find({
    price: { $not: { $gt: 100 } },
  }).select("name price");
  console.log(
    "$not >100:",
    notExpensive.map((p) => p.name),
  );

  // $nor — NONE of the conditions match
  const norResult = await Product.find({
    $nor: [{ category: "electronics" }, { inStock: false }],
  }).select("name");
  console.log(
    "$nor:",
    norResult.map((p) => p.name),
  );
}

demo();
