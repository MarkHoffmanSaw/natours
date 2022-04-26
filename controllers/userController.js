const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  // Send response
  res.status(200).json({
    status: 'sucess',
    results: users.length,
    data: {
      users,
    },
  });
});

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

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route has not defined yet',
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route has not defined yet',
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route has not defined yet',
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route has not defined yet',
  });
};
