// server/server.js

// 1. Import necessary packages
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Removed: const session = require('express-session'); // No longer using express-session
const passport = require('passport');       // Import passport
require('./config/passport');               // Load Passport configuration

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const libraryRoutes = require('./routes/library.routes');
const forumRoutes = require('./routes/forum.routes');
const collectionRoutes = require('./routes/collection.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const messageRoutes = require('./routes/message.routes');

// JWT Secret Validation at startup
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined. Please set it in your .env file.');
  process.exit(1);
}

// **START OF FIX - Session Secret Validation**
// Validate SESSION_SECRET (even if we remove express-session, it's good practice
// if it were used elsewhere or if sessions were re-enabled in future.)
if (!process.env.SESSION_SECRET) {
  console.error('WARNING: SESSION_SECRET is not defined. Session security could be weak if sessions are enabled.');
  // For a critical app, you might `process.exit(1)` here, but for development, a warning might suffice.
}
// **END OF FIX**


// Initialize Express app
const app = express();

// Apply middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // Still allow your React frontend for future (even if not running now)
  credentials: true // Keep for consistency if cookies are ever used for something else, or remove if strictly JWT
}));

// **START OF FIX - Removed Session Middleware**
// Removed: app.use(session({...}));
// Removed: app.use(passport.session());
// **END OF FIX**

app.use(passport.initialize()); // Keep passport.initialize() as it's needed for strategies


// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 7868;

app.get('/', (req, res) => {
  res.send('RetroRade Backend API is running!');
});

// Basic global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke on the server!');
});

mongoose.connect( process.env.MONGO_URI)
.then( () => {
    console.log( 'Connected to MongoDB' );
    app.listen( PORT, () => {
        console.log( `Server running on http://localhost:${PORT}` );
    });
})
.catch( (err) => {
    console.error( 'Error connecting to MongoDB:', err );
    process.exit( 1 );
});
