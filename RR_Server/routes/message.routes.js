const express = require('express');
const router = express.Router();
const { getConversations, getMessagesInConversation } = require('../controllers/message.controller');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/messages/conversations
// @desc    Get all conversations for the authenticated user
// @access  Private
router.get('/conversations', protect, getConversations);

// @route   GET /api/messages/conversations/:conversationId
// @desc    Get all messages within a specific conversation
// @access  Private
router.get('/conversations/:conversationId', protect, getMessagesInConversation);

module.exports = router;
