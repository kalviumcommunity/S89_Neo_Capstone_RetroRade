// server/routes/message.routes.js
const express = require('express');
const router = express.Router();
const { getConversations, getMessagesInConversation, sendMessage, deleteConversation, deleteMessage } = require('../controllers/message.controller');
const { protect } = require('../middleware/authMiddleware');

// GET/POST routes (unchanged)
router.get('/conversations', protect, getConversations);
router.get('/conversations/:conversationId', protect, getMessagesInConversation);
router.post('/', protect, sendMessage);

// @route   DELETE /api/messages/conversations/:conversationId
// @desc    Delete a message conversation
// @access  Private
router.delete('/conversations/:conversationId', protect, deleteConversation);

// @route   DELETE /api/messages/:messageId
// @desc    Delete a specific message within a conversation
// @access  Private
router.delete('/:messageId', protect, deleteMessage);

module.exports = router;
