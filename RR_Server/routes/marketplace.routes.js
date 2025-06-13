// server/routes/marketplace.routes.js
const express = require('express');
const router = express.Router();
const { getListings, getListingById, getListingsByUser, createListing } = require('../controllers/marketplace.controller');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer'); // Import multer for file uploads
const path = require('path'); // Node.js built-in path module

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure this directory exists in your server/uploads/images
    cb(null, 'server/uploads/images/');
  },
  filename: (req, file, cb) => {
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
});


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
// Use upload.array('images', 5) for multiple images (up to 5)
// req.files will contain the array of uploaded files
router.post('/listings', protect, upload.array('images', 5), createListing);

module.exports = router;
