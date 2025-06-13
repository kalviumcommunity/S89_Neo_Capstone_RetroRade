// server/utils/validation.js
const { body } = require('express-validator');

// Validation rules for user registration
const registerValidation = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
    .trim()
    .escape(), // Sanitize input
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(), // Sanitize email
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.')
];

// Validation rules for user login
const loginValidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Reusable middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req); // Need to import validationResult in controller/route
  if (errors.isEmpty()) {
    return next(); // No validation errors, proceed
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(422).json({
    message: 'Validation failed',
    errors: extractedErrors
  });
};

module.exports = {
  registerValidation,
  loginValidation,
  validate // We'll use this middleware in routes
};
