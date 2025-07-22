const express = require('express');
const router = express.Router();

const {
  getAllOrders,
  addOrder,
  updateOrderStatus,
  confirmOrder,
  cancelOrder,
  confirmPayment, 
} = require('../controllers/orderController');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, authorizeRoles('admin', 'kitchen', 'client'), getAllOrders)   //modifier des condition dans la partier client
router.post('/', protect, authorizeRoles('client'), addOrder); // valider
router.put('/:id/pay', protect, authorizeRoles('admin'), confirmPayment); //valider

router.route('/:id')
  .put(protect, authorizeRoles('admin', 'kitchen'), updateOrderStatus);  // valider

router.post('/:id/confirm', protect, authorizeRoles('client', 'admin'), confirmOrder); // valider
router.post('/:id/cancel', protect, authorizeRoles('client', 'admin'), cancelOrder);   // valider

module.exports = router;
