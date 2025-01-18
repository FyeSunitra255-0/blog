const Comment = require("../models/Comments");
const Post = require("../models/Posts");

exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    //console.log('User from middleware:', req.user); // เพิ่ม log

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const newComment = new Comment({
      content,
      post: postId,
      user: req.user._id, // ใช้ _id จาก middleware
      parent: null,
    });

    await newComment.save();

    // Populate user information
    const populatedComment = await Comment.findById(newComment._id).populate(
      "user",
      "username"
    );

    res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message,
    });
  }
};

exports.createReply = async (req, res) => {
  const { content, postId, parentId } = req.body;
  const userId = req.user._id; // Assuming you have a way to get the current user's ID

  try {
    const newComment = new Comment({
      content,
      user: userId,
      post: postId,
      parent: parentId, // Set the parent as the replied comment
    });

    await newComment.save();

    // Populate the new comment with user details
    const populatedComment = await Comment.findById(newComment._id).populate(
      "user",
      "username"
    );

    res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error replying to comment" });
  }
};

exports.replyToComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { id } = req.params;

    // ค้นหาคอมเมนต์หลัก (parent comment)
    const parentComment = await Comment.findById(id).populate({
      path: "replies", // Populate existing replies
      populate: { path: "user", select: "username" }, // Populate the user for each reply
    });

    if (!parentComment) {
      return res.status(404).json({ message: "Parent comment not found" });
    }

    // สร้างคอมเมนต์ตอบกลับ
    const reply = new Comment({
      content,
      user: req.user._id, // User ที่ตอบกลับ
      post: parentComment.post,
      parent: parentComment._id,
    });

    // Save the reply
    await reply.save();

    // Push the new reply to the parent comment's replies array
    parentComment.replies.push(reply._id);
    await parentComment.save();

    // Re-populate the new reply with user data
    const populatedReply = await Comment.findById(reply._id).populate({
      path: "user",
      select: "username",
    });

    // Return the newly created reply with the populated user data
    res.status(201).json(populatedReply);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reply" });
  }
};


exports.getComments = async (req, res) => {
  try {
    // Fetch all comments for a specific post and populate replies with user data
    const comments = await Comment.find({ post: req.params.postId })
      .populate({
        path: "user",
        select: "username",
      })
      .populate({
        path: "replies", // Populate the replies of each comment
        populate: {
          path: "user",
          select: "username", // Populate the user of each reply
        },
      });

    res.status(200).json(comments); // Return all comments with their replies
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get comments" });
  }
};
