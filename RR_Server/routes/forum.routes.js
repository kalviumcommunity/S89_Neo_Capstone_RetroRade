// server/routes/forum.routes.js
const express = require('express');
const router = express.Router();
const { getForumPosts, getForumPostById, getForumPostsByUser, createForumPost, addReplyToPost } = require('../controllers/forum.controller');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/forum/posts
// @desc    Get all forum posts (with optional filtering)
// @access  Public
router.get('/posts', getForumPosts);

// @route   GET /api/forum/posts/:postId
// @desc    Get a single forum post with its replies
// @access  Public
router.get('/posts/:postId', getForumPostById);

// @route   GET /api/forum/users/:userId/posts
// @desc    Get all forum posts by a specific user
// @access  Public
router.get('/users/:userId/posts', getForumPostsByUser);

// @route   POST /api/forum/posts
// @desc    Create a new forum post
// @access  Private
router.post('/posts', protect, createForumPost);

// @route   POST /api/forum/posts/:postId/replies
// @desc    Add a reply to a forum post
// @access  Private
router.post('/posts/:postId/replies', protect, addReplyToPost);

module.exports = router;
