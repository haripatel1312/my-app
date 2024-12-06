const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Email address from the .env file
    pass: process.env.EMAIL_PASS, // App password from the .env file
  },
});

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
