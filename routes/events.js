const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Event = require('../models/event');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // App password
  },
});


// Dashboard Route (GET)
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const events = await Event.find({ user: req.user.id }).sort({ date: -1 });
    res.render('dashboard', { user: req.user, events });
  } catch (err) {
    console.error("Error fetching events for dashboard:", err);
    req.flash('error_msg', 'Error fetching events. Please try again.');
    res.redirect('/');
  }
});

// Create Event Route (GET)
router.get('/create', ensureAuthenticated, (req, res) => {
  res.render('events/create');
});

// Create Event Route (POST)
router.post('/create', ensureAuthenticated, async (req, res) => {
  const { name, date, location, description } = req.body;

  // Validate the input
  if (!name || !date || !location) {
    req.flash('error_msg', 'All fields are required.');
    return res.redirect('/events/create');
  }

  try {
    // Create the new event
    const newEvent = new Event({
      user: req.user.id,
      name,
      date,
      location,
      description,
    });

    await newEvent.save();
    
    // Send Success message
    req.flash('success_msg', 'Event created successfully! An email notification has been sent.');

    // Send Email Notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: req.user.email,
      subject: 'New Event Created!',
      text: `You have created a new event: ${name} on ${date}. Location: ${location}.`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.redirect('/events');
  } catch (err) {
    console.error("Error creating event:", err);
    req.flash('error_msg', 'Something went wrong. Please try again.');
    res.redirect('/events/create');
  }
});




// View All Events (GET)
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const events = await Event.find({ user: req.user.id }).sort({ date: -1 });
    res.render('events/index', { events });
  } catch (err) {
    console.error("Error fetching all events:", err);
    req.flash('error_msg', 'Error fetching events.');
    res.redirect('/dashboard');
  }
});

// View Single Event (GET)
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.user.toString() !== req.user.id) {
      req.flash('error_msg', 'Event not found or unauthorized access.');
      return res.redirect('/events');
    }
    res.render('events/show', { event });
  } catch (err) {
    console.error("Error fetching event details:", err);
    req.flash('error_msg', 'Error fetching event.');
    res.redirect('/events');
  }
});

// Edit Event Route (GET)
router.get('/:id/edit', ensureAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.user.toString() !== req.user.id) {
      req.flash('error_msg', 'Unauthorized access.');
      return res.redirect('/events');
    }
    res.render('events/edit', { event });
  } catch (err) {
    console.error("Error fetching event for editing:", err);
    req.flash('error_msg', 'Error fetching event.');
    res.redirect('/events');
  }
});

router.post('/:id/edit', ensureAuthenticated, async (req, res) => {
  const { name, date, location, description } = req.body;

  // Basic validation
  if (!name || !date || !location) {
    req.flash('error_msg', 'All fields (Name, Date, Location) are required.');
    return res.redirect(`/events/${req.params.id}/edit`);
  }

  try {
    // Find the event by ID
    const event = await Event.findById(req.params.id);

    // Check if the event exists and the user is authorized to edit it
    if (!event) {
      req.flash('error_msg', 'Event not found.');
      return res.redirect('/events');
    }

    if (event.user.toString() !== req.user.id) {
      req.flash('error_msg', 'Unauthorized access.');
      return res.redirect('/events');
    }

    // Update event fields
    event.name = name;
    event.date = new Date(date); // Ensure the date is valid
    event.location = location;
    event.description = description || ''; // Optional field

    await event.save();

    // Optional: Send email notification after updating the event
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: req.user.email, // Assuming req.user contains the user's email
      subject: 'Event Updated Successfully',
      text: `Your event "${name}" has been updated successfully.\n\nDate: ${date}\nLocation: ${location}\n\nDescription:\n${description}`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    // Flash success message and redirect
    req.flash('success_msg', 'Event updated successfully.');
    res.redirect('/events');
  } catch (err) {
    console.error("Error updating event:", err);
    req.flash('error_msg', 'Error updating event. Please try again.');
    res.redirect(`/events/${req.params.id}/edit`);
  }
});


// Delete Event Route (POST)
router.post('/:id/delete', ensureAuthenticated, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event || event.user.toString() !== req.user.id) {
      req.flash('error_msg', 'Unauthorized access.');
      return res.redirect('/events');
    }

    await event.deleteOne();
    req.flash('success_msg', 'Event deleted successfully.');
    res.redirect('/events');
  } catch (err) {
    console.error("Error deleting event:", err);
    req.flash('error_msg', 'Error deleting event.');
    res.redirect('/events');
  }
});

module.exports = router;
