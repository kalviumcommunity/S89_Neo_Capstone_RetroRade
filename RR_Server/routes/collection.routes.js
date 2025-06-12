const express = require('express');
const router = express.Router();
const { getUserCollection } = require('../controllers/collection.controller');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/collections
// @desc    Get all items in the authenticated user's collection
// @access  Private
router.get('/', protect, getUserCollection);

module.exports = router;
