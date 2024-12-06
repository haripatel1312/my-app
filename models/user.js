const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  githubId: {
    type: String, // GitHub ID to identify the user
  },
  avatar: {
    type: String, // GitHub avatar URL
  },
});

module.exports = mongoose.model('User', UserSchema);
