const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const { ensureAuthenticated } = require('../middleware/auth');

// Registration route (GET)
router.get('/register', function (req, res) {
  res.render('register', { title: 'Register' });
});

// Registration route (POST)
router.post('/register', async function (req, res) {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  // Check required fields
  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  // Check passwords match
  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      password2,
    });
  } else {
    // Validation passed
    try {
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        errors.push({ msg: 'Email is already registered' });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2,
        });
      } else {
        const newUser = new User({
          name,
          email,
          password,
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);

        // Save user to the database
        await newUser.save();

        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/auth/login');
      }
    } catch (err) {
      console.error(err);
      res.render('register', { errors: [{ msg: 'Server error' }] });
    }
  }
});

// Login Page (GET)
router.get('/login', (req, res) => {
  res.render('login');
});

// Login Handle (POST)
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/auth/dashboard',  // Redirect to dashboard on success
    failureRedirect: '/auth/login',  // Stay on login page if authentication fails
    failureFlash: true,  // Show error message if login fails
  })(req, res, next);
});

// Dashboard Route (GET) - Only for authenticated users
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  // Render dashboard and pass user info
  res.render('dashboard', { user: req.user });
});

// Logout Handle
router.get('/logout', (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/auth/login');  // Redirect to login page after logout
  });
});

// GitHub OAuth route
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// GitHub callback route
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/auth/login' }), (req, res) => {
  // Redirect to dashboard after successful authentication
  res.redirect('/auth/dashboard');
});


// Route to initiate Google authentication
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'], // Scopes for Google data
}));

// Google OAuth callback route
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to dashboard or home
    res.redirect('/dashboard');
  }
);

module.exports = router;
