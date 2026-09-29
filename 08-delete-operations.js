// Delete Operations — Removing Documents
// Run: node 08-delete-operations.js

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    age: Number,
    role: { type: String, default: "user" },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

async function demo() {
  await User.deleteMany({});

  // Seed data
  await User.create([
    { name: "Praveen", email: "praveen@email.com", age: 22, role: "admin" },
    { name: "Jane", email: "jane@email.com", age: 25 },
    { name: "Mike", email: "mike@email.com", age: 30 },
    { name: "Sara", email: "sara@email.com", age: 21 },
    { name: "Alex", email: "alex@email.com", age: 27 },
    { name: "Emma", email: "emma@email.com", age: 23 },
  ]);

  console.log("Total before delete:", await User.countDocuments());

  // ============================================
  // findByIdAndDelete() — Delete by _id (returns deleted doc)
  // ============================================

  const allUsers = await User.find();
  const deleted1 = await User.findByIdAndDelete(allUsers[5]._id);
  console.log("Deleted:", deleted1.name); // "Emma"
  // Returns the deleted document (useful for logging or undo)

  // ============================================
  // findOneAndDelete() — Delete first matching document
  // ============================================

  const deleted2 = await User.findOneAndDelete({ name: "Alex" });
  console.log("Deleted:", deleted2.name); // "Alex"
  // Returns the deleted document

  // ============================================
  // deleteOne() — Delete one document (doesn't return it)
  // ============================================

  const result1 = await User.deleteOne({ name: "Mike" });
  console.log("deleteOne:", result1);
  // { acknowledged: true, deletedCount: 1 }

  // ============================================
  // deleteMany() — Delete multiple documents
  // ============================================

  // Delete all users with role "user"
  // const result2 = await User.deleteMany({ role: "user" });
  // console.log('deleteMany:', result2.deletedCount, 'deleted');

  // Delete ALL documents in the collection
  // await User.deleteMany({});   // ⚠️ Dangerous! Deletes everything!

  console.log("Total after deletes:", await User.countDocuments());

  // ============================================
  // Summary
  // ============================================

  // findByIdAndDelete(id)          → Delete by ID, returns deleted doc
  // findOneAndDelete(filter)       → Delete first match, returns deleted doc
  // deleteOne(filter)              → Delete first match, returns { deletedCount }
  // deleteMany(filter)             → Delete all matches, returns { deletedCount }
  // deleteMany({})                 → Delete ALL documents (⚠️ careful!)
}

demo();
