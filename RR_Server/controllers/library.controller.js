// server/controllers/library.controller.js
const Guide = require('../models/Guide');
const slugify = require('slugify'); // Assuming you have slugify in utils or installed directly

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

// @desc    Create a new library guide
// @route   POST /api/library/guides
// @access  Private (Admin or authorized users)
const createGuide = async (req, res) => {
  const { title, description, content, category, tags } = req.body;

  // Basic validation
  if (!title || !content || !category) {
    return res.status(400).json({ message: 'Please provide title, content, and category.' });
  }

  try {
    const generatedSlug = slugify(title, { lower: true, strict: true });

    // Check if slug already exists to prevent duplicates (though schema also has unique)
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
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [], // Assuming tags come as a comma-separated string
      author: req.user._id // Author is the authenticated user
    });

    const createdGuide = await guide.save();
    res.status(201).json(createdGuide);

  } catch (error) {
    console.error('Error creating guide:', error);
    res.status(500).json({ message: 'Server error during guide creation', error: error.message });
  }
};


module.exports = {
  getGuides,
  getGuideBySlug,
  createGuide
};
