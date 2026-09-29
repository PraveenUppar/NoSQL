// Create Operations — Inserting Documents
// Run: node 04-create-operations.js

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  age: Number,
  role: { type: String, enum: ["user", "admin"], default: "user" },
  hobbies: [String],
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

async function demo() {
  // Clean slate
  await User.deleteMany({});

  // ============================================
  // Method 1: Model.create() — most common
  // ============================================

  // Create a single document
  const user1 = await User.create({
    name: "Praveen",
    email: "praveen@email.com",
    age: 22,
    role: "admin",
    hobbies: ["coding", "reading"],
  });

  // ============================================
  // Method 4: Model.insertMany() — bulk insert (faster)
  // ============================================

  // insertMany is faster than create() for large datasets
  // It skips some Mongoose features (like some hooks)
  const bulkUsers = await User.insertMany([
    { name: "Emma", email: "emma@email.com", age: 23 },
    { name: "Tom", email: "tom@email.com", age: 26, role: "admin" },
    { name: "Lisa", email: "lisa@email.com", age: 24 },
  ]);
  console.log("Bulk inserted:", bulkUsers.length, "users");

  // ============================================
  // What's Returned After Create
  // ============================================

  const newUser = await User.create({
    name: "Kate",
    email: "kate@email.com",
    age: 28,
  });

  console.log("Full document:", newUser); // Full Mongoose document
  console.log("Plain object:", newUser.toObject()); // Plain JS object
  console.log("JSON:", newUser.toJSON()); // JSON-friendly object

  // Count total users
  const count = await User.countDocuments();
  console.log("Total users:", count);
}

demo();
