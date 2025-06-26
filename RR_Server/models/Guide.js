const mongoose = require('mongoose');
const { create } = require('./User');
const Schema = mongoose.Schema;

const guideSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true
    },

    resourceType: { // Explicitly defines the type of resource for UI separation
    type: String,
    required: true,
    enum: ['manual', 'schematic', 'software', 'tutorial', 'general', 'hardware'], // Define allowed resource types
    default: 'general' // Default type if not specified
  },

    category: {
        type: String,
        required: true,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],

    downloadLink: {
        type: String,
        trim: true
    },

    videoLink: {
        type: String,
        trim: true
    },

    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Guide', guideSchema);
// This code defines a Mongoose schema for a Guide model in a MongoDB database.