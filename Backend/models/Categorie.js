const mongoose = require('mongoose');

const categorieSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Categorie', categorieSchema);
