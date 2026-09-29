// Read Operations — Finding Documents
// Run: node 05-read-operations.js

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  age: Number,
  role: { type: String, default: "user" },
  city: String,
  hobbies: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

async function demo() {
  await User.deleteMany({});

  // Seed data
  await User.create([
    {
      name: "Praveen",
      email: "praveen@email.com",
      age: 22,
      role: "admin",
      city: "Delhi",
      hobbies: ["coding", "reading"],
    },
    {
      name: "Jane",
      email: "jane@email.com",
      age: 25,
      city: "Mumbai",
      hobbies: ["painting"],
    },
    {
      name: "Mike",
      email: "mike@email.com",
      age: 30,
      city: "Delhi",
      hobbies: ["gaming", "coding"],
    },
    {
      name: "Sara",
      email: "sara@email.com",
      age: 21,
      city: "Bangalore",
      hobbies: ["yoga", "cooking"],
    },
    {
      name: "Alex",
      email: "alex@email.com",
      age: 27,
      role: "admin",
      city: "Chennai",
      hobbies: ["reading"],
    },
    {
      name: "Emma",
      email: "emma@email.com",
      age: 23,
      city: "Mumbai",
      isActive: false,
    },
    {
      name: "Tom",
      email: "tom@email.com",
      age: 35,
      city: "Delhi",
      hobbies: ["cricket"],
    },
    {
      name: "Lisa",
      email: "lisa@email.com",
      age: 24,
      city: "Bangalore",
      hobbies: ["dancing", "singing"],
    },
  ]);

  // ============================================
  // find() — Find all documents (or with filter)
  // ============================================

  // Find ALL users
  const allUsers = await User.find();
  console.log("All users:", allUsers.length);

  // Find with filter
  const delhiUsers = await User.find({ city: "Delhi" });
  console.log(
    "Delhi users:",
    delhiUsers.map((u) => u.name),
  );

  const admins = await User.find({ role: "admin" });
  console.log(
    "Admins:",
    admins.map((u) => u.name),
  );

  const activeUsers = await User.find({ isActive: true });
  console.log("Active users:", activeUsers.length);

  // ============================================
  // findById() — Find by _id
  // ============================================

  const firstUser = allUsers[0];
  const foundById = await User.findById(firstUser._id);
  console.log("Found by ID:", foundById.name);

  // ============================================
  // findOne() — Find the FIRST matching document
  // ============================================

  const oneUser = await User.findOne({ city: "Mumbai" });
  console.log("First Mumbai user:", oneUser.name);

  const admin = await User.findOne({ role: "admin" });
  console.log("First admin:", admin.name);

  // ============================================
  // select() — Choose which fields to return
  // ============================================

  // Only return name and email (include)
  const nameEmail = await User.find().select("name email");
  console.log("Name + email:", nameEmail[0]);
  // { _id: ..., name: "Praveen", email: "praveen@email.com" }

  // Exclude specific fields (prefix with -)
  const noAge = await User.find().select("-age -hobbies -__v");
  console.log("Without age/hobbies:", Object.keys(noAge[0].toObject()));

  // ============================================
  // sort() — Sort results
  // ============================================

  // Sort by age ascending (youngest first)
  const youngest = await User.find().sort({ age: 1 }).select("name age");
  console.log(
    "Youngest first:",
    youngest.map((u) => `${u.name}(${u.age})`),
  );

  // Sort by age descending (oldest first)
  const oldest = await User.find().sort({ age: -1 }).select("name age");
  console.log(
    "Oldest first:",
    oldest.map((u) => `${u.name}(${u.age})`),
  );

  // Sort by name alphabetically
  const alphabetical = await User.find().sort({ name: 1 }).select("name");
  console.log(
    "A-Z:",
    alphabetical.map((u) => u.name),
  );

  // Sort by multiple fields
  const multiSort = await User.find()
    .sort({ city: 1, age: -1 })
    .select("name city age");
  console.log(
    "By city then age:",
    multiSort.map((u) => `${u.city}-${u.name}(${u.age})`),
  );

  // ============================================
  // limit() and skip() — Pagination
  // ============================================

  // First 3 users
  const first3 = await User.find().limit(3).select("name");
  console.log(
    "First 3:",
    first3.map((u) => u.name),
  );

  // Skip first 3, get next 3 (page 2)
  const page2 = await User.find().skip(3).limit(3).select("name");
  console.log(
    "Page 2:",
    page2.map((u) => u.name),
  );

  // Pagination formula:
  // Page 1: skip(0).limit(5)    → items 1-5
  // Page 2: skip(5).limit(5)    → items 6-10
  // Page N: skip((N-1)*limit).limit(limit)

  const page = 2;
  const perPage = 3;
  const paginated = await User.find()
    .skip((page - 1) * perPage)
    .limit(perPage)
    .select("name");
  console.log(
    `Page ${page}:`,
    paginated.map((u) => u.name),
  );

  // ============================================
  // countDocuments() — Count matching documents
  // ============================================

  const totalCount = await User.countDocuments();
  console.log("Total users:", totalCount);

  const adminCount = await User.countDocuments({ role: "admin" });
  console.log("Admin count:", adminCount);

  const delhiCount = await User.countDocuments({ city: "Delhi" });
  console.log("Delhi count:", delhiCount);

  // ============================================
  // exists() — Check if any document matches
  // ============================================

  const hasAdmin = await User.exists({ role: "admin" });
  console.log("Has admin:", !!hasAdmin); // true

  const hasManager = await User.exists({ role: "manager" });
  console.log("Has manager:", !!hasManager); // false

  // ============================================
  // distinct() — Get unique values of a field
  // ============================================

  const cities = await User.distinct("city");
  console.log("Unique cities:", cities);

  const roles = await User.distinct("role");
  console.log("Unique roles:", roles);
}

demo();
