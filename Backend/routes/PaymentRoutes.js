const express = require('express');
const router = express.Router();
const { createCheckoutSession, stripeWebhook } = require('../controllers/PaymentController');
router.post('/create-checkout-session', createCheckoutSession);  //valider
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
module.exports = router;
