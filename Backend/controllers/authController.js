// controllers/authController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Utilisateur non trouvé' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Mot de passe incorrect' });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

const getProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Utilisateur non authentifié');
  }
  res.json(req.user);
});

module.exports = {
  login,
  getProfile,
};
