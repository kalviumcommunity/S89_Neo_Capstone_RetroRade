const User = require('../models/User');

// @desc    Get user profile (authenticated user)
// @route   GET /api/users/profile
// @access  Private (requires authentication)
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password'); // Exclude password

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.createdAt
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Get public user profile by ID
// @route   GET /api/users/:userId
// @access  Public
const getPublicUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -email'); // Exclude sensitive info

    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUserProfile,
  getPublicUserProfile
};