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
      query.tags = tag; // Find guides where 'tag' is in the tags array
    }
    if (search) {
      // Case-insensitive search on title and description
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const guides = await Guide.find(query)
                               .select('title slug description category tags createdAt')
                               .populate('author', 'username'); // Populate author's username

    res.json(guides);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single library guide by slug
// @route   GET /api/library/guides/:slug
// @access  Public
const getGuideBySlug = async (req, res) => {
  try {
    const guide = await Guide.findOne({ slug: req.params.slug })
                             .populate('author', 'username'); // Populate author's username

    if (guide) {
      res.json(guide);
    } else {
      res.status(404).json({ message: 'Guide not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getGuides,
  getGuideBySlug
};
