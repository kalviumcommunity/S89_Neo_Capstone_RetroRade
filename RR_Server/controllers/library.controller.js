// server/controllers/library.controller.js
const Guide = require('../models/Guide');
const slugify = require('slugify');

// @desc    Get all library guides
// @route   GET /api/library/guides
// @access  Public
const getGuides = async (req, res) => {
  try {
    const { category, tag, search } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }
    if (tag) {
      query.tags = tag;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const guides = await Guide.find(query)
                               .select('title slug description category tags createdAt')
                               .populate('author', 'username');

    res.json(guides);
  } catch (error) {
    console.error('Error getting guides:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single library guide by slug
// @route   GET /api/library/guides/:slug
// @access  Public
const getGuideBySlug = async (req, res) => {
  try {
    const guide = await Guide.findOne({ slug: req.params.slug })
                             .populate('author', 'username');

    if (guide) {
      res.json(guide);
    } else {
      res.status(404).json({ message: 'Guide not found' });
    }
  } catch (error) {
    console.error('Error getting guide by slug:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new library guide
// @route   POST /api/library/guides
// @access  Private (Admin or authorized users)
const createGuide = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized to create a guide. User not authenticated.' });
  }

  const { title, description, content, category, tags } = req.body;

  try {
    const generatedSlug = slugify(title, { lower: true, strict: true });

    const existingGuide = await Guide.findOne({ slug: generatedSlug });
    if (existingGuide) {
      return res.status(400).json({ message: 'A guide with a similar title already exists. Please choose a more unique title.' });
    }

    const guide = new Guide({
      title,
      slug: generatedSlug,
      description,
      content,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      author: req.user._id
    });

    const createdGuide = await guide.save();
    res.status(201).json(createdGuide);

  } catch (error) {
    console.error('Error creating guide:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation failed from Mongoose schema', errors: messages });
    }
    res.status(500).json({ message: 'Server error during guide creation', error: error.message });
  }
};

// @desc    Update a library guide by slug
// @route   PUT /api/library/guides/:slug
// @access  Private (Owner or Admin)
const updateGuide = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized. User not authenticated.' });
  }

  const { title, description, content, category, tags } = req.body;

  try {
    const guide = await Guide.findOne({ slug: req.params.slug });

    if (!guide) {
      return res.status(404).json({ message: 'Guide not found.' });
    }

    // Authorization: Only owner or admin can update
    if (guide.author.toString() !== req.user._id.toString() /* && !req.user.isAdmin */) {
      return res.status(403).json({ message: 'Not authorized to update this guide.' });
    }

    // Update fields if provided
    guide.title = title || guide.title;
    if (title && guide.title !== title) { // Re-slugify if title changes
      guide.slug = slugify(title, { lower: true, strict: true });
      // Check for slug conflict if title changed
      const existingGuideWithNewSlug = await Guide.findOne({ slug: guide.slug, _id: { $ne: guide._id } });
      if (existingGuideWithNewSlug) {
        return res.status(400).json({ message: 'New title creates a slug conflict with another guide.' });
      }
    }
    guide.description = description !== undefined ? description : guide.description;
    guide.content = content || guide.content;
    guide.category = category || guide.category;
    guide.tags = tags ? tags.split(',').map(tag => tag.trim()) : guide.tags;
    guide.updatedAt = Date.now();

    const updatedGuide = await guide.save();
    res.json(updatedGuide);

  } catch (error) {
    console.error('Error updating guide:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation failed from Mongoose schema', errors: messages });
    }
    res.status(500).json({ message: 'Server error during guide update', error: error.message });
  }
};

// @desc    Delete a library guide by slug
// @route   DELETE /api/library/guides/:slug
// @access  Private (Owner or Admin)
const deleteGuide = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized. User not authenticated.' });
  }

  try {
    const guide = await Guide.findOne({ slug: req.params.slug });

    if (!guide) {
      return res.status(404).json({ message: 'Guide not found.' });
    }

    // Authorization: Only owner or admin can delete
    if (guide.author.toString() !== req.user._id.toString() /* && !req.user.isAdmin */) {
      return res.status(403).json({ message: 'Not authorized to delete this guide.' });
    }

    await guide.deleteOne();
    res.status(200).json({ message: 'Guide deleted successfully.' });

  } catch (error) {
    console.error('Error deleting guide:', error);
    res.status(500).json({ message: 'Server error during guide deletion', error: error.message });
  }
};

module.exports = {
  getGuides,
  getGuideBySlug,
  createGuide,
  updateGuide, // Export new function
  deleteGuide // Export new function
};
