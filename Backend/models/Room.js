const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  num: {
    type: String, 
    required: true,
    unique: true, 
  },
  accessCode: { type: String, required: true },

  location: {
    type: String,
    required: true,
  }, 
  capacity: {
    type: Number,
  },
  description: { 
    type: String,
    default: '',
  },
}, {
  timestamps: true, 
});

module.exports = mongoose.model('Room', roomSchema);
