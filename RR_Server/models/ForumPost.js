const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const forumPostSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],

    images: [{ 
        type: String 
    }],

    replies: [{
        type: Schema.Types.ObjectId,
        ref: 'ForumReply'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ForumPost', forumPostSchema);
// This code defines a Mongoose schema for a ForumPost model in a MongoDB database.