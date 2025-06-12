const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @desc    Get all conversations for the authenticated user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    // Find conversations where the current user is a participant
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'username avatar') // Populate participant details
      .populate({
        path: 'lastMessage', // Optionally populate the last message
        populate: {
          path: 'sender',
          select: 'username'
        }
      })
      .sort({ updatedAt: -1 }); // Sort by most recent activity

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all messages within a specific conversation
// @route   GET /api/messages/conversations/:conversationId
// @access  Private
const getMessagesInConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Ensure the authenticated user is a participant in this conversation
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'username avatar') // Populate sender details
      .sort({ createdAt: 1 }); // Sort messages chronologically

    // Mark messages as read by the current user (optional, can be done in a separate PUT request too)
    await Message.updateMany(
      { conversation: req.params.conversationId, _id: { $nin: req.user.readMessages || [] } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getConversations,
  getMessagesInConversation
};
