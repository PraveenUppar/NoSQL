// References and Populate — Linking Collections
// Run: node 12-references-and-populate.js

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/learning_mongodb");

// ============================================
// Embedding vs Referencing
// ============================================

// EMBEDDING: Store related data INSIDE the document
// { name: "Praveen", address: { city: "Delhi", zip: "110001" } }
// Good for: small, rarely-changing data always accessed together

// REFERENCING: Store just the ID, look up the data separately
// { name: "Praveen", department: ObjectId("64abc...") }
// Good for: large data, shared data, frequently updated data

// ============================================
// Setting Up Related Models
// ============================================

// Author model
const authorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  bio: String,
});

// Enable virtual populate (get posts from author)
authorSchema.virtual("posts", {
  ref: "Post",
  localField: "_id",
  foreignField: "author",
});
authorSchema.set("toJSON", { virtuals: true });
authorSchema.set("toObject", { virtuals: true });

// Post model — references Author
const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Author", // Reference to Author model
    required: true,
  },
  category: String,
  // Embedded comments (small, bounded data)
  comments: [
    {
      user: String,
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const Author = mongoose.model("Author", authorSchema);
const Post = mongoose.model("Post", postSchema);

async function demo() {
  await Author.deleteMany({});
  await Post.deleteMany({});

  // ============================================
  // Create Authors and Posts
  // ============================================

  const praveen = await Author.create({ name: "Praveen", email: "praveen@email.com", bio: "Full-stack developer" });
  const jane = await Author.create({ name: "Jane", email: "jane@email.com", bio: "Tech writer" });

  const posts = await Post.create([
    { title: "Learning MongoDB", content: "MongoDB is a NoSQL database...", author: praveen._id, category: "tech" },
    { title: "Express.js Tips", content: "Here are some tips...", author: praveen._id, category: "tech" },
    { title: "My Travel Blog", content: "I visited Paris...", author: jane._id, category: "travel" },
    { title: "CSS Grid Guide", content: "CSS Grid makes layouts easy...", author: jane._id, category: "tech" },
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

  const postPopulated = await Post.findOne({ title: "Learning MongoDB" }).populate("author");
  console.log("\nWith populate:");
  console.log("  author:", postPopulated.author);
  // { _id: "64abc...", name: "Praveen", email: "praveen@email.com", bio: "..." }

  // ============================================
  // Populate Specific Fields
  // ============================================

  const postSelectFields = await Post.findOne({ title: "Express.js Tips" }).populate("author", "name email");
  console.log("\nPopulate name+email only:");
  console.log("  author:", postSelectFields.author);
  // { _id: "...", name: "Praveen", email: "praveen@email.com" }

  // Exclude fields with -
  // .populate('author', '-bio -__v')   → All fields EXCEPT bio and __v

  // ============================================
  // Populate All Posts
  // ============================================

  const allPosts = await Post.find().populate("author", "name").sort("-createdAt");
  console.log("\nAll posts with author names:");
  allPosts.forEach((p) => console.log(`  "${p.title}" by ${p.author.name}`));

  // ============================================
  // Virtual Populate — Reverse Lookup
  // ============================================

  // Get an author WITH their posts (without storing post IDs on author)
  const authorWithPosts = await Author.findById(praveen._id).populate("posts");
  console.log("\nVirtual populate — Author with posts:");
  console.log(`  ${authorWithPosts.name} has ${authorWithPosts.posts.length} posts:`);
  authorWithPosts.posts.forEach((p) => console.log(`    - ${p.title}`));

  // Virtual populate with field selection
  const authorPostTitles = await Author.findById(jane._id).populate({
    path: "posts",
    select: "title category",
  });
  console.log(`\n  ${authorPostTitles.name}'s posts:`);
  authorPostTitles.posts.forEach((p) => console.log(`    - ${p.title} [${p.category}]`));

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

  // ============================================
  // Embedding — Comments inside Post
  // ============================================

  // Add comments (embedded, not referenced)
  const post = await Post.findOne({ title: "Learning MongoDB" });
  post.comments.push({ user: "Mike", text: "Great article!" });
  post.comments.push({ user: "Sara", text: "Very helpful, thanks!" });
  await post.save();

  console.log("\nEmbedded comments:");
  post.comments.forEach((c) => console.log(`  ${c.user}: "${c.text}"`));

  // ============================================
  // Multi-level Populate (nested)
  // ============================================

  // If comments also had a 'user' reference:
  // Post.find().populate('author').populate('comments.user')

  // ============================================
  // When to Embed vs Reference
  // ============================================

  // EMBED when:
  // ✅ Data is small and bounded (e.g., max 10 comments)
  // ✅ Data is always accessed together with parent
  // ✅ Data doesn't change often
  // ✅ 1-to-few relationship

  // REFERENCE when:
  // ✅ Data is large or unbounded (e.g., thousands of posts)
  // ✅ Data is shared across documents (e.g., author used by many posts)
  // ✅ Data changes frequently
  // ✅ 1-to-many or many-to-many relationship
  // ✅ You need to query the related data independently

  // Clean up
  await Author.deleteMany({});
  await Post.deleteMany({});
  await mongoose.disconnect();
}

demo();
