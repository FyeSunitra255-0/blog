const express = require("express");
const {
    createPost,
    getPosts,
    getPostDetail,
} = require("../controllers/postController");
const {
    addComment,
    createReply,
    getComments,
    getNestedComments,
} = require("../controllers/commentController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const router = express.Router();
const multer = require("multer");
const path = require("path");


// ตั้งค่า multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '..', 'uploads')); // โฟลเดอร์ที่จะเก็บไฟล์
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname)); // สร้างชื่อไฟล์ที่ไม่ซ้ำ
    },
  });
  
  const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      // รับเฉพาะไฟล์ภาพ
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('ไฟล์ที่อัปโหลดต้องเป็นรูปภาพเท่านั้น'), false);
      }
    },
    limits: {
      files: 10, // จำกัดการอัปโหลดไฟล์ไม่เกิน 10 ไฟล์
    },
  });

// Routes
router.post("/", authMiddleware, upload.array("images", 10), createPost);
router.get("/", getPosts);

// Route สำหรับดึงข้อมูลกระทู้
router.get("/:id", getPostDetail);

// Route สำหรับดึงข้อมูลกระทู้เฉพาะผู้ที่ login แล้ว
router.get("api/post/:id/auth", authMiddleware, getPostDetail);

router.post("/:postId/comments", authMiddleware, addComment);

router.get("/post/:id/comments", async (req, res) => {
    const { id: postId } = req.params;
    const comments = await getComments(postId);
    res.json(comments);
});


// router.get("/post/:postId", async (req, res) => {
//     const postId = req.params.postId;

//     try {
//         // Find comments for the post and populate the user and replies recursively
//         const comments = await Comment.find({ post: postId, parent: null })
//             .populate("user", "username")
//             .populate({
//                 path: "replies",
//                 populate: {
//                     path: "user",
//                     select: "username",
//                 },
//             });

//         res.render("post-detail", {
//             post: post, // You should fetch this as per your logic
//             categories: categories, // Similarly for categories
//             comments: comments, // Pass the comments to EJS
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("Error fetching comments");
//     }
// });

// การส่งข้อมูลการตอบกลับ
router.post('/:postId/reply/comments', authMiddleware, createReply);


module.exports = router;
