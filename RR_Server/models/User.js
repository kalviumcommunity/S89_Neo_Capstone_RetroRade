const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: false,
        minlength: 8
    },

    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows for unique constraint to be applied only if the field is present
    },

    githubId: {
        type: String,
        unique: true,
        sparse: true // Allows for unique constraint to be applied only if the field is present
    },

    bio: {
        type: String,
        default: '',
    },
    avatar: {
        type: String,
        default: 'https://www.shutterstock.com/image-vector/default-avatar-photo-placeholder-grey-600nw-2007531536.jpg' // Placeholder URL for default avatar
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
// This code defines a Mongoose schema for a User model in a MongoDB database.