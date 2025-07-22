// controllers/roomController.js
const asyncHandler = require("express-async-handler");
const Room = require("../models/Room");
const jwt = require("jsonwebtoken");

const generateCode = () =>
  Math.random().toString(36).substring(2, 6).toUpperCase() +
  "-" +
  Math.random().toString(36).substring(2, 6).toUpperCase();

const addRoom = asyncHandler(async (req, res) => {
  const { num, location, capacity, description } = req.body;

  if (!num || !location || !capacity) {
    res.status(400);
    throw new Error("يرجى ملء جميع الحقول الإلزامية: num, location, capacity");
  }

  const exists = await Room.findOne({ num });
  if (exists) {
    res.status(400);
    throw new Error("رقم الغرفة موجود مسبقًا");
  }

  const accessCode = generateCode();

  const room = await Room.create({
    num,
    location,
    capacity,
    description,
    accessCode,
  });

  res.status(201).json(room);
});

const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndDelete(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error("الغرفة غير موجودة");
  }
  res.json({ message: "تم حذف الغرفة" });
});

const getAllRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find();
  res.json(rooms);
});

const getRoomIdByNum = asyncHandler(async (req, res) => {
  const num = req.params.num;
  const code = req.query.code;

  const room = await Room.findOne({ num });
  if (!room) return res.status(404).json({ message: "الغرفة غير موجودة" });

  if (room.accessCode !== code) {
    return res.status(403).json({ message: "رمز الدخول غير صحيح" });
  }

  res.json({ roomId: room._id });
});
const authenticateRoom = asyncHandler(async (req, res) => {
  const { num, code } = req.body;

  const room = await Room.findOne({ num });
  if (!room) {
    return res.status(404).json({ message: "الغرفة غير موجودة" });
  }

  if (room.accessCode !== code) {
    return res.status(403).json({ message: "رمز الدخول غير صحيح" });
  }

  const token = jwt.sign(
    {
      role: "client",
      roomId: room._id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" } 
  );

  res.json({ token });
});

module.exports = {
  addRoom,
  deleteRoom,
  getAllRooms,
  getRoomIdByNum,
  authenticateRoom,
};