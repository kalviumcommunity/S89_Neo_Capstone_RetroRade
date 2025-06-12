const express = require('express');
const router = express.Router();
const { getForumPosts, getForumPostById, getForumPostsByUser } = require('../controllers/forum.controller');

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

module.exports = router;
