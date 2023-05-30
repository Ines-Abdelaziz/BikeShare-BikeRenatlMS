const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  type: String,
  price: Number,
  location: String,
  status: String,
  date_created: { type: Date, default: Date.now },
  date_updated: { type: Date, default: Date.now }
});

const Bike = mongoose.model('Bike', bikeSchema);

module.exports = Bike;
