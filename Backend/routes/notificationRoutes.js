const express = require('express');
const router = express.Router();
const {
  getNotifications,
  createNotification,
  markAsRead,
} = require('../controllers/notificationController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/', protect, authorizeRoles('admin', 'kitchen'), getNotifications);
router.post('/', protect, authorizeRoles('admin', 'kitchen'), createNotification);
router.put('/:id/read', protect, authorizeRoles('admin', 'kitchen'), markAsRead);

module.exports = router;
