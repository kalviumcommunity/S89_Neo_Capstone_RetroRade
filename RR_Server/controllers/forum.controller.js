// server/controllers/forum.controller.js
const ForumPost = require('../models/ForumPost');
const ForumReply = require('../models/ForumReply');
const xss = require('xss'); // Import the xss library

// @desc    Get all forum posts
// @route   GET /api/forum/posts
// @access  Public
const getForumPosts = async (req, res) => {
  try {
    const { category, authorId, search } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }
    if (authorId) {
      query.author = authorId;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort by most recent
    const posts = await ForumPost.find(query)
                                 .populate('author', 'username') // Populate author's username
                                 .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('Error getting forum posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single forum post with its replies
// @route   GET /api/forum/posts/:postId
// @access  Public
const getForumPostById = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId)
                                .populate('author', 'username') // Populate post author
                                .populate({
                                  path: 'replies', // Populate replies
                                  populate: {
                                    path: 'author', // And the author of each reply
                                    select: 'username'
                                  }
                                });

    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ message: 'Forum post not found' });
    }
  } catch (error) {
    console.error('Error getting forum post by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all forum posts by a specific user
// @route   GET /api/forum/users/:userId/posts
// @access  Public
const getForumPostsByUser = async (req, res) => {
  try {
    const posts = await ForumPost.find({ author: req.params.userId })
                                 .populate('author', 'username')
                                 .sort({ createdAt: -1 });

    if (posts) {
      res.json(posts);
    } else {
      res.status(404).json({ message: 'No forum posts found for this user' });
    }
  } catch (error) {
    console.error('Error getting forum posts by user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new forum post
// @route   POST /api/forum/posts
// @access  Private
const createForumPost = async (req, res) => {
  const { title, content, category, tags } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ message: 'Please provide title, content, and category.' });
  }

  // **FIX - XSS Sanitization**
  const sanitizedContent = xss(content); // Sanitize content before saving
  // **END OF FIX - XSS Sanitization**

  try {
    const post = new ForumPost({
      title,
      content: sanitizedContent, // Use sanitized content
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      author: req.user._id // Author is the authenticated user
    });

    const createdPost = await post.save();
    res.status(201).json(createdPost);

  } catch (error) {
    console.error('Error creating forum post:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation failed from Mongoose schema', errors: messages });
    }
    res.status(500).json({ message: 'Server error during post creation', error: error.message });
  }
};

// @desc    Add a reply to a forum post
// @route   POST /api/forum/posts/:postId/replies
// @access  Private
const addReplyToPost = async (req, res) => {
  const { content } = req.body;
  const { postId } = req.params;

  if (!content) {
    return res.status(400).json({ message: 'Reply content cannot be empty.' });
  }

  // **FIX - XSS Sanitization**
  const sanitizedContent = xss(content); // Sanitize content before saving
  // **END OF FIX - XSS Sanitization**

  try {
    const post = await ForumPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Forum post not found.' });
    }

    const reply = new ForumReply({
      post: postId,
      author: req.user._id, // Author is the authenticated user
      content: sanitizedContent // Use sanitized content
    });

    const createdReply = await reply.save();

    // Add the reply's ID to the parent post's replies array
    post.replies.push(createdReply._id);
    await post.save();

    // Populate author for response
    const populatedReply = await ForumReply.findById(createdReply._id).populate('author', 'username');

    res.status(201).json(populatedReply);

  } catch (error) {
    console.error('Error adding reply to post:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation failed from Mongoose schema', errors: messages });
    }
    res.status(500).json({ message: 'Server error during reply creation', error: error.message });
  }
};

