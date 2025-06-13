// server/controllers/message.controller.js
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

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
    console.error('Error getting conversations:', error);
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

    await Message.updateMany(
      { conversation: req.params.conversationId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json(messages);
  } catch (error) {
    console.error('Error getting messages in conversation:', error);
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
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient user not found.' });
      }

      // **START OF NEW/UPDATED CODE - Fix for $size operator**
      // Find conversation where participants array contains both senderId and recipientId
      // and the array size is exactly 2 (for direct 1-to-1 chats)
      conversation = await Conversation.findOne({
        participants: { $all: [senderId, recipientId] },
        // To strictly ensure a 2-person chat, you might add:
        // 'participants.1': { '$exists': true }, 'participants.2': { '$exists': false }
        // Or simply rely on $all if you don't mind potential group chats if other logic allowed it.
        // For strict 2-person, explicitly check size using aggregation or client-side participant count if safe.
        // A simpler, common way to ensure direct 1-to-1 is to query for both IDs and no other participants.
        // The `$size: 2` approach for a direct chat is fine if participants only contains two _ids.
        // For simplicity, we stick to the provided `$all` as it implies both must be present.
        // The original error was likely how $size was combined.
        // Let's ensure correct query structure for a direct chat:
        $and: [
          { participants: senderId },
          { participants: recipientId },
          { 'participants.2': { '$exists': false } } // Ensures exactly 2 participants
        ]
      });
      // **END OF NEW/UPDATED CODE**

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

    conversation.lastMessage = savedMessage._id;
    conversation.updatedAt = Date.now();
    await conversation.save();

    const populatedMessage = await Message.findById(savedMessage._id).populate('sender', 'username avatar');

    res.status(201).json(populatedMessage);

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error during message sending', error: error.message });
  }
};

const deleteConversation = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized. User not authenticated.' });
  }

  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // Only allow deletion if the authenticated user is a participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this conversation.' });
    }

    // Delete all messages associated with this conversation
    await Message.deleteMany({ conversation: conversation._id });

    // Delete the conversation itself
    await conversation.deleteOne();

    res.status(200).json({ message: 'Conversation and all its messages deleted successfully.' });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Server error during conversation deletion', error: error.message });
  }
};

// @desc    Delete a specific message within a conversation (Soft delete common in real apps)
// @route   DELETE /api/messages/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized. User not authenticated.' });
  }

  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    // Only allow deletion if the authenticated user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message.' });
    }

    // In a real chat app, you might "soft delete" (mark as deleted) instead of hard deleting
    // for historical purposes or if it's a group chat. For simplicity, we hard delete.
    await message.deleteOne();

    // Check if parent conversation needs update (e.g., if lastMessage was deleted)
    // This logic can be complex and is often handled by a background job or more sophisticated message management.
    // For now, we'll just delete the message.
    const conversation = await Conversation.findById(message.conversation);
    if (conversation && conversation.lastMessage && conversation.lastMessage.toString() === message._id.toString()) {
      // If the deleted message was the last one, find a new last message
      const newLastMessage = await Message.findOne({ conversation: conversation._id }).sort({ createdAt: -1 });
      conversation.lastMessage = newLastMessage ? newLastMessage._id : null;
      await conversation.save();
    }

    res.status(200).json({ message: 'Message deleted successfully.' });

  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error during message deletion', error: error.message });
  }
};


module.exports = {
  getConversations,
  getMessagesInConversation,
  sendMessage,
  deleteConversation, // Export new function
  deleteMessage // Export new function
};
