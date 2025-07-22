const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  to: { 
    type: String, 
    enum: ['kitchen', 'client', 'admin'], 
    required: true 
  },
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  message: { 
    type: String, 
    required: true, 
    trim: true 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
