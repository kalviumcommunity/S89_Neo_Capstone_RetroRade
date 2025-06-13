// server/controllers/marketplace.controller.js
const Listing = require('../models/Listing');
const User = require('../models/User');
const fs = require('fs'); // For file system operations (deleting images)
const path = require('path'); // For path manipulation

// Define the absolute base directory where marketplace images are stored.
// This should accurately point to `server/uploads/images`.
// path.join(__dirname, '..', 'uploads', 'images') navigates from 'controllers'
// (server/controllers/) -> (server/) -> (server/uploads/) -> (server/uploads/images/)
const IMAGE_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'images');

// Helper function to check if a target path is safely contained within a base directory.
// This is crucial to prevent path traversal attacks.
const isPathInside = (targetPath, baseDir) => {
  const resolvedBasePath = path.resolve(baseDir); // Get absolute, normalized base path
  const resolvedTargetPath = path.resolve(targetPath); // Get absolute, normalized target path

  // 1. Check if the resolved target path actually starts with the resolved base path.
  // 2. Ensure that if they are the same length, they are identical paths (target IS base).
  // 3. If target is longer, ensure the character immediately after the base path
  //    in the target path is a path separator (e.g., / or \).
  //    This prevents cases like `/path/to/baseDIRTY` being considered inside `/path/to/base`.
  return resolvedTargetPath.startsWith(resolvedBasePath) &&
         (resolvedTargetPath.length === resolvedBasePath.length ||
          resolvedTargetPath[resolvedBasePath.length] === path.sep);
};


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
    console.error('Error getting listings:', error);
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
    console.error('Error getting listing by ID:', error);
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
    console.error('Error getting listings by user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new marketplace listing
// @route   POST /api/marketplace/listings
// @access  Private
const createListing = async (req, res) => {
  const { title, description, price, category, condition } = req.body;
  const images = req.files ? req.files.map(file => `/uploads/images/${file.filename}`) : [];

  if (!title || !description || !price || !category || !condition) {
    return res.status(400).json({ message: 'Please fill all required fields: title, description, price, category, condition.' });
  }

  try {
    const listing = new Listing({
      seller: req.user._id,
      title,
      description,
      price,
      category,
      condition,
      images
    });

    const createdListing = await listing.save();
    res.status(201).json(createdListing);

  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ message: 'Server error during listing creation', error: error.message });
  }
};

// @desc    Update a marketplace listing by ID
// @route   PUT /api/marketplace/listings/:listingId
// @access  Private (Owner or Admin)
const updateListing = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized. User not authenticated.' });
  }

  const { title, description, price, category, condition, existingImages, newImages } = req.body;
  const { listingId } = req.params;

  try {
    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // Authorization: Only owner or admin can update
    if (listing.seller.toString() !== req.user._id.toString() /* && !req.user.isAdmin */) {
      return res.status(403).json({ message: 'Not authorized to update this listing.' });
    }

    const uploadedNewImagePaths = req.files ? req.files.map(file => `/uploads/images/${file.filename}`) : [];

    let updatedImages = [];
    if (existingImages) {
      try {
        const parsedExistingImages = JSON.parse(existingImages);
        if (Array.isArray(parsedExistingImages)) {
          updatedImages = parsedExistingImages;
        } else {
          updatedImages = [existingImages];
        }
      } catch (e) {
        updatedImages = [existingImages];
      }
    }
    updatedImages = updatedImages.concat(uploadedNewImagePaths);

    listing.title = title || listing.title;
    listing.description = description || listing.description;
    listing.price = price || listing.price;
    listing.category = category || listing.category;
    listing.condition = condition || listing.condition;
    listing.images = updatedImages;
    listing.updatedAt = Date.now();

    const updatedListing = await listing.save();
    res.json(updatedListing);

  } catch (error) {
    console.error('Error updating listing:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation failed from Mongoose schema', errors: messages });
    }
    res.status(500).json({ message: 'Server error during listing update', error: error.message });
  }
};


// @desc    Delete a marketplace listing by ID
// @route   DELETE /api/marketplace/listings/:listingId
// @access  Private (Owner or Admin)
const deleteListing = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized. User not authenticated.' });
  }

  try {
    const listing = await Listing.findById(req.params.listingId);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // Authorization: Only owner or admin can delete
    if (listing.seller.toString() !== req.user._id.toString() /* && !req.user.isAdmin */) {
      return res.status(403).json({ message: 'Not authorized to delete this listing.' });
    }

    if (listing.images && listing.images.length > 0) {
      for (const imagePathDb of listing.images) {
        // Ensure imagePathDb is a local path we manage and not an external URL (e.g., from a CDN)
        if (!imagePathDb.startsWith('/uploads/images/')) { // More specific check for image paths
          console.warn(`Image path not matching expected local upload prefix: ${imagePathDb}. Skipping local deletion.`);
          continue; // Skip external URLs or non-standard local paths
        }

        // Construct the full absolute path on disk
        // We strip '/uploads/' and then join it with the absolute base directory for uploads
        // The imagePathDb is something like '/uploads/images/filename.jpg'
        const relativeToUploadsRoot = imagePathDb.substring('/uploads/'.length); // e.g., 'images/filename.jpg'
        const fullPathToDelete = path.join(path.resolve(__dirname, '..', 'uploads'), relativeToUploadsRoot); // Resolves to /path/to/server/uploads/images/filename.jpg


        // **CRITICAL VALIDATION: Verify containment using the refined helper**
        if (isPathInside(fullPathToDelete, IMAGE_UPLOAD_DIR)) {
          fs.unlink(fullPathToDelete, (err) => {
            if (err) {
              console.error(`Failed to delete image file: ${fullPathToDelete}. Error:`, err);
            } else {
              console.log(`Successfully deleted image file: ${fullPathToDelete}`);
            }
          });
        } else {
          console.error(`SECURITY ALERT: Path traversal attempt detected! Tried to delete: ${fullPathToDelete}. Expected base: ${IMAGE_UPLOAD_DIR}. User: ${req.user._id}`);
        }
      }
    }

    await listing.deleteOne();
    res.status(200).json({ message: 'Listing deleted successfully.' });

  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ message: 'Server error during listing deletion', error: error.message });
  }
};


// @desc    Update marketplace listing status (e.g., mark as sold)
// @route   PUT /api/marketplace/listings/:listingId/status
// @access  Private (Owner or Admin)
const updateListingStatus = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized. User not authenticated.' });
  }

  const { isSold } = req.body;
  const { listingId } = req.params;

  if (typeof isSold !== 'boolean') {
    return res.status(400).json({ message: 'isSold must be a boolean value.' });
  }

  try {
    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // Authorization: Only owner or admin can update status
    if (listing.seller.toString() !== req.user._id.toString() /* && !req.user.isAdmin */) {
      return res.status(403).json({ message: 'Not authorized to update this listing status.' });
    }

    listing.isSold = isSold;
    listing.updatedAt = Date.now();

    const updatedListing = await listing.save();
    res.json(updatedListing);

  } catch (error) {
    console.error('Error updating listing status:', error);
    res.status(500).json({ message: 'Server error during listing status update', error: error.message });
  }
};


module.exports = {
  getListings,
  getListingById,
  getListingsByUser,
  createListing,
  updateListing,
  deleteListing,
  updateListingStatus
};
