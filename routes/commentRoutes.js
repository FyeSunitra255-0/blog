const express = require('express');
const router = express.Router();
const { getComments, replyToComment } = require('../controllers/commentController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Route to reply to a comment
//router.post("/posts/:postId/comments/:commentId/reply", authMiddleware, replyToComment);

router.post('/:id/reply', authMiddleware, replyToComment);

router.get("/post/:postId/comments", getComments);

module.exports = router;
