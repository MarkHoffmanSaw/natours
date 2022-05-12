const mongoose = require('mongoose');
const Tour = require('../models/tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, 'The review cannot be empty'] },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'The review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'The review must belong to an user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Same user can write a review for the tour ONCE TIME
// Unique keys for the fields:
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// It depends on how your app works (how many populates):
reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name',
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo',
  //   });
  
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// -- Сreate Review > Set new rating for Tour

// A Static Function makes the group by tour id
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this === Review
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // stats: [ { _id,nRating,avgRating } ]
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// Call the F. after .create & .save a document
// .statics (static) is used by Model only
reviewSchema.post('save', function () {
  // this.constructor === Review (Model)
  this.constructor.calcAverageRatings(this.tour);
});

// -- Update/Delete Review > Set new rating for Tour

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // since 2021 mongoose does not make a query twice
  // 2 queries: 1 - from update, 2 - from here
  // .clone() - to clone the query and re-execute it
  this.r = await this.findOne().clone(); // { ..., tour: ObjectId(), ... }
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // this.r.constructor === Review.prototype
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = new mongoose.model('Review', reviewSchema);

module.exports = Review;
