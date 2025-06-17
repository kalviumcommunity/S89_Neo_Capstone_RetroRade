// server/routes/library.routes.js
const express = require('express');
const router = express.Router();
const { getGuides, getGuideBySlug, createGuide, updateGuide, deleteGuide } = require('../controllers/library.controller');
const { protect } = require('../middleware/authMiddleware');
const { createGuideValidation } = require('../utils/validation'); // Import new validation
const { validationResult } = require('express-validator');

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
  next();
}, createGuide);

// @route   PUT /api/library/guides/:slug
// @desc    Update a library guide by slug
// @access  Private (Owner or Admin)
// Re-using createGuideValidation is an option here, or create a specific updateGuideValidation
router.put('/guides/:slug', protect, createGuideValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({ [err.param]: err.msg }))
    });
  }
  next();
}, updateGuide);

// @route   DELETE /api/library/guides/:slug
// @desc    Delete a library guide by slug
// @access  Private (Owner or Admin)
router.delete('/guides/:slug', protect, deleteGuide);

module.exports = router;
