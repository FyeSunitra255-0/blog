const Post = require('../models/Posts');
const Comment = require('../models/Comments');
const User = require('../models/Users');

exports.getProfile = async (req, res) => {
  try {
      // Check user authentication
      if (!req.user || !req.user._id) {
          return res.status(401).json({ 
              success: false, 
              error: 'Unauthorized access' 
          });
      }

      const user = await User.findById(req.user._id)
          .select('username email'); // Add any other fields you want to display
      
      if (!user) {
          return res.status(404).json({
              success: false,
              error: 'User not found'
          });
      }

      // If the request accepts HTML, render the profile page
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
          return res.render('profile', { user });
      }

      // Otherwise return JSON
      return res.json({
          success: true,
          user
      });

  } catch (err) {
      console.error('Profile Error:', err);
      res.status(500).json({ 
          success: false, 
          error: 'Error fetching profile' 
      });
  }
};


// exports.editPost = async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const { title, content } = req.body;
    
//     const post = await Post.findById(postId);
//     if (!post || post.user.toString() !== req.user._id.toString()) {
//       return res.status(403).send('Forbidden');
//     }

//     post.title = title;
//     post.content = content;
//     await post.save();

//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error editing post');
//   }
// };

// exports.deletePost = async (req, res) => {
//   try {
//     const { postId } = req.params;
    
//     const post = await Post.findById(postId);
//     if (!post || post.user.toString() !== req.user._id.toString()) {
//       return res.status(403).send('Forbidden');
//     }

//     await post.remove();
//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error deleting post');
//   }
// };

// exports.editComment = async (req, res) => {
//   try {
//     const { commentId } = req.params;
//     const { content } = req.body;

//     const comment = await Comment.findById(commentId);
//     if (!comment || comment.user.toString() !== req.user._id.toString()) {
//       return res.status(403).send('Forbidden');
//     }

//     comment.content = content;
//     await comment.save();

//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error editing comment');
//   }
// };

// exports.deleteComment = async (req, res) => {
//   try {
//     const { commentId } = req.params;

//     const comment = await Comment.findById(commentId);
//     if (!comment || comment.user.toString() !== req.user._id.toString()) {
//       return res.status(403).send('Forbidden');
//     }

//     await comment.remove();
//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error deleting comment');
//   }
// };