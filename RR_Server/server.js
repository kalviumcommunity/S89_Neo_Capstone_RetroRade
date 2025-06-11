const express = require( 'express' );
const mongoose = require( 'mongoose' );
const dotenv = require( 'dotenv' ).config();

const app = express();

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