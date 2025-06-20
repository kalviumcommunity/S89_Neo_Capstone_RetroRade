// server/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
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
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false })); // **FIX: session: false**

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }), // **FIX: session: false**
  (req, res) => {
    // On successful authentication, generate a JWT token for the user
    // req.user is available here from Passport's strategy 'done' callback
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Google authentication successful',
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        googleId: req.user.googleId
      },
      token: token
    });
  }
);


// GitHub OAuth Routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false })); // **FIX: session: false**

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login', session: false }), // **FIX: session: false**
  (req, res) => {
    // On successful authentication, generate a JWT token for the user
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'GitHub authentication successful',
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        githubId: req.user.githubId
      },
      token: token
    });
  }
);

// **START OF FIX - Stateless Logout & Current User**
// Logout route - For JWT, logout is usually handled client-side by deleting the token.
// For API-only, we just send a success message. No server-side session to destroy.
router.get('/logout', (req, res) => {
  res.status(200).json({ message: 'Logout successful (JWT token should be discarded on client-side).' });
});

// Current User status - For JWT, this needs the 'protect' middleware to verify the token.
// Removed: req.isAuthenticated() as it's session-based.
// We'll add this to user.routes.js as it's a user profile endpoint requiring authentication.
// It was duplicated logic anyway.
// Removed: router.get('/current_user', ... );
// **END OF FIX**

module.exports = router;
