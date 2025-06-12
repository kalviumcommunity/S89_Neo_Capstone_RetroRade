const express = require('express');
const router = express.Router();
const { getGuides, getGuideBySlug } = require('../controllers/library.controller');

// @route   GET /api/library/guides
// @desc    Get all library guides (with optional filtering)
// @access  Public
router.get('/guides', getGuides);

// @route   GET /api/library/guides/:slug
// @desc    Get a single library guide by slug
// @access  Public
router.get('/guides/:slug', getGuideBySlug);

module.exports = router;
