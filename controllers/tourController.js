const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage(); // saved in req.file.buffer

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    const errorMsg = new AppError('You can upload images only!', 400);
    cb(errorMsg, false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  // >>> req.files (NOT file!)
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);
  // req.files: { imageCover: [ { buffer } ], images: [ { buffer },{ buffer },{ buffer } ] }

  if (!req.files.imageCover || !req.files.images) return next();

  // 1. Create the image cover
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer) // from memoryStorage
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2. Create images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

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

// Get tours within a radius (in mi or km) of the point (lat, lng)
// ...tours/tours-within/23325/center/-40,45/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // Radius within the distance (distance / equator radius mi,km)
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng)
    return next(new AppError('Please provide the latitude and longitude'));

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

// Get distances from all tours to the point (lat,lng)
// ...tours/distances/center/-40,45/unit/mi
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; // 1 meter for mi/km

  if (!lat || !lng)
    return next(new AppError('Please provide the latitude and longitude'));

  const tours = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point', // from startLocation: {} (tourModel)
          coordinates: [+lng, +lat], //
        },
        distanceField: 'distance', // create the new row
        distanceMultiplier: multiplier, // result in meters conevrt to mi/km by multiplier
      },
    },
    {
      $project: {
        distance: 1, // show up
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: tours,
    },
  });
});
