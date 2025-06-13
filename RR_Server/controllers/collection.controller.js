// server/controllers/collection.controller.js
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
    const populatedCollection = await Promise.all(collectionItems.map(async (item) => {
      let populatedItem = null;
      if (item.itemType === 'library') {
        populatedItem = await Guide.findById(item.itemId).select('title slug description category');
      } else if (item.itemType === 'forum') {
        populatedItem = await ForumPost.findById(item.itemId).select('title author category createdAt').populate('author', 'username');
      } else if (item.itemType === 'marketplace') {
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
      return null;
    }));

    res.json(populatedCollection.filter(item => item !== null));

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add an item to the authenticated user's collection
// @route   POST /api/collections
// @access  Private
const addCollectionItem = async (req, res) => {
  const { itemId, itemType } = req.body;

  if (!itemId || !itemType) {
    return res.status(400).json({ message: 'Please provide itemId and itemType.' });
  }

  // Basic validation for itemType
  if (!['library', 'forum', 'marketplace'].includes(itemType)) {
    return res.status(400).json({ message: 'Invalid itemType. Must be library, forum, or marketplace.' });
  }

  try {
    // Check if item already exists in collection for this user
    const existingItem = await CollectionItem.findOne({
      user: req.user._id,
      itemId,
      itemType
    });

    if (existingItem) {
      return res.status(400).json({ message: `This ${itemType} item is already in your collection.` });
    }

    // You might want to verify that the itemId actually exists in its respective collection
    // For example:
    let itemExists = false;
    if (itemType === 'library') itemExists = await Guide.findById(itemId);
    else if (itemType === 'forum') itemExists = await ForumPost.findById(itemId);
    else if (itemType === 'marketplace') itemExists = await Listing.findById(itemId);

    if (!itemExists) {
        return res.status(404).json({ message: `${itemType} item not found.` });
    }

    const newItem = new CollectionItem({
      user: req.user._id,
      itemId,
      itemType
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);

  } catch (error) {
    console.error('Error adding item to collection:', error);
    res.status(500).json({ message: 'Server error during collection add', error: error.message });
  }
};


// @desc    Remove an item from the authenticated user's collection
// @route   DELETE /api/collections/:collectionItemId
// @access  Private
const removeCollectionItem = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized. User not authenticated.' });
  }

  try {
    const collectionItem = await CollectionItem.findById(req.params.collectionItemId);

    if (!collectionItem) {
      return res.status(404).json({ message: 'Collection item not found.' });
    }

    // Authorization: Ensure the item belongs to the authenticated user
    if (collectionItem.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this collection item.' });
    }

    await collectionItem.deleteOne();
    res.status(200).json({ message: 'Item removed from collection successfully.' });

  } catch (error) {
    console.error('Error removing item from collection:', error);
    res.status(500).json({ message: 'Server error during collection item removal', error: error.message });
  }
};

module.exports = {
  getUserCollection,
  addCollectionItem,
  removeCollectionItem // Export new function
};