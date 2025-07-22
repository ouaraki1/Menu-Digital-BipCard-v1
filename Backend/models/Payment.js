const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  stripePaymentIntentId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'mad' },
  paymentMethod: { type: String, enum: ['card', 'paypal', 'applepay', 'other'], default: 'card' },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  transactionDate: { type: Date, default: Date.now },
  errorMessage: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);