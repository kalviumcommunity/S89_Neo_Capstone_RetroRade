// server/routes/forum.routes.js
const express = require('express');
const router = express.Router();
const {
  getForumPosts,
  getForumPostById,
  getForumPostsByUser,
  createForumPost,
  updateForumPost,
  deleteForumPost,
  addReplyToPost,
  updateForumReply,
  deleteForumReply
} = require('../controllers/forum.controller');
const { protect } = require('../middleware/authMiddleware');
// You might want to add specific validation for forum posts/replies here too
// e.g., const { createForumPostValidation, updateForumPostValidation, addReplyValidation } = require('../utils/validation');
// and use validationResult from express-validator

// GET routes (unchanged)
router.get('/posts', getForumPosts);
router.get('/posts/:postId', getForumPostById);
router.get('/users/:userId/posts', getForumPostsByUser);

// POST routes (unchanged)
router.post('/posts', protect, createForumPost); // Add validation here if needed
router.post('/posts/:postId/replies', protect, addReplyToPost); // Add validation here if needed

// @route   PUT /api/forum/posts/:postId
// @desc    Update a forum post by ID
// @access  Private (Owner or Admin)
router.put('/posts/:postId', protect, updateForumPost); // Add validation here if needed

// @route   DELETE /api/forum/posts/:postId
// @desc    Delete a forum post by ID
// @access  Private (Owner or Admin)
router.delete('/posts/:postId', protect, deleteForumPost);

// @route   PUT /api/forum/replies/:replyId
// @desc    Update a forum reply by ID
// @access  Private (Owner or Admin)
router.put('/replies/:replyId', protect, updateForumReply); // Add validation here if needed

// @route   DELETE /api/forum/replies/:replyId
// @desc    Delete a forum reply by ID
// @access  Private (Owner or Admin)
router.delete('/replies/:replyId', protect, deleteForumReply);

module.exports = router;
