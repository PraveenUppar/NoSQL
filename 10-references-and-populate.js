// References and Populate — Linking Collections
// Run: node 12-references-and-populate.js

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

async function demo() {
  await Author.deleteMany({});
  await Post.deleteMany({});

  // ============================================
  // Create Authors and Posts
  // ============================================

  const praveen = await Author.create({
    name: "Praveen",
    email: "praveen@email.com",
    bio: "Full-stack developer",
  });
  const jane = await Author.create({
    name: "Jane",
    email: "jane@email.com",
    bio: "Tech writer",
  });

  const posts = await Post.create([
    {
      title: "Learning MongoDB",
      content: "MongoDB is a NoSQL database...",
      author: praveen._id,
      category: "tech",
    },
    {
      title: "Express.js Tips",
      content: "Here are some tips...",
      author: praveen._id,
      category: "tech",
    },
    {
      title: "My Travel Blog",
      content: "I visited Paris...",
      author: jane._id,
      category: "travel",
    },
    {
      title: "CSS Grid Guide",
      content: "CSS Grid makes layouts easy...",
      author: jane._id,
      category: "tech",
    },
  ]);

  // ============================================
  // Without Populate — Just ObjectId
  // ============================================

  const postRaw = await Post.findOne({ title: "Learning MongoDB" });
  console.log("Without populate:");
  console.log("  author:", postRaw.author); // ObjectId("64abc...")
  // Just the ID — not useful to display!

  // ============================================
  // With Populate — Full Author Data
  // ============================================

  const postPopulated = await Post.findOne({
    title: "Learning MongoDB",
  }).populate("author");
  console.log("\nWith populate:");
  console.log("  author:", postPopulated.author);
  // { _id: "64abc...", name: "Praveen", email: "praveen@email.com", bio: "..." }

  // ============================================
  // Populate Specific Fields
  // ============================================

  const postSelectFields = await Post.findOne({
    title: "Express.js Tips",
  }).populate("author", "name email");
  console.log("\nPopulate name+email only:");
  console.log("  author:", postSelectFields.author);
  // { _id: "...", name: "Praveen", email: "praveen@email.com" }

  // Exclude fields with -
  // .populate('author', '-bio -__v')   → All fields EXCEPT bio and __v

  // ============================================
  // Populate All Posts
  // ============================================

  const allPosts = await Post.find()
    .populate("author", "name")
    .sort("-createdAt");
  console.log("\nAll posts with author names:");
  allPosts.forEach((p) => console.log(`  "${p.title}" by ${p.author.name}`));

  // ============================================
  // Populate with Filter/Sort/Limit
  // ============================================

  const authorTechPosts = await Author.findById(praveen._id).populate({
    path: "posts",
    match: { category: "tech" }, // Only tech posts
    select: "title",
    options: { sort: { createdAt: -1 }, limit: 5 },
  });
  console.log("\nFiltered populate (tech only):");
  authorTechPosts.posts.forEach((p) => console.log(`  - ${p.title}`));
}

demo();
