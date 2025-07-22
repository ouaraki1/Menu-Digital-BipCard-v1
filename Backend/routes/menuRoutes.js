
const express = require('express');
const router = express.Router();
const {
  getAllPlats,
  addPlat,
  getPlatById,
  updatePlat,
  deletePlat,
  getPlatsByCategory, // 👈 أضف هذا

} = require('../controllers/menuController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.route('/')
  .get(getAllPlats) //valider
  .post(protect, authorizeRoles('admin'), addPlat);  //valider

router.route('/:id')
  .get(getPlatById) //valider
  .put(protect, authorizeRoles('admin'), updatePlat) //valider
  .delete(protect, authorizeRoles('admin'), deletePlat); //valider

router.get('/category/:categoryId', getPlatsByCategory); // 👈 أضف هذا
module.exports = router;
