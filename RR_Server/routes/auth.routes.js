// server/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { registerUser, loginUser } = require('../controllers/auth.controller');
const { registerValidation, loginValidation } = require('../utils/validation');
const { validationResult } = require('express-validator');

// Get CLIENT_URL from environment variables (add this to your .env)
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000'; // Default to React app's default port

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

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${CLIENT_URL}/login`, session: false }),
  (req, res) => {
    // On successful authentication, generate a JWT token for the user
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Redirect the user's browser back to the frontend with token and user info
    res.redirect(`${CLIENT_URL}/auth/success?token=${token}&username=${encodeURIComponent(req.user.username)}&email=${encodeURIComponent(req.user.email)}`);
  }
);

// GitHub OAuth Routes

router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: `${CLIENT_URL}/login`, session: false }),
  (req, res) => {
    // On successful authentication, generate a JWT token for the user
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Redirect the user's browser back to the frontend with token and user info
    res.redirect(`${CLIENT_URL}/auth/success?token=${token}&username=${encodeURIComponent(req.user.username)}&email=${encodeURIComponent(req.user.email)}`);
  }
);

// Stateless Logout - client-side token deletion is sufficient for JWT
router.get('/logout', (req, res) => {
  res.status(200).json({ message: 'Logout successful (JWT token should be discarded on client-side).' });
});

module.exports = router;
