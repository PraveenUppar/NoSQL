// Validation — Ensuring Data Integrity
// Run: node 09-validation.js

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

// ============================================
// Built-in Validators
// ============================================

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
  },
  age: {
    type: Number,
    min: [0, "Age cannot be negative"],
    max: [150, "Age seems unrealistic"],
  },
  role: {
    type: String,
    enum: {
      values: ["user", "admin", "moderator"],
      message: "{VALUE} is not a valid role",
    },
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters"],
  },
  website: {
    type: String,
    match: [/^https?:\/\/.+/, "Website must start with http:// or https://"],
  },
});

const User = mongoose.model("User", userSchema);

// ============================================
// Custom Validators
// ============================================

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        // Name must contain at least one letter
        return /[a-zA-Z]/.test(value);
      },
      message: "Name must contain at least one letter",
    },
  },
  price: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        return value > 0;
      },
      message: "Price must be a positive number",
    },
  },
  discountPrice: {
    type: Number,
    validate: {
      validator: function (value) {
        // Discount must be less than price
        // 'this' refers to the current document
        return value < this.price;
      },
      message: "Discount price ({VALUE}) must be less than the regular price",
    },
  },
  tags: {
    type: [String],
    validate: {
      validator: function (arr) {
        return arr.length <= 5; // Max 5 tags
      },
      message: "Cannot have more than 5 tags",
    },
  },
  sku: {
    type: String,
    validate: {
      validator: function (value) {
        // SKU format: 3 letters + 3 numbers (e.g., ABC123)
        return /^[A-Z]{3}[0-9]{3}$/.test(value);
      },
      message: "SKU must be 3 uppercase letters followed by 3 numbers (e.g., ABC123)",
    },
  },
});

const Product = mongoose.model("Product", productSchema);

// ============================================
// Conditional Required (required based on another field)
// ============================================

const orderSchema = new mongoose.Schema({
  product: { type: String, required: true },
  paymentMethod: {
    type: String,
    enum: ["card", "cash", "upi"],
    required: true,
  },
  cardNumber: {
    type: String,
    // Required ONLY if paymentMethod is "card"
    required: function () {
      return this.paymentMethod === "card";
    },
    validate: {
      validator: function (v) {
        return /^\d{16}$/.test(v); // 16 digits
      },
      message: "Card number must be 16 digits",
    },
  },
  upiId: {
    type: String,
    required: function () {
      return this.paymentMethod === "upi";
    },
  },
});

const Order = mongoose.model("Order", orderSchema);

async function demo() {
  await User.deleteMany({});
  await Product.deleteMany({});

  // ============================================
  // Testing Validation — Success Cases
  // ============================================

  const validUser = await User.create({
    name: "Praveen",
    email: "praveen@email.com",
    age: 22,
    password: "secure123",
  });
  console.log("Valid user created:", validUser.name);

  // ============================================
  // Testing Validation — Failure Cases
  // ============================================

  // Missing required fields
  try {
    await User.create({ name: "NoEmail" });
  } catch (err) {
    console.log("\n--- Missing required fields ---");
    const messages = Object.values(err.errors).map((e) => e.message);
    console.log("Errors:", messages);
  }

  // Invalid enum value
  try {
    await User.create({ name: "Test", email: "t@e.com", password: "12345678", role: "superadmin" });
  } catch (err) {
    console.log("\n--- Invalid enum ---");
    console.log("Error:", err.errors.role.message);
  }

  // Min/max violations
  try {
    await User.create({ name: "X", email: "x@e.com", password: "12345678", age: -5 });
  } catch (err) {
    console.log("\n--- Min/max violations ---");
    const messages = Object.values(err.errors).map((e) => e.message);
    console.log("Errors:", messages);
  }

  // Custom validator: discount > price
  try {
    await Product.create({ name: "Laptop", price: 100, discountPrice: 150 });
  } catch (err) {
    console.log("\n--- Custom validator ---");
    console.log("Error:", err.errors.discountPrice.message);
  }

  // ============================================
  // Handling Validation Errors Properly
  // ============================================

  try {
    await User.create({ name: "", email: "bad-email", password: "123", age: -1 });
  } catch (err) {
    if (err.name === "ValidationError") {
      console.log("\n--- Formatted errors ---");
      const errors = {};
      for (const field in err.errors) {
        errors[field] = err.errors[field].message;
      }
      console.log(errors);
      // { name: "Name must be at least 2 characters",
      //   email: "Please provide a valid email",
      //   password: "Password must be at least 8 characters",
      //   age: "Age cannot be negative" }
    }
  }

  // ============================================
  // Validation on Update
  // ============================================

  // By default, validators DON'T run on update operations!
  // You must explicitly enable them with { runValidators: true }

  try {
    await User.findByIdAndUpdate(
      validUser._id,
      { age: -10, role: "superadmin" },
      { runValidators: true } // ← MUST add this!
    );
  } catch (err) {
    console.log("\n--- Update validation ---");
    const messages = Object.values(err.errors).map((e) => e.message);
    console.log("Update errors:", messages);
  }

  // ============================================
  // Conditional Required
  // ============================================

  // Card payment: cardNumber required
  try {
    await Order.create({ product: "Laptop", paymentMethod: "card" });
  } catch (err) {
    console.log("\n--- Conditional required ---");
    console.log("Error:", err.errors.cardNumber.message);
  }

  // Cash payment: cardNumber NOT required (works fine)
  const cashOrder = await Order.create({ product: "Phone", paymentMethod: "cash" });
  console.log("Cash order:", cashOrder.product, cashOrder.paymentMethod);

  // Clean up
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
  await mongoose.disconnect();
}

demo();
