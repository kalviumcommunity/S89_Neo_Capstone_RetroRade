// server/routes/user.routes.js
const express = require('express');
const router = express.Router();
const { getUserProfile, getPublicUserProfile, updateUserProfile, deleteUserAccount } = require('../controllers/user.controller');
const { protect } = require('../middleware/authMiddleware');
const { registerValidation, loginValidation } = require('../utils/validation'); // Import validation utils (for password changes)
const { validationResult } = require('express-validator');

// @route   GET /api/users/profile
// @desc    Get user profile (authenticated user)
// @access  Private
router.get('/profile', protect, getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile (authenticated user)
// @access  Private
// Add validation for update fields if needed (e.g., username, email, optional password)
router.put('/profile', protect, /* Optional: add updateProfileValidation, */ updateUserProfile);

// @route   DELETE /api/users/profile
// @desc    Delete user account (authenticated user)
// @access  Private
router.delete('/profile', protect, deleteUserAccount);

// @route   GET /api/users/:userId
// @desc    Get public user profile by ID
// @access  Public
router.get('/:userId', getPublicUserProfile);

module.exports = router;
