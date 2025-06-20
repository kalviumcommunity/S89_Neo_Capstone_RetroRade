// server/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken'); // Import JWT for generating token for OAuth users
const { registerUser, loginUser } = require('../controllers/auth.controller');
const { registerValidation, loginValidation } = require('../utils/validation');
const { validationResult } = require('express-validator');

// Existing authentication routes
router.post('/register', registerValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({ [err.param]: err.msg }))
    });
  }
  next();
}, registerUser);

router.post('/login', loginValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({ [err.param]: err.msg }))
    });
  }
  next();
}, loginUser);

// Google OAuth Routes
// Redirect to Google for authentication
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google callback route after authentication
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: true }),
  (req, res) => {
    // **START OF FIX: Send JSON response instead of redirecting to frontend**
    // On successful authentication, generate a JWT token for the user
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Google authentication successful',
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        googleId: req.user.googleId // Include googleId for verification
      },
      token: token // Return the JWT token
    });
    // **END OF FIX**
  }
);


// GitHub OAuth Routes
// Redirect to GitHub for authentication
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// GitHub callback route after authentication
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login', session: true }),
  (req, res) => {
    // **START OF FIX: Send JSON response instead of redirecting to frontend**
    // On successful authentication, generate a JWT token for the user
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'GitHub authentication successful',
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        githubId: req.user.githubId // Include githubId for verification
      },
      token: token // Return the JWT token
    });
    // **END OF FIX**
  }
);

// Logout route
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.session.destroy((err) => {
      if (err) { return next(err); }
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
});

// Current User status (optional, for frontend to check if logged in via session)
router.get('/current_user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
    });
  } else {
    res.status(401).json({ message: 'User not authenticated' });
  }
});

module.exports = router;
