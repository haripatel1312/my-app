const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
require('dotenv').config(); // To load environment variables

module.exports = function(passport) {
  
  // LocalStrategy
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, { message: 'That email is not registered' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Password incorrect' });
        }
        return done(null, user);
      } catch (err) {
        console.error(err);
        return done(err);
      }
    })
  );

  // GitHubStrategy
  passport.use(
    new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/github/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists
        let existingUser = await User.findOne({ githubId: profile.id });

        if (existingUser) {
          return done(null, existingUser);  // Existing user, log them in
        }

        // If no existing user, create a new one
        const newUser = new User({
          githubId: profile.id,
          name: profile.displayName || profile.username || profile.login,  // Use displayName, fallback to username
          email: profile.emails && profile.emails[0] ? profile.emails[0].value : 'No email',  // Handle email gracefully
        });

        await newUser.save();
        done(null, newUser);  // Log in the newly created user
      } catch (err) {
        console.error(err);
        done(err, null);
      }
    })
  );
  

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
