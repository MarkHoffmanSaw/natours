const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. Get tours from the collection
  const tours = await Tour.find();

  // 2. Build a template: tour.pug
  // 3. Render recieved tours
  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1. Get the data (requested tour), including reviews and guides (populate)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  // 2. Build a template
  // 3. Render the recieved tour
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});
