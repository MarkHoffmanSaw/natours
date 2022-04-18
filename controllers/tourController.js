const fs = require('fs');
const Tour = require('../models/tourModel');

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

exports.getAllTours = async (req, res) => {
  // console.log(req.query); // { a:b, x:y } <<< https://../?a=b&x=y

  try {
    const queryObj = { ...req.query };
    excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]); // clear the query

    const tours = await Tour.find(queryObj);

    res.status(200).json({
      status: 'sucess',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id); // = .findOne({ _id: req.params.id })

    res.status(200).json({
      status: 'sucess',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    // const newTour = new Tour({});
    // newTour.save();

    // req.body = {...}
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'sucess',
      data: { tour: newTour },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }); // .findByIdAndUpdate( id, {row: newData}, settings )

    res.status(200).json({
      status: 'sucess',
      tour,
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: 'Invalid data sent!',
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'sucess',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};
