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
