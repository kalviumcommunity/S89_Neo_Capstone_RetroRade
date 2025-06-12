const CollectionItem = require('../models/CollectionItem');
const Guide = require('../models/Guide');
const ForumPost = require('../models/ForumPost');
const Listing = require('../models/Listing');

// @desc    Get all items in the authenticated user's collection
// @route   GET /api/collections
// @access  Private
const getUserCollection = async (req, res) => {
  try {
    const { itemType } = req.query;
    let query = { user: req.user._id }; // Filter by the authenticated user

    if (itemType) {
      query.itemType = itemType; // Further filter by item type if provided
    }

    const collectionItems = await CollectionItem.find(query).sort({ savedAt: -1 });

    // Populate the actual items based on their type
    // This part can get complex. We'll fetch details for each item type separately.
    const populatedCollection = await Promise.all(collectionItems.map(async (item) => {
      let populatedItem = null;
      if (item.itemType === 'library') {
        // Fetch Guide and select necessary fields
        populatedItem = await Guide.findById(item.itemId).select('title slug description category');
      } else if (item.itemType === 'forum') {
        // Fetch ForumPost and select necessary fields
        populatedItem = await ForumPost.findById(item.itemId).select('title author category createdAt').populate('author', 'username');
      } else if (item.itemType === 'marketplace') {
        // Fetch Listing and select necessary fields
        populatedItem = await Listing.findById(item.itemId).select('title price images condition').populate('seller', 'username');
      }

      if (populatedItem) {
        return {
          _id: item._id, // The ID of the CollectionItem itself
          itemType: item.itemType,
          itemData: populatedItem, // The actual data of the saved item
          savedAt: item.savedAt
        };
      }
      return null; // Handle cases where item might not be found (e.g., deleted)
    }));

    // Filter out any nulls if items were not found
    res.json(populatedCollection.filter(item => item !== null));

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUserCollection
};
