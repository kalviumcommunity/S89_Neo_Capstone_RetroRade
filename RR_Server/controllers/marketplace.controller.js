const Listing = require('../models/Listing');
const User = require('../models/User'); // Required for user's listings

// @desc    Get all marketplace listings
// @route   GET /api/marketplace/listings
// @access  Public
const getListings = async (req, res) => {
  try {
    const { category, condition, search } = req.query;
    let query = { isSold: false }; // Only show available listings by default

    if (category) {
      query.category = category;
    }
    if (condition) {
      query.condition = condition;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const listings = await Listing.find(query)
                                  .populate('seller', 'username') // Populate seller's username
                                  .sort({ createdAt: -1 }); // Most recent first

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single marketplace listing by ID
// @route   GET /api/marketplace/listings/:listingId
// @access  Public
const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId)
                                 .populate('seller', 'username'); // Populate seller's username

    if (listing) {
      res.json(listing);
    } else {
      res.status(404).json({ message: 'Listing not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all marketplace listings by a specific user
// @route   GET /api/marketplace/users/:userId/listings
// @access  Public
const getListingsByUser = async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.params.userId, isSold: false })
                                  .populate('seller', 'username')
                                  .sort({ createdAt: -1 });

    if (listings) {
      res.json(listings);
    } else {
      res.status(404).json({ message: 'No listings found for this user' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getListings,
  getListingById,
  getListingsByUser
};
