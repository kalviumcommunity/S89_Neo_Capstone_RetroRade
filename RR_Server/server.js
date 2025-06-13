// server/server.js

// 1. Import necessary packages
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Import path module for serving static files

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const libraryRoutes = require('./routes/library.routes');
const forumRoutes = require('./routes/forum.routes');
const collectionRoutes = require('./routes/collection.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const messageRoutes = require('./routes/message.routes'); // Uncomment if implementing messaging

// **START OF FIXES**

// 2. JWT Secret Validation at startup (Before app initialization is fine)
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined. Please set it in your .env file.');
  process.exit(1); // Exit the process if critical environment variable is missing
}

// 3. Initialize Express app - THIS MUST COME BEFORE ANY app.use() CALLS
const app = express();

// 4. Apply middleware (now placed AFTER app initialization)
app.use(express.json()); // Body parser for JSON requests
app.use(cors());         // Enable CORS for all origins (adjust for production)

// Serve static uploaded files (e.g., marketplace images)
// This makes files in server/uploads/ accessible via /uploads URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// **END OF FIXES**


// 5. Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/messages', messageRoutes); // Uncomment if implementing messaging

const PORT = process.env.PORT || 7868;

// Basic root route for testing server
app.get('/', (req, res) => {
  res.send('RetroRade Backend API is running!');
});

// Basic global error handling middleware (now correctly placed after app initialization)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke on the server!');
});

// Connect to MongoDB using Mongoose and start the server
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
