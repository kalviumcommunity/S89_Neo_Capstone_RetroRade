// server/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/auth.controller');
const { registerValidation, loginValidation, validate } = require('../utils/validation'); // Import validation utils
const { validationResult } = require('express-validator'); // Import for use in custom middleware

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({ [err.param]: err.msg }))
    });
  }
  next(); // If validation passes, proceed to controller
}, registerUser);


// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginValidation, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({ [err.param]: err.msg }))
    });
  }
  next(); // If validation passes, proceed to controller
}, loginUser);

module.exports = router;
