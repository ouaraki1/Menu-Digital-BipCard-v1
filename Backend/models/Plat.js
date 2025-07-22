const mongoose = require('mongoose');

const platSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Categorie', required: true },
  description: { type: String },
  image: { type: String },
  ingredients: [String],
  extraIngredients: [
    {
      name: String,
      price: Number
    }
  ]
});

module.exports = mongoose.model('Plat', platSchema);
