const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  dishes: [{
  dishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plat' },
  quantity: { type: Number, required: true },
  removedIngredients: [String],   
  addedExtras: [{
  name: String,
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 }
  }]
  }],
  paymentMethod: { type: String, enum: ['cash', 'online'], required: true },
  totalPrice: { type: Number, required: true },
  orderNumber: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'cancelled','delivered'],
    default: 'pending'
  },
  isPaid: { type: Boolean, default: false },
  isVisibleToClient: { type: Boolean, default: true }, // ✅ جديد
  confirmedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
