// server/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User'); // Import your User model

// Serialize user (store user ID in session)
// This is called once a user is authenticated, to save user data into the session.
passport.serializeUser((user, done) => {
  done(null, user.id); // Save user ID to session
});

// Deserialize user (retrieve user from session)
// This is called on subsequent requests, to retrieve the user object from the session ID.
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // Attach user object to req.user
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback', // This is relative to your Express app base URL
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with Google ID
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // User exists, return the user
        done(null, user);
      } else {
        // Check if user exists with the same email but without Google ID
        // This handles cases where a user might have registered with email/password
        // and then tries to link their Google account.
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          // Link Google ID to existing user
          user.googleId = profile.id;
          await user.save();
          done(null, user);
        } else {
          // Create a new user if no existing user found by Google ID or email
          const newUser = new User({
            googleId: profile.id,
            username: profile.displayName || profile.emails[0].value.split('@')[0], // Use display name or part of email
            email: profile.emails[0].value,
            // Password will be undefined for OAuth users, which is handled by password field being optional in schema
            avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : 'default_avatar.png'
          });
          await newUser.save();
          done(null, newUser);
        }
      }
    } catch (err) {
      done(err, null);
    }
  }
));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: '/api/auth/github/callback',
    scope: ['user:email'] // Request email access
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });

      if (user) {
        done(null, user);
      } else {
        // GitHub might not always return a public email by default.
        // If email is private, profile.emails might be empty or require additional setup.
        // We prioritize the public email if available.
        const userEmail = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

        if (userEmail) {
            user = await User.findOne({ email: userEmail });
            if (user) {
              user.githubId = profile.id;
              await user.save();
              done(null, user);
            }
        }

        if (!user) { // If still no user found or created
          const newUser = new User({
            githubId: profile.id,
            username: profile.username || profile.displayName, // Use GitHub username
            email: userEmail || `${profile.username}@github.com`, // Fallback email if not provided
            avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : 'default_avatar.png'
          });
          await newUser.save();
          done(null, newUser);
        }
      }
    } catch (err) {
      done(err, null);
    }
  }
));
