// server/routes/marketplace.routes.js
const express = require('express');
const router = express.Router();
const { getListings, getListingById, getListingsByUser, createListing } = require('../controllers/marketplace.controller');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import file system module

// Define upload directory
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'images'); // Go up one level (..) to server, then into uploads/images

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true }); // Create directory and any necessary parent directories
}

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR); // Use the defined and ensured directory
  },
  filename: (req, file, cb) => {
    // Generate a unique filename: fieldname-timestamp.ext
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'));
    }
  },
}).array('images', 5); // Allow up to 5 images

// @route   GET /api/marketplace/listings
// @desc    Get all marketplace listings (with optional filtering)
// @access  Public
router.get('/listings', getListings);

// @route   GET /api/marketplace/listings/:listingId
// @desc    Get a single marketplace listing by ID
// @access  Public
router.get('/listings/:listingId', getListingById);

// @route   GET /api/marketplace/users/:userId/listings
// @desc    Get all marketplace listings by a specific user
// @access  Public
router.get('/users/:userId/listings', getListingsByUser);

// @route   POST /api/marketplace/listings
// @desc    Create a new marketplace listing
// @access  Private
// Use the configured upload middleware
router.post('/listings', protect, (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      return res.status(400).json({ message: 'File upload error', error: err.message });
    } else if (err) {
      // An unknown error occurred when uploading. (e.g., from fileFilter)
      return res.status(400).json({ message: err.message });
    }
    next(); // Everything went fine, proceed to createListing controller
  });
}, createListing);

module.exports = router;
