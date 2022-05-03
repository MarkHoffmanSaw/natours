const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeauters');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'sucess',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }); // .findByIdAndUpdate( id, {row: newData}, settings )

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'sucess',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const newTour = new Tour({});
    // newTour.save();
    // req.body = {...} -> send to the server (db)
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'sucess',
      data: { data: doc },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = await Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions); // 'reviews'

    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404)); // change the ID in the GET request
    }

    res.status(200).json({
      status: 'sucess',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (small hack)
    const filter = {};
    if (req.params.tourId) filter.tour = req.params.tourId;

    // Execute query
    // http://...?duration[gte]=5&...
    // req.query: { duration: { gte: '5' }, ... }
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query; // .explain() - for showing perfomance (examinedDocs) w/ indexes;

    // Send response
    res.status(200).json({
      status: 'sucess',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
