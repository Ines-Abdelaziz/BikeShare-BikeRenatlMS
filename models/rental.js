const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  id: Number,
  user_id: ObjectId,
  bike_id: ObjectId,
  start_date: Date,
  end_date: Date,
  price: Number,
  status: String,
  date_created: { type: Date, default: Date.now },
  date_updated: { type: Date, default: Date.now }
});

const Rental = mongoose.model('Rental', rentalSchema);

module.exports = Rental;
