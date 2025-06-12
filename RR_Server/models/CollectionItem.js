const mongoose = require('mongoose');
const { collection } = require('./User');
const Schema = mongoose.Schema;

const collectionItemSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    itemType: {
        type: String,
        required: true,
        enum: ['library', 'forum', 'marketplace']
    },
    itemId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    savedAt: {
        type: Date,
        default: Date.now
    }
});

collectionItemSchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true });

module.exports = mongoose.model('CollectionItem', collectionItemSchema);
// This code defines a Mongoose schema for a CollectionItem model in a MongoDB database.