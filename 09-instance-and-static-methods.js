// Instance Methods, Static Methods, and Virtuals
// Run: node 11-instance-and-static-methods.js

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

// ============================================
// Instance Methods — Methods on individual documents
// ============================================

// Instance methods are called on a SINGLE document.
// Example: user.getProfile(), user.comparePassword()

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  age: Number,
  role: { type: String, default: "user" },
  salary: Number,
  isActive: { type: Boolean, default: true },
});

// Define instance methods using schema.methods
userSchema.methods.getProfile = function () {
  // 'this' refers to the individual document
  return {
    name: `${this.firstName} ${this.lastName}`,
    email: this.email,
    role: this.role,
  };
};

userSchema.methods.comparePassword = function (candidatePassword) {
  // In real apps, use bcrypt.compare()
  return this.password === candidatePassword;
};

userSchema.methods.deactivate = async function () {
  this.isActive = false;
  return this.save(); // Save changes to DB
};

userSchema.methods.giveRaise = async function (percentage) {
  this.salary = Math.round(this.salary * (1 + percentage / 100));
  return this.save();
};

// ============================================
// Static Methods — Methods on the Model itself
// ============================================

// Static methods are called on the MODEL (not individual documents).
// Example: User.findByEmail(), User.getAdmins()

userSchema.statics.findByEmail = function (email) {
  // 'this' refers to the Model
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.getAdmins = function () {
  return this.find({ role: "admin" });
};

userSchema.statics.getActiveUsers = function () {
  return this.find({ isActive: true });
};

userSchema.statics.getAgeStats = async function () {
  const stats = await this.aggregate([
    { $group: { _id: null, avgAge: { $avg: "$age" }, minAge: { $min: "$age" }, maxAge: { $max: "$age" }, count: { $sum: 1 } } },
  ]);
  return stats[0];
};

// ============================================
// Query Helpers — Chainable custom query methods
// ============================================

// Query helpers let you create custom chainable methods.
// Example: User.find().byRole('admin').active()

userSchema.query.byRole = function (role) {
  return this.where({ role });
};

userSchema.query.active = function () {
  return this.where({ isActive: true });
};

userSchema.query.olderThan = function (age) {
  return this.where({ age: { $gt: age } });
};

// ============================================
// Virtual Fields — Computed properties NOT stored in DB
// ============================================

// Virtuals are fields that don't exist in the database.
// They are computed on the fly when you access them.

// Virtual getter: fullName
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual getter: isAdmin
userSchema.virtual("isAdmin").get(function () {
  return this.role === "admin";
});

// Virtual getter: monthlySalary
userSchema.virtual("monthlySalary").get(function () {
  if (!this.salary) return null;
  return Math.round(this.salary / 12);
});

// Virtual setter: fullName
userSchema.virtual("fullName").set(function (fullName) {
  const parts = fullName.split(" ");
  this.firstName = parts[0];
  this.lastName = parts.slice(1).join(" ");
});

// Enable virtuals in JSON and Object output
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

const User = mongoose.model("User", userSchema);

// ============================================
// Demo
// ============================================

async function demo() {
  await User.deleteMany({});

  // Create users
  await User.create([
    { firstName: "Praveen", lastName: "Uppar", email: "praveen@email.com", password: "secret", age: 22, role: "admin", salary: 120000 },
    { firstName: "Jane", lastName: "Doe", email: "jane@email.com", password: "pass123", age: 25, salary: 85000 },
    { firstName: "Mike", lastName: "Smith", email: "mike@email.com", password: "mike123", age: 30, role: "admin", salary: 95000 },
    { firstName: "Sara", lastName: "Khan", email: "sara@email.com", password: "sara123", age: 21, salary: 72000, isActive: false },
  ]);

  // --- Instance Methods ---
  console.log("=== Instance Methods ===");
  const user = await User.findOne({ email: "praveen@email.com" });

  console.log("Profile:", user.getProfile());
  console.log("Password match:", user.comparePassword("secret")); // true
  console.log("Wrong password:", user.comparePassword("wrong")); // false

  await user.giveRaise(10); // 10% raise
  console.log("After raise:", user.salary); // 132000

  // --- Static Methods ---
  console.log("\n=== Static Methods ===");
  const found = await User.findByEmail("JANE@EMAIL.COM");
  console.log("findByEmail:", found.firstName);

  const admins = await User.getAdmins();
  console.log("Admins:", admins.map((u) => u.firstName));

  const stats = await User.getAgeStats();
  console.log("Age stats:", stats);

  // --- Query Helpers ---
  console.log("\n=== Query Helpers ===");
  const activeAdmins = await User.find().byRole("admin").active().select("firstName");
  console.log("Active admins:", activeAdmins.map((u) => u.firstName));

  const olderActive = await User.find().olderThan(23).active().select("firstName age");
  console.log("Active & >23:", olderActive.map((u) => `${u.firstName}(${u.age})`));

  // --- Virtual Fields ---
  console.log("\n=== Virtuals ===");
  console.log("Full name:", user.fullName); // "Praveen Uppar"
  console.log("Is admin:", user.isAdmin); // true
  console.log("Monthly salary:", user.monthlySalary); // 11000

  // Virtual setter
  const newUser = new User();
  newUser.fullName = "John Williams";
  console.log("First:", newUser.firstName); // "John"
  console.log("Last:", newUser.lastName); // "Williams"

  // Virtuals in JSON output
  const json = user.toJSON();
  console.log("JSON has fullName:", "fullName" in json); // true
  console.log("JSON has monthlySalary:", "monthlySalary" in json); // true

  // Clean up
  await User.deleteMany({});
  await mongoose.disconnect();
}

demo();
