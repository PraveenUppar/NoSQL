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
  console.log("Created:", user1);
  console.log("ID:", user1._id);

  // ============================================
  // Method 2: new Model() + .save() — manual control
  // ============================================

  // Useful when you want to modify the document before saving
  const user2 = new User({
    name: "Jane",
    email: "jane@email.com",
    age: 25,
  });

  // Modify before saving
  user2.hobbies = ["painting", "music"];

  // Now save to database
  await user2.save();
  console.log("Saved:", user2);

  // Difference:
  // create()       → creates AND saves in one step
  // new + save()   → creates in memory, then saves (two steps)

  // ============================================
  // Method 3: Model.create() — create multiple at once
  // ============================================

  const multipleUsers = await User.create([
    { name: "Mike", email: "mike@email.com", age: 30 },
    { name: "Sara", email: "sara@email.com", age: 21, hobbies: ["yoga"] },
    { name: "Alex", email: "alex@email.com", age: 27 },
  ]);
  console.log("Created multiple:", multipleUsers.length, "users");

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
  // Auto-generated _id (ObjectId)
  // ============================================

  const user3 = await User.create({ name: "Ryan", email: "ryan@email.com" });
  console.log("ObjectId:", user3._id);
  console.log("ID as string:", user3._id.toString());
  console.log("Created timestamp:", user3._id.getTimestamp());
  // ObjectId contains a timestamp of when it was created!

  // ============================================
  // Handling Duplicate Key Errors
  // ============================================

  try {
    // Try to create a user with an email that already exists
    await User.create({ name: "Duplicate", email: "praveen@email.com" });
  } catch (error) {
    if (error.code === 11000) {
      console.log("Duplicate key error: Email already exists");
      console.log("Duplicate field:", Object.keys(error.keyValue));
    }
  }

  // ============================================
  // Handling Validation Errors
  // ============================================

  try {
    // Missing required field (name)
    await User.create({ email: "noname@email.com" });
  } catch (error) {
    if (error.name === "ValidationError") {
      // Get all validation error messages
      const messages = Object.values(error.errors).map((e) => e.message);
      console.log("Validation errors:", messages);
    }
  }

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

  // Clean up
  await User.deleteMany({});
  await mongoose.disconnect();
}

demo();
