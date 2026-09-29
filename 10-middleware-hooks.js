// Middleware (Hooks) — Run Logic Before/After Operations
// Run: node 10-middleware-hooks.js

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

// ============================================
// What are Middleware/Hooks?
// ============================================

// Middleware are functions that run automatically before or after certain operations.
// "Pre" middleware runs BEFORE the operation.
// "Post" middleware runs AFTER the operation.
// They let you add logic without cluttering your routes.

// Common use cases:
// - Hash password before saving
// - Set timestamps
// - Log queries
// - Auto-populate references
// - Clean up related data on delete

// ============================================
// Document Middleware — Runs on .save() and .create()
// ============================================

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, lowercase: true },
  password: String,
  slug: String,
  loginCount: { type: Number, default: 0 },
  lastModified: Date,
});

// PRE-SAVE — runs BEFORE document.save() or Model.create()
userSchema.pre("save", function (next) {
  console.log(`Pre-save: About to save "${this.name}"`);

  // 'this' refers to the document being saved

  // Example: Generate a slug from the name
  this.slug = this.name.toLowerCase().replace(/\s+/g, "-");

  // Example: Set lastModified
  this.lastModified = new Date();

  // Example: Hash password (simplified — use bcrypt in real apps)
  if (this.isModified("password")) {
    console.log("Password changed — would hash here");
    // this.password = await bcrypt.hash(this.password, 12);
  }

  next(); // MUST call next() to continue
});

// POST-SAVE — runs AFTER document is saved
userSchema.post("save", function (doc) {
  console.log(`Post-save: "${doc.name}" saved successfully (ID: ${doc._id})`);
  // 'doc' is the saved document
  // No next() needed in post middleware
});

// ============================================
// Query Middleware — Runs on .find(), .findOne(), etc.
// ============================================

// PRE-FIND — runs before any find query
// /^find/ matches: find, findOne, findById, findOneAndUpdate, etc.
userSchema.pre(/^find/, function (next) {
  // 'this' refers to the query object

  // Example: Track query execution time
  this._startTime = Date.now();

  // Example: Auto-exclude inactive users
  // this.where({ isActive: { $ne: false } });

  next();
});

// POST-FIND — runs after the query executes
userSchema.post(/^find/, function (docs, next) {
  const time = Date.now() - this._startTime;
  console.log(`Query took ${time}ms`);

  // 'docs' is the result (array for find, single doc for findOne)
  next();
});

// ============================================
// Pre-findOneAndUpdate — Runs before updates
// ============================================

userSchema.pre("findOneAndUpdate", function (next) {
  // 'this' refers to the query, NOT the document
  // Use this.getUpdate() to see what's being updated
  console.log("Pre-update:", this.getUpdate());

  // Auto-set lastModified on update
  this.set({ lastModified: new Date() });

  next();
});

// ============================================
// Pre-findOneAndDelete — Runs before delete
// ============================================

userSchema.pre("findOneAndDelete", async function (next) {
  const userId = this.getQuery()["_id"];
  console.log("Pre-delete: About to delete user:", userId);

  // Example: Clean up related data
  // await Post.deleteMany({ author: userId });
  // await Comment.deleteMany({ user: userId });

  next();
});

// ============================================
// isModified() — Check if a field changed
// ============================================

// userSchema.pre('save', function(next) {
//   if (this.isModified('email')) {
//     console.log('Email changed! Send verification...');
//   }
//   if (this.isModified('password')) {
//     console.log('Password changed! Hash it...');
//   }
//   if (this.isNew) {
//     console.log('This is a brand new document!');
//   }
//   next();
// });

// ============================================
// Error Handling Middleware
// ============================================

// Catches errors from the previous middleware
userSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("Duplicate key: Email already exists"));
  } else {
    next(error);
  }
});

// ============================================
// Demo
// ============================================

const User = mongoose.model("User", userSchema);

async function demo() {
  await User.deleteMany({});

  // Create triggers pre-save and post-save
  console.log("\n--- Creating user ---");
  const user = await User.create({
    name: "Praveen Uppar",
    email: "PRAVEEN@EMAIL.COM",
    password: "secret123",
  });
  console.log("Slug:", user.slug); // "praveen-uppar" (set by pre-save)
  console.log("LastModified:", user.lastModified); // Set by pre-save

  // Find triggers pre-find and post-find
  console.log("\n--- Finding users ---");
  const found = await User.find();
  console.log("Found:", found.length, "users");

  // Update triggers pre-findOneAndUpdate
  console.log("\n--- Updating user ---");
  const updated = await User.findByIdAndUpdate(
    user._id,
    { name: "Praveen Updated" },
    { new: true }
  );
  console.log("Updated lastModified:", updated.lastModified);

  // Save after modification triggers pre-save again
  console.log("\n--- Saving modified user ---");
  user.password = "newpassword";
  await user.save(); // Triggers pre-save, detects password modified

  // Clean up
  await User.deleteMany({});
  await mongoose.disconnect();
}

demo();

// ============================================
// Summary
// ============================================

// pre('save')              → Before .save() or .create() — 'this' = document
// post('save')             → After save — receives saved document
// pre(/^find/)             → Before any find query — 'this' = query
// post(/^find/)            → After find — receives results
// pre('findOneAndUpdate')  → Before update — 'this' = query
// pre('findOneAndDelete')  → Before delete — 'this' = query
//
// Always call next() in pre middleware!
// Use this.isModified('field') to check if a field changed
// Use this.isNew to check if document is being created for the first time
