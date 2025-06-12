const express = require('express');
const router = express.Router();
const { getUserProfile, getPublicUserProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/authMiddleware'); // For protected routes

// @route   GET /api/users/profile
// @desc    Get user profile (authenticated user)
// @access  Private
router.get('/profile', protect, getUserProfile);

// @route   GET /api/users/:userId
// @desc    Get public user profile by ID
// @access  Public
router.get('/:userId', getPublicUserProfile);

module.exports = router;
