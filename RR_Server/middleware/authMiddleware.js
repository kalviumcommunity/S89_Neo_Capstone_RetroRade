// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user and attach to request. If user not found (e.g., deleted), handle it.
      req.user = await User.findById(decoded.id).select('-password');

      // **START OF NEW/UPDATED CODE**
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      // **END OF NEW/UPDATED CODE**

      next();
    } catch (error) {
      console.error('Auth token error:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = {
  protect
};
