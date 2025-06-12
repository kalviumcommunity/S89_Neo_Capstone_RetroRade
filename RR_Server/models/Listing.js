const mongoose = require('mongoose');
const { create } = require('./User');
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        trim: true
    },
    condition: {
        type: String,
        required: true,
        enum: ['New', 'Used - Like New', 'Used - Good', 'Used - Fair', 'For Parts']
    },
    images: [{
        type: String
    }],
    isSold: {
        type: Boolean,
        default: false
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

module.exports = mongoose.model('Listing', listingSchema);
// This code defines a Mongoose schema for a Listing model in a MongoDB database.