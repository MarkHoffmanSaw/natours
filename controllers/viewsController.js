const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. Get tours from the collection
  const tours = await Tour.find();

  // 2. Build a template: overview.pug

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

  if (!tour) return next(new AppError('There is no tour with that name', 404));

  // 2. Build a template: tour.pug

  // 3. Render the recieved tour
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Create an account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'My account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1. Find all bookings for the current user
  const bookings = await Booking.find({ user: req.user.id }); // [{user,tour},{...},{...}]

  // 2. Return ids of tours from bookings and search each tour in db
  const tourIds = bookings.map((el) => el.tour); // [tourId,tourId,tourId]
  const tours = await Tour.find({ _id: { $in: tourIds } }); // in = search each one

  res.status(200).render('overview', {
    title: 'My tours',
    tours,
  });
});

// Upd without an API
// exports.updateUserData = catchAsync(async (req, res, next) => {
//   const updatedUser = await User.findByIdAndUpdate(
//     req.user.id,
//     {
//       name: req.body.name,
//       email: req.body.email,
//     },
//     { new: true, runValidators: true }
//   );

//   res.status(200).render('account', {
//     title: 'My account',
//     user: updatedUser,
//   });
// });
