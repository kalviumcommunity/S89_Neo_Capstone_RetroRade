// server/routes/marketplace.routes.js
const express = require('express');
const router = express.Router();
const { getListings, getListingById, getListingsByUser, createListing, updateListing, deleteListing, updateListingStatus } = require('../controllers/marketplace.controller');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'images');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
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
}).array('images', 5);

// GET/POST routes (unchanged)
router.get('/listings', getListings);
router.get('/listings/:listingId', getListingById);
router.get('/users/:userId/listings', getListingsByUser);
router.post('/listings', protect, (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'File upload error', error: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, createListing);

// @route   PUT /api/marketplace/listings/:listingId
// @desc    Update a marketplace listing by ID
// @access  Private (Owner or Admin)
router.put('/listings/:listingId', protect, (req, res, next) => {
  upload(req, res, function (err) { // Multer upload middleware for PUT
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'File upload error', error: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, updateListing);


// @route   DELETE /api/marketplace/listings/:listingId
// @desc    Delete a marketplace listing by ID
// @access  Private (Owner or Admin)
router.delete('/listings/:listingId', protect, deleteListing);

// @route   PUT /api/marketplace/listings/:listingId/status
// @desc    Update marketplace listing status (e.g., mark as sold)
// @access  Private (Owner or Admin)
router.put('/listings/:listingId/status', protect, updateListingStatus);

module.exports = router;
