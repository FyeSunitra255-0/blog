require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/db');
const cors = require("cors");

const Post = require("./models/Posts"); // Post model
const User = require("./models/Users"); // User model
const Category = require("./models/Categories"); // Category model
const Comment = require("./models/Comments");


// Import Routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const profileRoutes = require('./routes/profileRoutes.js');
const commentRoutes = require('./routes/commentRoutes');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// เชื่อมต่อ MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use("/user", profileRoutes);
app.use('/api/comments', commentRoutes);


app.get("/", async (req, res) => {
  try {
    const user = req.user || null; // ตรวจสอบ user ถ้าไม่มีให้เป็น null
    const { category } = req.query; // ดึงหมวดหมู่จาก query parameter

    // ค้นหาบล็อกตามหมวดหมู่ ถ้าไม่มีการเลือกหมวดหมู่ ให้ดึงทั้งหมด
    const query = category ? { categories: category } : {}; // ถ้ามี category ให้กรองตาม category

    // ดึงข้อมูลโพสต์ที่ได้รับความนิยม
    const popularBlogs = await Post.find()
      .populate("user", "username")
      .sort({ createdAt: -1 })
      .limit(6);


    // ดึงข้อมูล categories
    const categories = await Category.find();

    // ดึงคอมเมนต์สำหรับแต่ละโพสต์
    const popularBlogsWithComments = await Promise.all(popularBlogs.map(async (post) => {
      const comments = await Comment.find({ post: post._id }).populate("user", "username");
      return {
        ...post.toObject(),
        comments,
        commentCount: comments.length,
      };
    }));


    // จัดเรียงบล็อกยอดนิยมตามจำนวนคอมเมนต์
    popularBlogsWithComments.sort((a, b) => b.commentCount - a.commentCount);

    // ส่งข้อมูลกลับไปยัง template
    res.render("index", { 
      popularBlogs: popularBlogsWithComments, 
      categories, 
      user,
      selectedCategory: category || ""
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while loading the homepage.");
  }
});

app.get("/blogs", async (req, res) => {
  try {
    const user = req.user || null; // ตรวจสอบ user ถ้าไม่มีให้เป็น null
    const { category } = req.query; // ดึงหมวดหมู่จาก query parameter

    // ค้นหาบล็อกตามหมวดหมู่ ถ้าไม่มีการเลือกหมวดหมู่ ให้ดึงทั้งหมด
    const query = category ? { categories: category } : {}; // ถ้ามี category ให้กรองตาม category

    const popularBlogs = await Post.find(query)
      .populate("user", "username")
      .sort({ createdAt: -1 });

    const categories = await Category.find();

    // ดึงคอมเมนต์สำหรับแต่ละโพสต์
    const popularBlogsWithComments = await Promise.all(popularBlogs.map(async (post) => {
      const comments = await Comment.find({ post: post._id }).populate("user", "username");
      return {
        ...post.toObject(),
        comments,
        commentCount: comments.length,
      };
    }));

    // จัดเรียงบล็อกยอดนิยมตามจำนวนคอมเมนต์
    popularBlogsWithComments.sort((a, b) => b.commentCount - a.commentCount);

    // ส่งข้อมูลกลับไปยัง template
    res.render("all-blogs", { 
      popularBlogs: popularBlogsWithComments, 
      categories, 
      user,
      selectedCategory: category || "" // ส่งค่า category ที่เลือกไปด้วย
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์",
    });
  }
});


app.get('/post/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId).populate("user", "username").populate("categories", "name");
    
    if (!post) {
      return res.status(404).send("โพสต์นี้ไม่พบ");
    }
    
    const comments = await Comment.find({ post: postId }).populate("user", "username");
    const categories = post.categories; // ดึง categories จากโพสต์

    res.render('post-detail', { post, comments, categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์");
  }
});

// // API สำหรับตอบกลับคอมเมนต์
// app.post('/api/comments/:id/reply', authMiddleware, async (req, res) => {
//   try {
//       const { content } = req.body;
//       const { id } = req.params;

//       const parentComment = await Comment.findById(id);
//       if (!parentComment) {
//           return res.status(404).json({ message: 'Parent comment not found' });
//       }

//       const reply = new Comment({
//           content,
//           user: req.user._id, // User ที่ตอบกลับ
//           post: parentComment.post,
//           parent: parentComment._id,
//       });

//       await reply.save();
//       parentComment.replies.push(reply._id);
//       await parentComment.save();

//       res.status(201).json(reply);
//   } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: 'Failed to reply' });
//   }
// });


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
