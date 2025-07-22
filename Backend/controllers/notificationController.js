// controllers/notificationController.js
const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

const getNotifications = asyncHandler(async (req, res) => {
  const { to } = req.query;
  if (!to) {
    res.status(400);
    throw new Error('presicer "to" (kitchen أو client)');
  }

  const notifications = await Notification.find({ to }).sort({ createdAt: -1 });
  res.json(notifications);
});

const createNotification = asyncHandler(async (req, res) => {
  const { to, orderId, message } = req.body;
  if (!to || !message || !orderId) {
    return res.status(400).json({ message: '"to" et"message" et"orderId" ' });
  }

  const notification = new Notification({ to, orderId, message });
  const createdNotification = await notification.save();

  const io = req.app.get('io');
  io.emit('new_notification', createdNotification);

  res.status(201).json(createdNotification);
});


const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error('notification absent ');
  }

  notification.isRead = true;
  const updated = await notification.save();
  res.json(updated);
});

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
};
