const mongoose = require('mongoose');

const creditCardSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  idUser: String,
  number: String,
  expiringDate: String
});

const CreditCard = mongoose.model('CreditCard', creditCardSchema);

module.exports = CreditCard;
