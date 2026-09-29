// Indexes and Performance — Making Queries Fast
// Run: node 14-indexes-and-performance.js

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

// ============================================
// What are Indexes?
// ============================================

// Without index: MongoDB scans EVERY document to find matches (collection scan).
// With index: MongoDB jumps directly to matching documents (index scan).
// Like a book's index — instead of reading every page, jump to the right page.

// Indexes make reads FASTER but writes SLOWER (because indexes must be updated).
// Only index fields you frequently search/sort/filter on.

// ============================================
// Creating Indexes on a Schema
// ============================================

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true }, // unique: true creates a unique index automatically
  age: Number,
  role: String,
  city: String,
  bio: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Single field index — speed up queries on this field
userSchema.index({ age: 1 }); // 1 = ascending, -1 = descending
// Now: User.find({ age: 22 }) uses the index (fast!)

// Compound index — index on multiple fields together
userSchema.index({ role: 1, city: 1 });
// Now: User.find({ role: 'admin', city: 'Delhi' }) uses the index
// Also helps: User.find({ role: 'admin' }) (left prefix)
// Does NOT help: User.find({ city: 'Delhi' }) (city is second in the compound)

// Unique index
userSchema.index({ email: 1 }, { unique: true });
// Prevents duplicate emails (already done by unique: true in schema)

// ============================================
// Text Index — Full-text search
// ============================================

userSchema.index({ name: "text", bio: "text" });
// Creates a text index on name and bio fields

// Now you can search:
// User.find({ $text: { $search: "developer" } })
// User.find({ $text: { $search: "full stack javascript" } })  → matches any word
// User.find({ $text: { $search: "\"full stack\"" } })         → matches exact phrase

// ============================================
// TTL Index — Auto-delete old documents
// ============================================

const sessionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  token: String,
  createdAt: { type: Date, default: Date.now },
});

// Auto-delete sessions after 24 hours (86400 seconds)
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
// MongoDB automatically removes documents when createdAt + 86400s < now

// ============================================
// Sparse Index — Only index documents that have the field
// ============================================

// userSchema.index({ phone: 1 }, { sparse: true });
// Only indexes documents where phone field exists
// Useful when many documents DON'T have the field

const User = mongoose.model("User", userSchema);
const Session = mongoose.model("Session", sessionSchema);

async function demo() {
  await User.deleteMany({});

  // Create test data
  const users = [];
  for (let i = 0; i < 100; i++) {
    users.push({
      name: `User ${i}`,
      email: `user${i}@email.com`,
      age: 18 + (i % 40),
      role: i % 3 === 0 ? "admin" : "user",
      city: ["Delhi", "Mumbai", "Bangalore", "Chennai"][i % 4],
      bio: `I am user ${i}. I love ${["coding", "reading", "gaming", "traveling"][i % 4]}.`,
      isActive: i % 5 !== 0,
    });
  }
  await User.insertMany(users);
  console.log("Created 100 users");

  // ============================================
  // explain() — Analyze Query Performance
  // ============================================

  // Check how a query is executed
  const explained = await User.find({ age: 25 }).explain("executionStats");
  console.log("\nQuery: find({ age: 25 })");
  console.log("  Docs examined:", explained.executionStats.totalDocsExamined);
  console.log("  Docs returned:", explained.executionStats.nReturned);
  console.log("  Execution time:", explained.executionStats.executionTimeMillis, "ms");
  // With index: totalDocsExamined ≈ nReturned (efficient!)
  // Without index: totalDocsExamined ≈ total documents (slow scan!)

  // ============================================
  // Using Text Index for Search
  // ============================================

  const searchResults = await User.find(
    { $text: { $search: "coding" } },
    { score: { $meta: "textScore" } } // Include relevance score
  )
    .sort({ score: { $meta: "textScore" } }) // Sort by relevance
    .limit(5)
    .select("name bio");
  console.log("\nText search 'coding':");
  searchResults.forEach((u) => console.log(`  ${u.name}: ${u.bio}`));

  // ============================================
  // List All Indexes on a Collection
  // ============================================

  const indexes = await User.collection.indexes();
  console.log("\nIndexes on users collection:");
  indexes.forEach((idx) => console.log(`  ${idx.name}:`, idx.key));

  // ============================================
  // Index Strategies — What to Index
  // ============================================

  // ✅ DO INDEX:
  // - Fields you frequently search on (email, username)
  // - Fields you sort on (createdAt, price)
  // - Fields used in $match stages of aggregation
  // - Unique fields (email, slug) — use unique: true
  // - Foreign key fields (author, userId) — speeds up populate

  // ❌ DON'T INDEX:
  // - Fields with low cardinality (isActive: true/false — only 2 values)
  // - Fields rarely queried
  // - Small collections (< 1000 docs — scan is fast enough)
  // - Fields that change very frequently (indexes slow down writes)

  // ============================================
  // Compound Index Order Matters!
  // ============================================

  // Index: { role: 1, city: 1 }
  //
  // ✅ Helps: find({ role: 'admin' })              → uses left prefix
  // ✅ Helps: find({ role: 'admin', city: 'Delhi' }) → uses full index
  // ❌ Doesn't help: find({ city: 'Delhi' })        → city is not the left prefix
  //
  // Rule: Put the most filtered field FIRST in compound indexes

  // ============================================
  // Performance Tips
  // ============================================

  // 1. Use .select() — only return needed fields
  const fast1 = await User.find({ role: "admin" }).select("name email");

  // 2. Use .lean() — return plain objects (2-3x faster)
  const fast2 = await User.find({ role: "admin" }).lean();

  // 3. Use .limit() — don't return more than needed
  const fast3 = await User.find().limit(10);

  // 4. Use .countDocuments() instead of find().length
  const count = await User.countDocuments({ role: "admin" }); // Uses index

  // 5. Avoid .find().then(results => results.length) — fetches ALL docs first

  console.log("\nAdmin count (indexed):", count);

  // Clean up
  await User.deleteMany({});
  await Session.deleteMany({});
  await mongoose.disconnect();
}

demo();
