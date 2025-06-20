// server/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User'); // Import your User model

// **START OF FIX - Removed Session-related functions**
// Removed: passport.serializeUser((user, done) => { ... });
// Removed: passport.deserializeUser(async (id, done) => { ... });
// **END OF FIX**

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        done(null, user);
      } else {
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          user.googleId = profile.id;
          await user.save();
          done(null, user);
        } else {
          const newUser = new User({
            googleId: profile.id,
            username: profile.displayName || profile.emails[0].value.split('@')[0],
            email: profile.emails[0].value,
            // Password will be undefined for OAuth users, which is handled by password field being optional in schema
            avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : 'default_avatar.png'
          });
          await newUser.save();
          done(null, newUser);
        }
      }
    } catch (err) {
      console.error('Error during Google OAuth:', err.message);
      done(err, null);
    }
  }
));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: '/api/auth/github/callback',
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });

      if (user) {
        done(null, user);
      } else {
        const userEmail = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

        if (userEmail) {
            user = await User.findOne({ email: userEmail });
            if (user) {
              user.githubId = profile.id;
              await user.save();
              return done(null, user);
            }
        }

        const newUserData = {
          githubId: profile.id,
          username: profile.username || profile.displayName,
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : 'default_avatar.png'
        };

        if (userEmail) {
          newUserData.email = userEmail;
        } else {
          console.warn(`GitHub user ${profile.username} did not provide a public email. Email field will be empty.`);
        }

        const newUser = new User(newUserData);
        await newUser.save();
        done(null, newUser);
      }
    } catch (err) {
      console.error('Error during GitHub OAuth:', err.message);
      done(err, null);
    }
  }
));
