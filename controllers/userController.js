const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('../controllers/handlerFactory');
const req = require('express/lib/request');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create an error if user POSTs the password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route isn't for updating the password. Use /updateMyPassword",
        400
      )
    );
  }

  // 2. Filter req.body w/ only allowed fieilds
  const filteredBody = filterObj(req.body, 'name', 'email'); // ( _ , ...allowedFields )

  // 3. Update the user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // change old > new
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// Delete user by himself (deactivate)
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Middleware for getUser using /me route
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id; // from .protect
  next();
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

// Don't change the password using this method! Use .updateMe
// Only for an admin!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
