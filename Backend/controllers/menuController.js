// controllers/menuController.js
const asyncHandler = require('express-async-handler');
const Plat = require('../models/Plat');

const getAllPlats = asyncHandler(async (req, res) => {
  const plats = await Plat.find().populate('category');
  res.json(plats);
});

// Get plats by category
const getPlatsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const plats = await Plat.find({ category: categoryId }).populate('category');
  if (!plats || plats.length === 0) {
    res.status(404);
    throw new Error('Aucun plat trouvé pour cette catégorie');
  }
  res.json(plats);
});

const addPlat = async (req, res) => {
  try {
    const { name, price, category, description, image, ingredients, extraIngredients } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }
    const plat = new Plat({
      name,
      price,
      category,
      description,
      image,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      extraIngredients: Array.isArray(extraIngredients) ? extraIngredients : [],
    });
    await plat.save();
    
    // Émettre un événement socket.io
    const io = req.app.get('io');
    if (io) io.emit('menu_updated');

    res.status(201).json(plat);
  } catch (error) {
    console.error('Erreur ajout plat:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du plat', error: error.message });
  }
};

const getPlatById = asyncHandler(async (req, res) => {
  const plat = await Plat.findById(req.params.id).populate('category');
  if (!plat) {
    res.status(404);
    throw new Error('Plat non trouvé');
  }
  res.json(plat);
});

const updatePlat = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, description, image, ingredients, extraIngredients } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }
    const plat = await Plat.findByIdAndUpdate(
      id,
      {
        name,
        price,
        category,
        description,
        image,
        ingredients: Array.isArray(ingredients) ? ingredients : [],
        extraIngredients: Array.isArray(extraIngredients) ? extraIngredients : [],
      },
      { new: true }
    );
    if (!plat) return res.status(404).json({ message: 'Plat non trouvé' });

    // Émettre un événement socket.io
    const io = req.app.get('io');
    if (io) io.emit('menu_updated');

    res.json(plat);
  } catch (error) {
    console.error('Erreur modification plat:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la modification du plat', error: error.message });
  }
};

const deletePlat = asyncHandler(async (req, res) => {
  const plat = await Plat.findByIdAndDelete(req.params.id);
  if (!plat) {
    res.status(404);
    throw new Error('Plat non trouvé');
  }

  // Émettre un événement socket.io
  const io = req.app.get('io');
  if (io) io.emit('menu_updated');
  
  res.json({ message: 'Plat supprimé' });
});

module.exports = {
  getAllPlats,
  addPlat,
  getPlatById,
  updatePlat,
  deletePlat,
  getPlatsByCategory,
};
