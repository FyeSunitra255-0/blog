const Post = require("../models/Posts");
const Category = require("../models/Categories");

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // บันทึกไฟล์ลงในโฟลเดอร์ 'uploads' ที่อยู่ใน root directory
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Create a post
exports.createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    let categories = [];

    // Parse categories
    try {
      categories = JSON.parse(req.body.categories);
    } catch (e) {
      console.error("Error parsing categories:", e);
    }

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: "กรุณากรอกหัวข้อและเนื้อหา",
      });
    }

    // Check user authentication
    if (!req.user || !req.user._id) {
      // Use req.user._id instead of req.user.id
      return res.status(401).json({
        success: false,
        error: "กรุณาเข้าสู่ระบบ",
      });
    }

    // Handle images
    const images = req.files ? req.files.map((file) => 'uploads/' + file.filename) : [];
    // Create the post
    const post = new Post({
      title,
      content,
      categories,
      images,
      user: req.user._id, // Reference _id of the user
    });

    await post.save();

    res.status(201).json({
      success: true,
      message: "สร้างกระทู้สำเร็จ",
      post,
    });
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างกระทู้",
    });
  }
};

// Get all posts
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate(
      "categories user",
      "name username"
    );
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Error fetching posts" });
  }
};

exports.getPostDetail = async (req, res) => {
  try {
    const postId = req.params.id;

    // ดึงข้อมูลโพสต์พร้อม populate ข้อมูลที่เกี่ยวข้อง
    const post = await Post.findById(postId)
      .populate("user", "username avatar") // เพิ่ม avatar ถ้ามี
      .populate("categories", "name")
      .lean(); // ใช้ lean() เพื่อประสิทธิภาพที่ดีขึ้น

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "ไม่พบกระทู้ที่ต้องการ",
      });
    }

    // ดึงความคิดเห็นพร้อม replies
    const comments = await Comment.find({ post: postId })
      .populate("user", "username avatar")
      .populate({
        path: "replies.user",
        select: "username avatar",
      })
      .sort({ createdAt: -1 }) // เรียงความคิดเห็นล่าสุดก่อน
      .lean();

    const categories = await Category.find().lean();

    // เพิ่มข้อมูล timestamp ที่อ่านง่าย
    const formattedPost = {
      ...post,
      images: post.images || [], // Make sure images are included
      createdAt: post.createdAt.toLocaleString("th-TH"),
      updatedAt: post.updatedAt.toLocaleString("th-TH"),
    };

    // Format timestamps สำหรับ comments และ replies
    const formattedComments = comments.map((comment) => ({
      ...comment,
      createdAt: new Date(comment.createdAt).toLocaleString("th-TH"),
      replies: comment.replies.map((reply) => ({
        ...reply,
        createdAt: new Date(reply.createdAt).toLocaleString("th-TH"),
      })),
      categories: categories,
    }));

    // ส่งข้อมูลกลับ
    res.json({
      success: true,
      data: {
        post: formattedPost,
        comments: formattedComments,
        totalComments:
          comments.length +
          comments.reduce((acc, comment) => acc + comment.replies.length, 0),
      },
    });
  } catch (err) {
    console.error("Error fetching post detail:", err);
    res.status(500).json({
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลกระทู้",
    });
  }
};

exports.uploadImages = upload.array("images");
