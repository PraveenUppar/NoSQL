// Transactions and Advanced Features
// Run: node 15-transactions-and-advanced.js
// Note: Transactions require MongoDB replica set (Atlas or local replica set)

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

// ============================================
// Transactions — Atomic Multi-Document Operations
// ============================================

// A transaction ensures that multiple operations either ALL succeed or ALL fail.
// Like transferring money: debit FROM one account AND credit TO another.
// If credit fails, debit should also be rolled back.

// Example models
const accountSchema = new mongoose.Schema({
  owner: String,
  balance: { type: Number, default: 0 },
});

const transactionLogSchema = new mongoose.Schema({
  from: String,
  to: String,
  amount: Number,
  date: { type: Date, default: Date.now },
});

const Account = mongoose.model("Account", accountSchema);
const TransactionLog = mongoose.model("TransactionLog", transactionLogSchema);

// Transfer money using a transaction
async function transferMoney(fromId, toId, amount) {
  // Start a session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Debit from sender
    const sender = await Account.findByIdAndUpdate(
      fromId,
      { $inc: { balance: -amount } },
      { session, new: true }
    );

    if (sender.balance < 0) {
      throw new Error("Insufficient balance");
    }

    // Credit to receiver
    await Account.findByIdAndUpdate(
      toId,
      { $inc: { balance: amount } },
      { session }
    );

    // Log the transaction
    await TransactionLog.create(
      [{ from: fromId, to: toId, amount }],
      { session }
    );

    // All operations succeeded — commit
    await session.commitTransaction();
    console.log(`Transferred $${amount} successfully`);
  } catch (error) {
    // Something failed — rollback ALL operations
    await session.abortTransaction();
    console.log("Transfer failed:", error.message);
  } finally {
    session.endSession();
  }
}

// ============================================
// Discriminators — Schema Inheritance
// ============================================

// Discriminators let you store different types in the SAME collection
// with different schemas. Like class inheritance.

const eventSchema = new mongoose.Schema(
  { name: String, date: Date },
  { discriminatorKey: "type" } // Field that stores the type
);

const Event = mongoose.model("Event", eventSchema);

// ClickEvent extends Event with extra fields
const ClickEvent = Event.discriminator(
  "ClickEvent",
  new mongoose.Schema({
    element: String, // Which element was clicked
    url: String, // On which page
  })
);

// PurchaseEvent extends Event with different extra fields
const PurchaseEvent = Event.discriminator(
  "PurchaseEvent",
  new mongoose.Schema({
    product: String,
    amount: Number,
  })
);

// All events stored in the same "events" collection!
// ClickEvent has: name, date, type, element, url
// PurchaseEvent has: name, date, type, product, amount

// ============================================
// Schema Plugins — Reusable Schema Logic
// ============================================

// A plugin adds the same functionality to multiple schemas

function timestampPlugin(schema) {
  // Add fields
  schema.add({
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });

  // Add pre-save hook
  schema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
  });

  // Add a method
  schema.methods.getAge = function () {
    const ms = Date.now() - this.createdAt.getTime();
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return `${days} days old`;
  };
}

function softDeletePlugin(schema) {
  schema.add({
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
  });

  schema.methods.softDelete = async function () {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
  };

  schema.methods.restore = async function () {
    this.isDeleted = false;
    this.deletedAt = undefined;
    return this.save();
  };

  // Auto-exclude deleted documents
  schema.pre(/^find/, function (next) {
    if (!this.getOptions().includeDeleted) {
      this.where({ isDeleted: { $ne: true } });
    }
    next();
  });
}

// Apply plugins to any schema
const articleSchema = new mongoose.Schema({ title: String, content: String });
articleSchema.plugin(timestampPlugin);
articleSchema.plugin(softDeletePlugin);

const Article = mongoose.model("Article", articleSchema);

// ============================================
// bulkWrite() — Batch Operations
// ============================================

// Perform multiple different operations in a single call
async function bulkDemo() {
  await Account.bulkWrite([
    {
      insertOne: { document: { owner: "Alice", balance: 1000 } },
    },
    {
      insertOne: { document: { owner: "Bob", balance: 500 } },
    },
    {
      updateOne: {
        filter: { owner: "Alice" },
        update: { $inc: { balance: 100 } },
      },
    },
    {
      deleteOne: {
        filter: { owner: "Bob" },
      },
    },
  ]);
  console.log("Bulk operations completed");
}

// ============================================
// Connection Pooling (Production Settings)
// ============================================

// mongoose.connect(URI, {
//   maxPoolSize: 10,            // Max connections in pool (default: 5)
//   minPoolSize: 2,             // Min connections kept alive
//   serverSelectionTimeoutMS: 5000,  // Timeout for server selection
//   heartbeatFrequencyMS: 10000,     // How often to check server health
//   socketTimeoutMS: 45000,          // Close socket after inactivity
// });

// ============================================
// Demo
// ============================================

async function demo() {
  await Account.deleteMany({});
  await Event.deleteMany({});
  await Article.deleteMany({});

  // --- Discriminators ---
  console.log("=== Discriminators ===");
  const click = await ClickEvent.create({
    name: "button_click",
    date: new Date(),
    element: "signup-btn",
    url: "/home",
  });
  const purchase = await PurchaseEvent.create({
    name: "checkout",
    date: new Date(),
    product: "Laptop",
    amount: 999,
  });

  // Query all events (both types)
  const allEvents = await Event.find();
  console.log("All events:", allEvents.length);
  allEvents.forEach((e) => console.log(`  ${e.type}: ${e.name}`));

  // Query only click events
  const clicks = await ClickEvent.find();
  console.log("Click events:", clicks.length);

  // --- Plugins ---
  console.log("\n=== Plugins ===");
  const article = await Article.create({ title: "Test Article", content: "Hello World" });
  console.log("Created:", article.title);
  console.log("Age:", article.getAge()); // From timestampPlugin
  console.log("isDeleted:", article.isDeleted); // From softDeletePlugin

  // Soft delete
  await article.softDelete();
  console.log("After soft delete — isDeleted:", article.isDeleted);

  // Find (excludes soft-deleted by default)
  const active = await Article.find();
  console.log("Active articles:", active.length); // 0

  // Restore
  await article.restore();
  const restored = await Article.find();
  console.log("After restore:", restored.length); // 1

  // --- Bulk Write ---
  console.log("\n=== Bulk Write ===");
  await bulkDemo();
  const accounts = await Account.find();
  accounts.forEach((a) => console.log(`  ${a.owner}: $${a.balance}`));

  // Clean up
  await Account.deleteMany({});
  await Event.deleteMany({});
  await Article.deleteMany({});
  await TransactionLog.deleteMany({});
  await mongoose.disconnect();
}

demo();
