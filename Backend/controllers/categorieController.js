// controllers/categorieController.js
const asyncHandler = require('express-async-handler');
const Categorie = require('../models/Categorie');

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Categorie.find();
  res.json(categories);
});

const getCategorieById = asyncHandler(async (req, res) => {
  const categorie = await Categorie.findById(req.params.id);
  if (!categorie) {
    res.status(404);
    throw new Error('Catégorie non trouvée');
  }
  res.json(categorie);
});


const addCategorie = asyncHandler(async (req, res) => {
  const categorie = new Categorie(req.body);
  await categorie.save();

  // Émettre un événement socket.io
  const io = req.app.get('io');
  if (io) io.emit('categories_updated');

  res.status(201).json(categorie);
});

const updateCategorie = asyncHandler(async (req, res) => {
  const categorie = await Categorie.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!categorie) {
    res.status(404);
    throw new Error('Catégorie non trouvée');
  }

  // Émettre un événement socket.io
  const io = req.app.get('io');
  if (io) io.emit('categories_updated');

  res.json(categorie);
});

const deleteCategorie = asyncHandler(async (req, res) => {
  const categorie = await Categorie.findByIdAndDelete(req.params.id);
  if (!categorie) {
    res.status(404);
    throw new Error('Catégorie non trouvée');
  }

  // Émettre un événement socket.io
  const io = req.app.get('io');
  if (io) io.emit('categories_updated');

  res.json({ message: 'Catégorie supprimée' });
});

module.exports = {
  getAllCategories,
  addCategorie,
  getCategorieById,
  updateCategorie,
  deleteCategorie,
};
