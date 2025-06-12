const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const forumReplySchema = new Schema({
    post: {
        type: Schema.Types.ObjectId,
        ref: 'ForumPost',
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ForumReply', forumReplySchema);
// This code defines a Mongoose schema for a ForumReply model in a MongoDB database.