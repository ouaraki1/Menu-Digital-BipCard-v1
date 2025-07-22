// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');



const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role === 'client') {
        req.user = {
          role: 'client',
          roomId: decoded.roomId
        };
        return next();
      }

      req.user = await User.findById(decoded.userId).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
  } else {
    return res.status(401).json({ message: 'Non autorisé, token manquant' });
  }
});

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé : rôle non autorisé' });
    }
    next();
  };
};



module.exports = { protect, authorizeRoles };
