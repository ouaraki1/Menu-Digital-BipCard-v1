// test automatiquemet pour a jour debut en 1 par exemple : le nbr 99 et le dernier nbr dans le jour 13 juin et demain 14 juin a  debut au 1
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
