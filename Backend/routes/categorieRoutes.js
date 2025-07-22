// routes/categorieRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  addCategorie,
  getCategorieById,
  updateCategorie,
  deleteCategorie,
} = require('../controllers/categorieController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

router.route('/')
  .get(getAllCategories) //valider
  .post(protect, authorizeRoles('admin'), addCategorie); //valider

router.route('/:id')
  .get(getCategorieById) //valider
  .put(protect, authorizeRoles('admin'), updateCategorie) //valider
  .delete(protect, authorizeRoles('admin'), deleteCategorie); //valider

module.exports = router;
