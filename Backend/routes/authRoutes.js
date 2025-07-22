// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { login, getProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const rateLimit = require('express-rate-limit');

// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, 
//   max: 5, 
//   message: 'تم تجاوز الحد الأقصى لمحاولات الدخول، يرجى المحاولة لاحقًا',
// });
router.post('/login', login); //valider
router.get('/profile', protect, getProfile); 

module.exports = router;
