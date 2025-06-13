// server/controllers/message.controller.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User'); // Import User for participant check

// @desc    Get all conversations for the authenticated user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'username avatar')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username'
        }
      })
      .sort({ updatedAt: -1 });

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

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 });

    // Mark messages as read by the current user
    await Message.updateMany(
      { conversation: req.params.conversationId, readBy: { $ne: req.user._id } }, // Only mark if not already read by user
      { $addToSet: { readBy: req.user._id } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  const { recipientId, content, conversationId } = req.body;
  const senderId = req.user._id;

  if (!content || (!recipientId && !conversationId)) {
    return res.status(400).json({ message: 'Content, and either recipientId or conversationId are required.' });
  }

  try {
    let conversation;

    if (conversationId) {
      // Find existing conversation
      conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(senderId)) {
        return res.status(404).json({ message: 'Conversation not found or not authorized.' });
      }
    } else {
      // Start a new conversation
      if (senderId.toString() === recipientId) {
        return res.status(400).json({ message: 'Cannot send message to yourself directly. Start a chat with someone else.' });
      }
      // Check if recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient user not found.' });
      }

      // Check for existing conversation between these two
      conversation = await Conversation.findOne({
        participants: { $all: [senderId, recipientId] },
        $size: 2 // Ensure it's a 2-person chat (can adjust for group chats)
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [senderId, recipientId]
        });
        await conversation.save();
      }
    }

    const message = new Message({
      conversation: conversation._id,
      sender: senderId,
      content
    });

    const savedMessage = await message.save();

    // Update lastMessage in conversation
    conversation.lastMessage = savedMessage._id;
    conversation.updatedAt = Date.now(); // Update timestamp to bring conversation to top
    await conversation.save();

    // Populate sender for immediate response
    const populatedMessage = await Message.findById(savedMessage._id).populate('sender', 'username avatar');

    res.status(201).json(populatedMessage);

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error during message sending', error: error.message });
  }
};


module.exports = {
  getConversations,
  getMessagesInConversation,
  sendMessage
};
