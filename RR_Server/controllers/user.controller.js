// server/controllers/user.controller.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Need jwt for re-generating token on profile update

// @desc    Get user profile (authenticated user)
// @route   GET /api/users/profile
// @access  Private (requires authentication)
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

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
    const user = await User.findById(req.params.userId).select('-password -email');

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
    console.error('Error getting public user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile (authenticated user)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    user.avatar = req.body.avatar || user.avatar;

    // **START OF FIX - Password Update Vulnerability**
    if (req.body.password) {
      const { currentPassword, password } = req.body; // New password field is 'password'

      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt); // Use 'password' from body as new password
    }
    // **END OF FIX - Password Update Vulnerability**

    const updatedUser = await user.save();

    // Re-generate token if essential profile fields (username, email) changed,
    // or always generate if password changed (forces re-login with new password if not implemented separately)
    const token = jwt.sign({ id: updatedUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
      token // Send new token if profile fields changed
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Delete user account (authenticated user)
// @route   DELETE /api/users/profile
// @access  Private
const deleteUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // In a real application, you'd also want to:
      // 1. Delete all their related data (guides, forum posts, listings, collection items, messages)
      //    or mark them as 'deleted' to preserve data integrity/history.
      // 2. Handle associated files (e.g., delete avatar, listing images).
      // 3. Invalidate their JWT token.
      // This is a simplified deletion.
      await user.deleteOne(); // Use deleteOne() for Mongoose 6+

      res.status(200).json({ message: 'User account deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUserProfile,
  getPublicUserProfile,
  updateUserProfile,
  deleteUserAccount
};