// @desc    Update a forum post by ID
// @route   PUT /api/forum/posts/:postId
// @access  Private (Owner or Admin)
const updateForumPost = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized. User not authenticated.' });
  }

  const { title, content, category, tags } = req.body;
  const { postId } = req.params;

  try {
    const post = await ForumPost.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Forum post not found.' });
    }

    // Authorization: Only owner or admin can update
    if (post.author.toString() !== req.user._id.toString() /* && !req.user.isAdmin */) {
      return res.status(403).json({ message: 'Not authorized to update this post.' });
    }

    // **FIX - XSS Sanitization for update**
    const sanitizedContent = content ? xss(content) : post.content;
    // **END OF FIX - XSS Sanitization**

    post.title = title || post.title;
    post.content = sanitizedContent; // Use sanitized content
    post.category = category || post.category;
    post.tags = tags ? tags.split(',').map(tag => tag.trim()) : post.tags;
    post.updatedAt = Date.now();

    const updatedPost = await post.save();
    res.json(updatedPost);

  } catch (error) {
    console.error('Error updating forum post:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation failed from Mongoose schema', errors: messages });
    }
    res.status(500).json({ message: 'Server error during post update', error: error.message });
  }
};

// @desc    Delete a forum post by ID
// @route   DELETE /api/forum/posts/:postId
// @access  Private (Owner or Admin)
const deleteForumPost = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized. User not authenticated.' });
  }

  try {
    const post = await ForumPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Forum post not found.' });
    }

    // Authorization: Only owner or admin can delete
    if (post.author.toString() !== req.user._id.toString() /* && !req.user.isAdmin */) {
      return res.status(403).json({ message: 'Not authorized to delete this post.' });
    }

    // Delete all associated replies first
    await ForumReply.deleteMany({ post: post._id });

    await post.deleteOne();
    res.status(200).json({ message: 'Forum post and its replies deleted successfully.' });

  } catch (error) {
    console.error('Error deleting forum post:', error);
    res.status(500).json({ message: 'Server error during post deletion', error: error.message });
  }
};

// @desc    Update a forum reply by ID
// @route   PUT /api/forum/replies/:replyId
// @access  Private (Owner or Admin)
const updateForumReply = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized. User not authenticated.' });
  }

  const { content } = req.body;
  const { replyId } = req.params;

  if (!content) {
    return res.status(400).json({ message: 'Reply content cannot be empty.' });
  }

  // **FIX - XSS Sanitization for update**
  const sanitizedContent = xss(content);
  // **END OF FIX - XSS Sanitization**

  try {
    const reply = await ForumReply.findById(replyId);

    if (!reply) {
      return res.status(404).json({ message: 'Forum reply not found.' });
    }

    // Authorization: Only owner or admin can update
    if (reply.author.toString() !== req.user._id.toString() /* && !req.user.isAdmin */) {
      return res.status(403).json({ message: 'Not authorized to update this reply.' });
    }

    reply.content = sanitizedContent; // Use sanitized content
    await reply.save();
    res.json(reply);

  } catch (error) {
    console.error('Error updating forum reply:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation failed from Mongoose schema', errors: messages });
    }
    res.status(500).json({ message: 'Server error during reply update', error: error.message });
  }
};

// @desc    Delete a forum reply by ID
// @route   DELETE /api/forum/replies/:replyId
// @access  Private (Owner or Admin)
const deleteForumReply = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized. User not authenticated.' });
  }

  try {
    const reply = await ForumReply.findById(req.params.replyId);

    if (!reply) {
      return res.status(404).json({ message: 'Forum reply not found.' });
    }

    // Authorization: Only owner or admin can delete
    if (reply.author.toString() !== req.user._id.toString() /* && !req.user.isAdmin */) {
      return res.status(403).json({ message: 'Not authorized to delete this reply.' });
    }

    // Remove reply reference from parent post
    await ForumPost.findByIdAndUpdate(reply.post, { $pull: { replies: reply._id } });

    await reply.deleteOne();
    res.status(200).json({ message: 'Forum reply deleted successfully.' });

  } catch (error) {
    console.error('Error deleting forum reply:', error);
    res.status(500).json({ message: 'Server error during reply deletion', error: error.message });
  }
};

module.exports = {
  getForumPosts,
  getForumPostById,
  getForumPostsByUser,
  createForumPost,
  updateForumPost, // Export new function
  deleteForumPost, // Export new function
  addReplyToPost,
  updateForumReply, // Export new function
  deleteForumReply // Export new function
};
