// Schema Options — Field Validators, Timestamps, and Configuration
// Run: node 03-schema-options.js

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

// ============================================
// Field Options (per-field configuration)
// ============================================

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"], // Must have a value + custom error
    trim: true, // Removes whitespace: "  Praveen  " → "Praveen"
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true, // No duplicate emails (creates a unique index)
    lowercase: true, // Converts to lowercase: "PRAVEEN@EMAIL.COM" → "praveen@email.com"
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
  },
  age: {
    type: Number,
    min: [0, "Age cannot be negative"],
    max: [150, "Age must be realistic"],
  },
  role: {
    type: String,
    enum: {
      values: ["user", "admin", "moderator"],
      message: "{VALUE} is not a valid role", // {VALUE} = the value that failed
    },
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters"],
    select: false, // Excluded from query results by default
    // To include: User.findOne({ email }).select('+password')
  },
  isActive: {
    type: Boolean,
    default: true, // Default value if not provided
  },
  bio: {
    type: String,
    maxlength: [500, "Bio cannot exceed 500 characters"],
    default: "", // Default empty string
  },
  joinedAt: {
    type: Date,
    default: Date.now, // Auto-set to current date
    immutable: true, // Cannot be changed after creation
  },
});

// ============================================
// Schema-Level Options
// ============================================

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: String,
  },
  {
    // ---- Schema Options ----
    timestamps: true, // Adds createdAt and updatedAt automatically
    // createdAt: set on create, never changes
    // updatedAt: updated on every save/update

    versionKey: false, // Removes __v field (default is true, adds __v: 0)

    toJSON: { virtuals: true }, // Include virtual fields in JSON output
    toObject: { virtuals: true }, // Include virtual fields in object output

    strict: true, // Default: true. Only fields in schema are saved.
    // strict: false → allows saving ANY field (not recommended)

    collection: "blog_posts", // Custom collection name (default: "posts")
  }
);

// ============================================
// timestamps Example
// ============================================

// With timestamps: true, Mongoose auto-manages:
// createdAt: 2025-09-16T10:00:00.000Z   (set once on create)
// updatedAt: 2025-09-16T10:30:00.000Z   (updated on every .save() or update)

// You don't need to manually add these fields!

// ============================================
// strict Mode
// ============================================

// strict: true (default):
// const user = new User({ name: 'Praveen', unknownField: 'hello' });
// await user.save();
// unknownField is silently IGNORED — not saved to the database.

// strict: false:
// unknownField WOULD be saved. Avoid this — defeats the purpose of schemas.

// ============================================
// select: false (hide fields by default)
// ============================================

// password field has select: false
// User.find() → password is NOT included in results
// User.findOne({ email }).select('+password') → explicitly include password

// ============================================
// immutable (cannot be changed)
// ============================================

// joinedAt has immutable: true
// user.joinedAt = new Date(); user.save(); → joinedAt stays the same

// ============================================
// Demo
// ============================================

const User = mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);

async function demo() {
  // Create a user
  const user = await User.create({
    name: "Praveen",
    email: "PRAVEEN@EMAIL.COM", // Will be lowercased
    age: 22,
    password: "securepassword",
    role: "admin",
  });
  console.log("User:", user);
  // Notice: password is NOT shown (select: false)
  // Notice: email is lowercase
  // Notice: isActive defaults to true

  // Try to find user — password hidden
  const found = await User.findById(user._id);
  console.log("Found (no password):", found);

  // Explicitly include password
  const withPassword = await User.findById(user._id).select("+password");
  console.log("With password:", withPassword);

  // Create a post (with timestamps)
  const post = await Post.create({
    title: "Hello MongoDB",
    content: "Learning schemas!",
    author: "Praveen",
  });
  console.log("Post:", post);
  // Notice: createdAt and updatedAt are auto-added

  // Try invalid data
  try {
    await User.create({ name: "X", email: "bad", age: -5 });
  } catch (err) {
    console.log("Validation errors:", err.message);
  }

  // Clean up
  await User.deleteMany({});
  await Post.deleteMany({});
  await mongoose.disconnect();
}

demo();
