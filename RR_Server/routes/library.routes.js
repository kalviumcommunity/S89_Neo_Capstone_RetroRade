// server/routes/library.routes.js
const express = require('express');
const router = express.Router();
const { getGuides, getGuideBySlug, createGuide } = require('../controllers/library.controller');
const { protect } = require('../middleware/authMiddleware'); // For protected routes
const { createGuideValidation } = require('../utils/validation'); // Import new validation
const { validationResult } = require('express-validator'); // Import for use in custom middleware

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
// @access  Private (Requires authentication)
router.post('/guides', protect, createGuideValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({ [err.param]: err.msg }))
    });
  }
  next(); // If validation passes, proceed to controller
}, createGuide);

module.exports = router;
