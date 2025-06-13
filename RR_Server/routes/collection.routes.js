// server/routes/collection.routes.js
const express = require('express');
const router = express.Router();
const { getUserCollection, addCollectionItem } = require('../controllers/collection.controller');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/collections
// @desc    Get all items in the authenticated user's collection
// @access  Private
router.get('/', protect, getUserCollection);

// @route   POST /api/collections
// @desc    Add an item to the authenticated user's collection
// @access  Private
router.post('/', protect, addCollectionItem);

module.exports = router;
