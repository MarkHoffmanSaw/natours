// const AppError = require('../utils/appError');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' }); // (Model, populateOptions) or just 'reviews'
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// Mongoose .aggregate() methods
exports.getTourStats = catchAsync(async (req, res, next) => {
  // Model.prototype.aggregate([ {$match}, {$group}, {$sort} ])
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // grouping by _id
        _id: { $toUpper: '$difficulty' }, // each one below only relates to the "value" of "difficulty"
        numTours: { $sum: 1 }, // auto increments
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'sucess',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = +req.params.year; // 2021 (or another)

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', // desctructuring an array and return _id-times w/ the each element [a,b,c] -> a,b,c
    },
    {
      $match: {
        // by property:
        startDates: {
          // only 2021 year
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }, // creating an array of (startDates -> names)
      },
    },
    {
      $addFields: { month: '$_id' }, // create a new field w/ the current value
    },
    {
      $project: { _id: 0 }, // 0 - not show up / 1 - show up the _id
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12, // el-s per page
    },
  ]);

  res.status(200).json({
    status: 'sucess',
    data: {
      plan,
    },
  });
});
