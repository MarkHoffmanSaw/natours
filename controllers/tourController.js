const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeauters');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Checking the ID middleware (not necessary at the DB)
/*exports.checkID = (req, res, next, val) => {
  // val === 'id'
  console.log(`The tour id is: ${val}`);
  if (+req.params.id > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  next();
};*/

// Checking the body manually
/* exports.checkBody = (req, res, next) => {
  // don't write the 4 parameter unless going to use it in the function
  if (!req.body.name || !req.body.price) {
    return res
      .status(400)
      .json({ status: 'failed', message: 'Missing name or price' });
  }
  next();
}; */

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // Execute query
  // http://...?duration[gte]=5&...
  // req.query: { duration: { gte: '5' }, ... }
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  // Send response
  res.status(200).json({
    status: 'sucess',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id); // = .findOne({ _id: req.params.id })

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404)); // change the ID in the GET request
  }

  res.status(200).json({
    status: 'sucess',
    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  // const newTour = new Tour({});
  // newTour.save();

  // req.body = {...} -> send to the server (db)
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'sucess',
    data: { tour: newTour },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }); // .findByIdAndUpdate( id, {row: newData}, settings )

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'sucess',
    tour,
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(204).json({
    status: 'sucess',
    data: null,
  });
});

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
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'sucess',
    data: {
      plan,
    },
  });
});
