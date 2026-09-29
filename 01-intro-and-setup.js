// MongoDB Introduction and Setup
// Run: node 01-intro-and-setup.js
// Requires: npm install mongoose

// ============================================
// What is MongoDB?
// ============================================

// MongoDB is a NoSQL database that stores data as JSON-like documents.
// Unlike SQL (tables, rows, columns), MongoDB uses collections and documents.
// Documents are flexible — different documents in the same collection can have different fields.

// SQL: INSERT INTO users (name, age) VALUES ('Praveen', 22);
// MongoDB: db.users.insertOne({ name: 'Praveen', age: 22 })

// ============================================
// Why MongoDB?
// ============================================

// 1. Flexible schema — no need to define all columns upfront
// 2. JSON-like documents — natural for JavaScript developers
// 3. Horizontal scaling — handles large amounts of data
// 4. Fast reads — documents stored together, no JOINs needed
// 5. Great for: APIs, real-time apps, content management, IoT

// ============================================
// What is Mongoose?
// ============================================

// Mongoose is an ODM (Object Document Mapper) for MongoDB.
// It adds structure to MongoDB with schemas, validation, and helpful methods.
// Without Mongoose: you use the native MongoDB driver (more manual).
// With Mongoose: you define schemas, get validation, hooks, populate, and more.

const mongoose = require("mongoose");

// ============================================
// Connecting to MongoDB
// ============================================

// Local MongoDB (default port 27017)
const LOCAL_URI = "mongodb://localhost:27017/learning_mongodb";

// MongoDB Atlas (cloud — get your URI from atlas.mongodb.com)
// const ATLAS_URI = 'mongodb+srv://username:password@cluster0.abc123.mongodb.net/learning_mongodb';

async function connectDB() {
  try {
    await mongoose.connect(LOCAL_URI);
    console.log("✅ MongoDB connected successfully");
    console.log("Database:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1); // Stop the app if DB connection fails
  }
}

// ============================================
// Connection Events
// ============================================

// Listen for connection events
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
});

// ============================================
// Graceful Shutdown (close connection on app exit)
// ============================================

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed (app termination)");
  process.exit(0);
});

// ============================================
// Connection Options (common settings)
// ============================================

// mongoose.connect(URI, {
//   maxPoolSize: 10,          // Max number of connections in the pool
//   serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
//   socketTimeoutMS: 45000,   // Close sockets after 45 seconds of inactivity
// });

// ============================================
// Quick Test — Create and Find a Document
// ============================================

// Define a simple schema
const testSchema = new mongoose.Schema({
  message: String,
  createdAt: { type: Date, default: Date.now },
});

const Test = mongoose.model("Test", testSchema);

async function quickTest() {
  await connectDB();

  // Create a document
  const doc = await Test.create({ message: "Hello MongoDB!" });
  console.log("Created:", doc);

  // Find all documents
  const allDocs = await Test.find();
  console.log("All documents:", allDocs);

  // Clean up
  await Test.deleteMany({});
  console.log("Cleaned up test documents");

  // Disconnect
  await mongoose.disconnect();
  console.log("Disconnected");
}

quickTest();
