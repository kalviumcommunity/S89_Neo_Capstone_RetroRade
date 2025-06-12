const express = require( 'express' );
const mongoose = require( 'mongoose' );
const dotenv = require( 'dotenv' ).config();
const cors = require( 'cors' );

const app = express();

app.use( express.json() );
app.use(cors());

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const libraryRoutes = require('./routes/library.routes');
const forumRoutes = require('./routes/forum.routes');
const collectionRoutes = require('./routes/collection.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const messageRoutes = require('./routes/message.routes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 7868;

// Basic root route for testing server
app.get('/', (req, res) => {
  res.send('RetroRade Backend API is running!');
});

// Basic global error handling middleware
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