const express = require('express');
const router = express.Router();
const { getListings, getListingById, getListingsByUser } = require('../controllers/marketplace.controller');

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

module.exports = router;
