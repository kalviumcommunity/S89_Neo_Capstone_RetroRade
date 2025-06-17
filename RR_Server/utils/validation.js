// server/utils/validation.js
const { body } = require('express-validator');

// Validation rules for user registration
const registerValidation = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
    .trim()
    .escape(),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
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

// Allowed categories for library guides
const ALLOWED_GUIDE_CATEGORIES = [
  'Computing', 'Gaming', 'Audio', 'Video', 'Peripherals', 'Hardware', 'Software', 'General', 'Display', 'Storage', 'Networking'
];

// Validation rules for creating a new guide
const createGuideValidation = [
  body('title')
    .notEmpty().withMessage('Guide title is required')
    .isLength({ min: 5, max: 150 }).withMessage('Title must be between 5 and 150 characters')
    .trim()
    .escape(),
  body('description')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
    .trim()
    .escape(),
  body('content')
    .notEmpty().withMessage('Guide content is required')
    .isLength({ min: 50 }).withMessage('Content must be at least 50 characters long')
    .trim()
    .escape(),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(ALLOWED_GUIDE_CATEGORIES).withMessage(`Invalid category. Must be one of: ${ALLOWED_GUIDE_CATEGORIES.join(', ')}.`),
  body('tags')
    .optional({ checkFalsy: true })
    .isString().withMessage('Tags must be a comma-separated string')
    .customSanitizer(value => {
      if (typeof value !== 'string') return '';
      return value.split(',')
                  .map(tag => tag.trim())
                  .filter(tag => tag.length > 0)
                  .map(tag => tag.toLowerCase().replace(/[^a-z0-9]/g, ''))
                  .join(',');
    })
];

// **START OF NEW/UPDATED CODE**

// Validation rules for updating user profile (all fields optional)
const updateProfileValidation = [
  body('username')
    .optional({ checkFalsy: true })
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
    .trim()
    .escape(),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password') // If password is included in update, apply strength validation
    .optional({ checkFalsy: true })
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'),
  body('bio')
    .optional({ checkFalsy: true })
    .isLength({ max: 1000 }).withMessage('Bio cannot exceed 1000 characters')
    .trim()
    .escape(),
  body('avatar')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Avatar must be a valid URL')
];

// **END OF NEW/UPDATED CODE**


// Reusable middleware to handle validation results
const validate = (req, res, next) => {
  // This 'validate' function is now replaced by direct checks in routes like auth.routes.js
  // using validationResult(req) and returning a 422.
};

module.exports = {
  registerValidation,
  loginValidation,
  createGuideValidation,
  updateProfileValidation, // Export the new validation
  validate
};
