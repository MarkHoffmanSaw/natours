const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'The tour must have a name'],
    unique: true,
    trim: true, // delete the empty space in the beginning & end
  },
  duration: {
    type: Number,
    required: [true, 'The tour must have a duration'],
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'The tour must have a group size'],
  },
  difficulty: {
    type: String,
    required: [true, 'The tour must have a difficulty'],
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, 'The tour must have a price'],
  },
  priceDiscount: Number, // { type: Number }
  summary: {
    type: String,
    trim: true,
    required: [true, 'The tour must have a summary'],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'The tour must have a cover image'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(), // mongo auto creates a normal date format
  },
  startDates: [Date],
});

const Tour = new mongoose.model('Tour', tourSchema);
// Tour === Model

module.exports = Tour;
