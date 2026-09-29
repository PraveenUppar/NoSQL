// Schemas and Models — Defining Document Structure
// Run: node 02-schemas-and-models.js

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

// ============================================
// What is a Schema?
// ============================================

// A Schema defines the STRUCTURE of documents in a collection.
// It specifies: field names, data types, and rules (validation).
// Think of it as a blueprint for your documents.

// ============================================
// Basic Schema Definition
// ============================================

const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: String,
  isActive: Boolean,
});

// This means every User document will have: name, age, email, isActive

// ============================================
// What is a Model?
// ============================================

// A Model is a wrapper around the Schema.
// It provides CRUD methods: create, find, update, delete.
// mongoose.model('ModelName', schema) creates the model.
// The collection name is auto-generated: 'ModelName' → 'modelnames' (lowercase + plural)

const User = mongoose.model("User", userSchema);
// "User" model → "users" collection in MongoDB

// ============================================
// All Mongoose Data Types
// ============================================

const allTypesSchema = new mongoose.Schema({
  // String — text values
  name: String,
  title: { type: String },

  // Number — integers and decimals
  age: Number,
  price: { type: Number },

  // Boolean — true/false
  isActive: Boolean,
  isVerified: { type: Boolean },

  // Date — date and time
  createdAt: Date,
  birthDate: { type: Date },

  // ObjectId — reference to another document
  author: mongoose.Schema.Types.ObjectId,
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

  // Array — list of values
  tags: [String], // Array of strings
  scores: [Number], // Array of numbers
  comments: [{ text: String, date: Date }], // Array of objects

  // Nested Object — embedded document
  address: {
    street: String,
    city: String,
    zipCode: String,
  },

  // Mixed — any type (no validation, avoid if possible)
  metadata: mongoose.Schema.Types.Mixed,

  // Buffer — binary data (files, images)
  profileImage: Buffer,

  // Map — key-value pairs with dynamic keys
  socialLinks: {
    type: Map,
    of: String,
    // { github: 'url', twitter: 'url', linkedin: 'url' }
  },
});

// ============================================
// Schema with More Detail
// ============================================

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // Must have a value
  },
  price: {
    type: Number,
    required: true,
    min: 0, // Cannot be negative
  },
  category: {
    type: String,
    enum: ["electronics", "clothing", "books"], // Only these values allowed
  },
  tags: {
    type: [String], // Array of strings
    default: [], // Default to empty array
  },
  inStock: {
    type: Boolean,
    default: true, // Default value
  },
  createdAt: {
    type: Date,
    default: Date.now, // Auto-set to current date
  },
});

const Product = mongoose.model("Product", productSchema);
