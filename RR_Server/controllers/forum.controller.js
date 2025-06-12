const ForumPost = require('../models/ForumPost');
const ForumReply = require('../models/ForumReply');
const User = require('../models/User');

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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


module.exports = {
  getForumPosts,
  getForumPostById,
  getForumPostsByUser
};
