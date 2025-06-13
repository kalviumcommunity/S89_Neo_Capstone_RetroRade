// server/routes/library.routes.js
const express = require('express');
const router = express.Router();
const { getGuides, getGuideBySlug, createGuide } = require('../controllers/library.controller');
const { protect } = require('../middleware/authMiddleware'); // For protected routes

// @route   GET /api/library/guides
// @desc    Get all library guides (with optional filtering)
// @access  Public
router.get('/guides', getGuides);

// @route   GET /api/library/guides/:slug
// @desc    Get a single library guide by slug
// @access  Public
router.get('/guides/:slug', getGuideBySlug);

// @route   POST /api/library/guides
// @desc    Create a new library guide
// @access  Private (Requires authentication) - Consider adding adminMiddleware if only admins can create
router.post('/guides', protect, createGuide);

module.exports = router;
