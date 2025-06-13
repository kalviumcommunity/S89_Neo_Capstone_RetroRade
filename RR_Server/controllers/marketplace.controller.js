// server/controllers/marketplace.controller.js
const Listing = require('../models/Listing');
const User = require('../models/User');
const fs = require('fs'); // For file system operations (deleting images)
const path = require('path'); // For path manipulation

// Define a clear, absolute base directory where all *valid* uploads are stored.
// This should match the destination configured in multer in marketplace.routes.js
// It's crucial for path validation.
// path.join(__dirname, '..', 'uploads') navigates from 'controllers' to 'server/uploads'
const UPLOAD_BASE_DIR = path.join(__dirname, '..', 'uploads');

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

// @desc    Create a new marketplace listing
// @route   POST /api/marketplace/listings
// @access  Private
const createListing = async (req, res) => {
  // Assuming 'upload' middleware from multer handles files, and req.body for text fields
  const { title, description, price, category, condition } = req.body;
  const images = req.files ? req.files.map(file => `/uploads/images/${file.filename}`) : []; // Assuming saved to uploads/images

  if (!title || !description || !price || !category || !condition) {
    return res.status(400).json({ message: 'Please fill all required fields: title, description, price, category, condition.' });
  }

  try {
    const listing = new Listing({
      seller: req.user._id, // Seller is the authenticated user
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

    // Handle new images from multer (req.files)
    const uploadedNewImagePaths = req.files ? req.files.map(file => `/uploads/images/${file.filename}`) : [];

    // Combine existing images (passed as a stringified array) and new uploaded images
    let updatedImages = [];
    if (existingImages) {
      // Ensure existingImages is an array (it might come as a string if only one is passed)
      try {
        const parsedExistingImages = JSON.parse(existingImages);
        if (Array.isArray(parsedExistingImages)) {
          updatedImages = parsedExistingImages;
        } else {
          updatedImages = [parsedExistingImages]; // If it was a single string
        }
      } catch (e) {
        updatedImages = [existingImages]; // If not valid JSON, treat as single string
      }
    }
    updatedImages = updatedImages.concat(uploadedNewImagePaths);

    // Update fields
    listing.title = title || listing.title;
    listing.description = description || listing.description;
    listing.price = price || listing.price;
    listing.category = category || listing.category;
    listing.condition = condition || listing.condition;
    listing.images = updatedImages; // Update the images array
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

    // **START OF FIX FOR PATH TRAVERSAL VULNERABILITY**
    if (listing.images && listing.images.length > 0) {
      for (const imagePathDb of listing.images) { // imagePathDb will be something like "/uploads/images/filename.jpg" or "https://..."
        // Ensure imagePathDb is a local path we manage and not an external URL
        if (!imagePathDb.startsWith('/uploads/')) {
          console.warn(`Image path not starting with /uploads/ detected: ${imagePathDb}. Skipping local deletion.`);
          continue; // Skip external URLs
        }

        // 1. Extract the relative path from the database string (e.g., "images/filename.jpg")
        //    This part is crucial: we assume '/uploads/' prefix and extract only what comes after.
        const relativeUploadPath = imagePathDb.substring('/uploads/'.length);

        // 2. Construct the full absolute path to the file on disk
        const fullPathToDelete = path.join(UPLOAD_BASE_DIR, relativeUploadPath);

        // 3. **CRITICAL VALIDATION: Canonicalize and verify containment.**
        //    path.resolve() resolves '..' and '.' segments, getting the true absolute path.
        //    path.normalize() handles redundant separators.
        const normalizedFullPath = path.normalize(path.resolve(fullPathToDelete));
        const normalizedUploadBaseDir = path.normalize(path.resolve(UPLOAD_BASE_DIR));

        // Check if the file's normalized path actually *starts with* the normalized base upload directory.
        // This confirms the file is safely within the intended uploads folder.
        // Add path.sep to normalizedUploadBaseDir to ensure it's treated as a directory boundary
        if (normalizedFullPath.startsWith(normalizedUploadBaseDir + path.sep)) {
          fs.unlink(normalizedFullPath, (err) => {
            if (err) {
              // Log the error but don't halt the overall process.
              console.error(`Failed to delete image file: ${normalizedFullPath}. Error:`, err);
              // In a real application, you might also update the DB to reflect deletion failure
              // or move the image to a 'failed_deletions' quarantine.
            } else {
              console.log(`Successfully deleted image file: ${normalizedFullPath}`);
            }
          });
        } else {
          // This indicates a severe path traversal attempt! Log this securely.
          console.error(`SECURITY ALERT: Path traversal attempt detected! Tried to delete: ${fullPathToDelete} (Normalized: ${normalizedFullPath}). Base: ${normalizedUploadBaseDir}. User: ${req.user._id}`);
          // Do NOT delete the file if it's outside the allowed directory.
        }
      }
    }
    // **END OF FIX FOR PATH TRAVERSAL VULNERABILITY**

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

  // Basic validation for isSold
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
  updateListing, // Export new function
  deleteListing, // Export new function
  updateListingStatus // Export new function
};

