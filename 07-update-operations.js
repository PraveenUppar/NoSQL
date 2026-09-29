// Update Operations — Modifying Documents
// Run: node 07-update-operations.js

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  age: Number,
  role: { type: String, default: "user" },
  score: { type: Number, default: 0 },
  hobbies: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

async function demo() {
  await User.deleteMany({});

  // Seed data
  const users = await User.create([
    { name: "Praveen", email: "praveen@email.com", age: 22, role: "admin", score: 85, hobbies: ["coding", "reading"] },
    { name: "Jane", email: "jane@email.com", age: 25, score: 72, hobbies: ["painting"] },
    { name: "Mike", email: "mike@email.com", age: 30, score: 90, hobbies: ["gaming", "coding"] },
    { name: "Sara", email: "sara@email.com", age: 21, score: 65, hobbies: ["yoga"] },
  ]);

  // ============================================
  // findByIdAndUpdate() — Update by _id (returns the document)
  // ============================================

  // By default, returns the OLD document (before update)
  const oldDoc = await User.findByIdAndUpdate(users[0]._id, { age: 23 });
  console.log("Old doc age:", oldDoc.age); // 22 (old value)

  // Use { new: true } to return the UPDATED document
  const newDoc = await User.findByIdAndUpdate(
    users[0]._id,
    { age: 24 },
    { new: true } // Return updated document
  );
  console.log("New doc age:", newDoc.age); // 24 (new value)

  // With runValidators: true (enforce schema validation on update)
  const validated = await User.findByIdAndUpdate(
    users[1]._id,
    { name: "Jane Updated" },
    { new: true, runValidators: true }
  );
  console.log("Validated update:", validated.name);

  // ============================================
  // findOneAndUpdate() — Update first matching document
  // ============================================

  const updated = await User.findOneAndUpdate(
    { email: "mike@email.com" }, // Filter
    { score: 95 }, // Update
    { new: true }
  );
  console.log("findOneAndUpdate:", updated.name, updated.score);

  // ============================================
  // updateOne() — Update one document (doesn't return the doc)
  // ============================================

  const result1 = await User.updateOne(
    { name: "Sara" },
    { score: 70 }
  );
  console.log("updateOne:", result1);
  // { acknowledged: true, modifiedCount: 1, matchedCount: 1 }

  // ============================================
  // updateMany() — Update multiple documents
  // ============================================

  const result2 = await User.updateMany(
    { role: "user" }, // All users with role "user"
    { isActive: true }
  );
  console.log("updateMany:", result2.modifiedCount, "documents updated");

  // ============================================
  // Update Operators
  // ============================================

  // $set — Set specific fields (default behavior)
  await User.findByIdAndUpdate(users[0]._id, {
    $set: { name: "Praveen Updated", age: 25 },
  });

  // $unset — Remove a field from the document
  await User.findByIdAndUpdate(users[0]._id, {
    $unset: { score: "" }, // Removes the score field entirely
  });

  // $inc — Increment a number field
  await User.findByIdAndUpdate(users[1]._id, {
    $inc: { score: 5 }, // score = score + 5
  });
  await User.findByIdAndUpdate(users[1]._id, {
    $inc: { score: -3 }, // score = score - 3 (decrement)
  });
  const incUser = await User.findById(users[1]._id).select("name score");
  console.log("After $inc:", incUser.name, incUser.score); // 72 + 5 - 3 = 74

  // $push — Add an element to an array
  await User.findByIdAndUpdate(users[0]._id, {
    $push: { hobbies: "gaming" }, // Add "gaming" to hobbies
  });

  // $push multiple values at once
  await User.findByIdAndUpdate(users[0]._id, {
    $push: { hobbies: { $each: ["music", "travel"] } },
  });
  const pushed = await User.findById(users[0]._id).select("name hobbies");
  console.log("After $push:", pushed.hobbies);

  // $pull — Remove an element from an array
  await User.findByIdAndUpdate(users[0]._id, {
    $pull: { hobbies: "gaming" }, // Remove "gaming"
  });
  const pulled = await User.findById(users[0]._id).select("name hobbies");
  console.log("After $pull:", pulled.hobbies);

  // $addToSet — Add to array ONLY if it doesn't already exist (no duplicates)
  await User.findByIdAndUpdate(users[0]._id, {
    $addToSet: { hobbies: "coding" }, // Already exists — won't add duplicate
  });
  await User.findByIdAndUpdate(users[0]._id, {
    $addToSet: { hobbies: "swimming" }, // New — will be added
  });
  const addToSet = await User.findById(users[0]._id).select("hobbies");
  console.log("After $addToSet:", addToSet.hobbies);

  // ============================================
  // Options
  // ============================================

  // { new: true }           → Return updated document (default: old document)
  // { runValidators: true } → Run schema validators on update
  // { upsert: true }        → Create the document if it doesn't exist

  // Upsert example: update if found, create if not
  const upserted = await User.findOneAndUpdate(
    { email: "new@email.com" }, // No user with this email
    { name: "New User", email: "new@email.com", age: 20 },
    { new: true, upsert: true } // Create it!
  );
  console.log("Upserted:", upserted.name, "(created:", upserted.isNew === undefined, ")");

  // ============================================
  // Update via .save() (on a Mongoose document)
  // ============================================

  const user = await User.findById(users[2]._id);
  user.name = "Mike Updated";
  user.score = 100;
  await user.save(); // Triggers validation and middleware hooks
  console.log("Save update:", user.name, user.score);

  // .save() vs findByIdAndUpdate():
  // .save()             → triggers pre/post save hooks, full validation
  // findByIdAndUpdate() → does NOT trigger save hooks by default, faster

  // Clean up
  await User.deleteMany({});
  await mongoose.disconnect();
}

demo();
