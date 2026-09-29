// Aggregation Pipeline — Powerful Data Processing
// Run: node 13-aggregation-pipeline.js

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

// ============================================
// What is the Aggregation Pipeline?
// ============================================

// The aggregation pipeline processes documents through stages.
// Each stage transforms the data and passes it to the next stage.
// Think of it like: data → stage1 → stage2 → stage3 → result

// It's similar to SQL's GROUP BY, HAVING, ORDER BY, JOIN — but more flexible.

const orderSchema = new mongoose.Schema({
  customer: String,
  product: String,
  category: String,
  price: Number,
  quantity: Number,
  status: { type: String, enum: ["pending", "completed", "cancelled"] },
  date: Date,
  tags: [String],
});

const Order = mongoose.model("Order", orderSchema);

async function demo() {
  await Order.deleteMany({});

  // Seed data
  await Order.create([
    { customer: "Praveen", product: "Laptop", category: "electronics", price: 999, quantity: 1, status: "completed", date: new Date("2025-01-15"), tags: ["tech", "premium"] },
    { customer: "Praveen", product: "Mouse", category: "electronics", price: 29, quantity: 2, status: "completed", date: new Date("2025-02-10"), tags: ["tech"] },
    { customer: "Jane", product: "JS Book", category: "books", price: 34, quantity: 1, status: "completed", date: new Date("2025-01-20"), tags: ["learning"] },
    { customer: "Jane", product: "T-Shirt", category: "clothing", price: 25, quantity: 3, status: "completed", date: new Date("2025-03-05"), tags: ["fashion"] },
    { customer: "Mike", product: "Headphones", category: "electronics", price: 79, quantity: 1, status: "pending", date: new Date("2025-03-15"), tags: ["tech", "audio"] },
    { customer: "Mike", product: "Node Book", category: "books", price: 29, quantity: 2, status: "completed", date: new Date("2025-02-28"), tags: ["learning", "programming"] },
    { customer: "Sara", product: "Phone", category: "electronics", price: 699, quantity: 1, status: "cancelled", date: new Date("2025-01-25"), tags: ["tech", "premium"] },
    { customer: "Sara", product: "Sneakers", category: "clothing", price: 89, quantity: 1, status: "completed", date: new Date("2025-03-10"), tags: ["fashion", "sport"] },
    { customer: "Praveen", product: "Keyboard", category: "electronics", price: 59, quantity: 1, status: "completed", date: new Date("2025-03-20"), tags: ["tech"] },
    { customer: "Jane", product: "Backpack", category: "accessories", price: 49, quantity: 1, status: "completed", date: new Date("2025-02-15"), tags: ["travel"] },
  ]);

  // ============================================
  // $match — Filter documents (like WHERE in SQL)
  // ============================================

  const completed = await Order.aggregate([
    { $match: { status: "completed" } },
  ]);
  console.log("Completed orders:", completed.length);

  // $match with multiple conditions
  const techCompleted = await Order.aggregate([
    { $match: { category: "electronics", status: "completed" } },
  ]);
  console.log("Completed electronics:", techCompleted.length);

  // ============================================
  // $group — Group and aggregate (like GROUP BY in SQL)
  // ============================================

  // Total revenue per category
  const revenueByCategory = await Order.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: "$category", // Group by this field
        totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } },
        orderCount: { $sum: 1 }, // Count orders
        avgPrice: { $avg: "$price" },
      },
    },
    { $sort: { totalRevenue: -1 } }, // Highest revenue first
  ]);
  console.log("\nRevenue by category:");
  revenueByCategory.forEach((r) =>
    console.log(`  ${r._id}: $${r.totalRevenue} (${r.orderCount} orders, avg $${r.avgPrice.toFixed(0)})`)
  );

  // ============================================
  // $group Accumulators
  // ============================================

  // $sum   — total/count
  // $avg   — average
  // $min   — minimum
  // $max   — maximum
  // $first — first value in group
  // $last  — last value in group
  // $push  — collect values into array

  // Overall stats
  const overallStats = await Order.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: null, // No grouping — aggregate all
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } },
        avgOrderValue: { $avg: { $multiply: ["$price", "$quantity"] } },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
  ]);
  console.log("\nOverall stats:", overallStats[0]);

  // ============================================
  // $sort — Sort results
  // ============================================

  // Revenue per customer, sorted highest first
  const topCustomers = await Order.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: "$customer",
        totalSpent: { $sum: { $multiply: ["$price", "$quantity"] } },
        orders: { $sum: 1 },
      },
    },
    { $sort: { totalSpent: -1 } }, // -1 = descending
  ]);
  console.log("\nTop customers:");
  topCustomers.forEach((c) => console.log(`  ${c._id}: $${c.totalSpent} (${c.orders} orders)`));

  // ============================================
  // $project — Reshape documents (include/exclude/rename)
  // ============================================

  const projected = await Order.aggregate([
    { $match: { status: "completed" } },
    {
      $project: {
        _id: 0, // Exclude _id
        customer: 1, // Include
        product: 1,
        total: { $multiply: ["$price", "$quantity"] }, // Computed field
        orderMonth: { $month: "$date" }, // Extract month from date
      },
    },
    { $sort: { total: -1 } },
    { $limit: 5 },
  ]);
  console.log("\nProjected (top 5):");
  projected.forEach((p) =>
    console.log(`  ${p.customer} - ${p.product}: $${p.total} (month ${p.orderMonth})`)
  );

  // ============================================
  // $unwind — Deconstruct arrays
  // ============================================

  // Each order has a tags array. $unwind creates one document per tag.
  const tagStats = await Order.aggregate([
    { $unwind: "$tags" }, // Split array: [{tags: ["tech","premium"]}] → [{tags:"tech"}, {tags:"premium"}]
    {
      $group: {
        _id: "$tags",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
  console.log("\nTag stats:");
  tagStats.forEach((t) => console.log(`  #${t._id}: ${t.count} orders`));

  // ============================================
  // $limit and $skip
  // ============================================

  // Get top 3 most expensive orders
  const top3 = await Order.aggregate([
    { $sort: { price: -1 } },
    { $limit: 3 },
    { $project: { product: 1, price: 1, _id: 0 } },
  ]);
  console.log("\nTop 3 expensive:", top3);

  // ============================================
  // $lookup — Join collections (like SQL JOIN)
  // ============================================

  // If we had a separate customers collection:
  // {
  //   $lookup: {
  //     from: "customers",       // Collection to join
  //     localField: "customer",  // Field in orders
  //     foreignField: "name",    // Field in customers
  //     as: "customerInfo"       // Output array field
  //   }
  // }

  // ============================================
  // Monthly Revenue Pipeline (complex example)
  // ============================================

  const monthlyRevenue = await Order.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: { $month: "$date" },
        revenue: { $sum: { $multiply: ["$price", "$quantity"] } },
        orders: { $sum: 1 },
        products: { $push: "$product" },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        month: "$_id",
        revenue: 1,
        orders: 1,
        products: 1,
      },
    },
  ]);
  console.log("\nMonthly revenue:");
  monthlyRevenue.forEach((m) =>
    console.log(`  Month ${m.month}: $${m.revenue} (${m.orders} orders) — ${m.products.join(", ")}`)
  );

  // Clean up
  await Order.deleteMany({});
  await mongoose.disconnect();
}

demo();
