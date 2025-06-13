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

// **START OF NEW/UPDATED CODE**

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
    .optional({ checkFalsy: true }) // Description is optional
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
    .trim()
    .escape(),
  body('content')
    .notEmpty().withMessage('Guide content is required')
    .isLength({ min: 50 }).withMessage('Content must be at least 50 characters long')
    .trim() // Content will be treated as raw Markdown/text, trimming is safe.
    // Escape or sanitize HTML/Markdown later if content is rendered directly on frontend
    // For backend, ensure it's just a string.
    .escape(), // Basic HTML escaping for content - adjust if you want rich text/Markdown.
               // If you intend to use a Markdown renderer on the frontend, escaping here
               // might break Markdown syntax. Consider dedicated Markdown sanitizers.
               // For now, escaping is a safe default for raw text.
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(ALLOWED_GUIDE_CATEGORIES).withMessage(`Invalid category. Must be one of: ${ALLOWED_GUIDE_CATEGORIES.join(', ')}.`),
  body('tags')
    .optional({ checkFalsy: true }) // Tags are optional
    .isString().withMessage('Tags must be a comma-separated string')
    .customSanitizer(value => { // Custom sanitizer to clean up tags
      if (typeof value !== 'string') return ''; // Ensure it's a string
      return value.split(',')
                  .map(tag => tag.trim())
                  .filter(tag => tag.length > 0)
                  .map(tag => tag.toLowerCase().replace(/[^a-z0-9]/g, '')) // Basic sanitization for tags
                  .join(','); // Join back as a string for storage/processing
    })
];

// **END OF NEW/UPDATED CODE**


// Reusable middleware to handle validation results (used directly in routes now)
// This function itself isn't used directly as a middleware anymore,
// but its logic is incorporated into the route handlers.
const validate = (req, res, next) => {
  // This 'validate' function is now replaced by direct checks in routes like auth.routes.js
  // using validationResult(req) and returning a 422.
  // It's left here as a placeholder for understanding.
};

module.exports = {
  registerValidation,
  loginValidation,
  createGuideValidation, // Export the new validation
  validate // Keep for reference, but mostly superseded by direct checks in routes
};
