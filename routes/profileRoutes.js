// routes/index.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const User = require("../models/Users");
const Post = require("../models/Posts");
const Comment = require("../models/Comments");
const multer = require("multer");
const path = require('path');
const fs = require('fs');

// GET /user/profile
router.get("/profile", async (req, res) => {
  try {
    // Get stored user data from frontend
    let userData = null;

    // Render the profile page with any available user data
    res.render("profile", {
      user: userData,
      isAuthenticated: false,
    });
  } catch (err) {
    console.error("Profile route error:", err);
    res.status(500).redirect("/");
  }
});

// GET /user/posts-comments
router.get("/api/posts-comments", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user._id })
      .select("title content createdAt")
      .lean();
    const comments = await Comment.find({ user: req.user._id })
      .populate("post", "title")
      .select("content post createdAt")
      .lean();

    res.json({ posts, comments });
  } catch (err) {
    console.error("Error fetching posts/comments:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add an API endpoint for fetching user data
router.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Profile API error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/api/posts/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!post) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/api/comments/:id", authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!comment) {
      return res
        .status(404)
        .json({ error: "Comment not found or unauthorized" });
    }
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/api/posts/:id", authMiddleware, async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, user: req.user._id });
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
});

router.get("/api/comments/:id", authMiddleware, async (req, res) => {
  const comment = await Comment.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!comment) return res.status(404).json({ error: "Comment not found" });
  res.json(comment);
});

// Set up multer to store files in views/uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Set the destination to 'views/uploads' folder
      cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: function (req, file, cb) {
      // Set the filename as the original filename (you can also add a timestamp if needed)
      cb(null, file.originalname);
    }
  });

  // Initialize multer with storage configuration
const upload = multer({ storage: storage });


router.put(
  "/api/posts/:id",
  authMiddleware,
  upload.array("newImages"),
  async (req, res) => {
    try {
      const { title, content, categories } = req.body;
      const post = await Post.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { title, content, categories: JSON.parse(categories) },
        { new: true }
      );

      if (!post)
        return res
          .status(404)
          .json({ error: "Post not found or unauthorized" });

      if (req.files.length > 0) {
        const newImages = req.files.map((file) => `uploads/${file.filename}`);
        post.images.push(...newImages);
        await post.save();
      }

      res.json(post);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.put("/api/comments/:id", authMiddleware, async (req, res) => {
  const { content } = req.body;
  const comment = await Comment.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { content },
    { new: true }
  );
  if (!comment) return res.status(404).json({ error: "Comment not found" });
  res.json(comment);
});

router.delete('/api/posts/:id/images/:filename', authMiddleware, async (req, res) => {
    try {
        const { id, filename } = req.params;

        // Sanitize filename (remove curly braces if present)
        const sanitizedFilename = filename.replace(/[{}]/g, '');
        console.log('Sanitized Filename:', sanitizedFilename);

        // Find the post
        const post = await Post.findOne({ _id: id, user: req.user._id });
        if (!post) {
            return res.status(404).json({ error: 'Post not found or unauthorized' });
        }

        // Remove the image from the post's images array
        post.images = post.images.filter(image => image !== sanitizedFilename);
        await post.save();

        // Construct correct file path
        const filePath = `C:\\blogPost\\blog\\views\\uploads\\${sanitizedFilename}`;
        console.log('Deleting file at path:', filePath);

        // Delete the file
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return res.status(500).json({ error: 'Failed to delete file' });
            }

            // Send response after successful deletion
            res.status(200).json({ message: 'Image deleted successfully' });
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
