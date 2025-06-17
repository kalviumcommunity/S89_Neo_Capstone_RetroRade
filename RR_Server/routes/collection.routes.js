// server/routes/collection.routes.js
const express = require('express');
const router = express.Router();
const { getUserCollection, addCollectionItem, removeCollectionItem } = require('../controllers/collection.controller');
const { protect } = require('../middleware/authMiddleware');

// GET/POST routes (unchanged)
router.get('/', protect, getUserCollection);
router.post('/', protect, addCollectionItem);

// @route   DELETE /api/collections/:collectionItemId
// @desc    Remove an item from the authenticated user's collection
// @access  Private
router.delete('/:collectionItemId', protect, removeCollectionItem);

module.exports = router;
