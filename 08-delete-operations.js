// Delete Operations — Removing Documents
// Run: node 08-delete-operations.js

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number,
  role: { type: String, default: "user" },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
}, { timestamps: true });

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
  // Soft Delete Pattern (Recommended for production)
  // ============================================

  // Instead of permanently deleting, mark as deleted.
  // This way you can "undo" deletes and keep audit history.

  // Reset data
  await User.deleteMany({});
  await User.create([
    { name: "Praveen", email: "praveen@email.com", age: 22 },
    { name: "Jane", email: "jane@email.com", age: 25 },
    { name: "Mike", email: "mike@email.com", age: 30 },
  ]);

  // Soft delete: set isDeleted to true instead of removing
  const softDeleted = await User.findOneAndUpdate(
    { name: "Mike" },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
  console.log("Soft deleted:", softDeleted.name, "isDeleted:", softDeleted.isDeleted);

  // Find only active (non-deleted) users
  const activeUsers = await User.find({ isDeleted: false }).select("name");
  console.log("Active users:", activeUsers.map((u) => u.name));
  // Mike is excluded!

  // Find deleted users
  const deletedUsers = await User.find({ isDeleted: true }).select("name deletedAt");
  console.log("Deleted users:", deletedUsers.map((u) => `${u.name} (deleted: ${u.deletedAt})`));

  // Restore a soft-deleted user
  await User.findOneAndUpdate(
    { name: "Mike" },
    { isDeleted: false, $unset: { deletedAt: "" } }
  );
  console.log("Restored Mike");

  // ============================================
  // Auto-filter soft deletes with pre-find hook
  // ============================================

  // Add this to your schema to auto-exclude deleted docs:
  //
  // userSchema.pre(/^find/, function(next) {
  //   this.where({ isDeleted: { $ne: true } });
  //   next();
  // });
  //
  // Now User.find() automatically excludes soft-deleted docs!

  // ============================================
  // Cleaning Up Related Data on Delete
  // ============================================

  // When you delete a user, also delete their posts:
  //
  // userSchema.pre('findOneAndDelete', async function(next) {
  //   const userId = this.getQuery()['_id'];
  //   await Post.deleteMany({ author: userId });
  //   next();
  // });

  // ============================================
  // Summary
  // ============================================

  // findByIdAndDelete(id)          → Delete by ID, returns deleted doc
  // findOneAndDelete(filter)       → Delete first match, returns deleted doc
  // deleteOne(filter)              → Delete first match, returns { deletedCount }
  // deleteMany(filter)             → Delete all matches, returns { deletedCount }
  // deleteMany({})                 → Delete ALL documents (⚠️ careful!)
  //
  // Soft delete: isDeleted: true   → Keeps data, can undo
  // Hard delete: deleteOne/Many    → Permanent, cannot undo

  // Clean up
  await User.deleteMany({});
  await mongoose.disconnect();
}

demo();
