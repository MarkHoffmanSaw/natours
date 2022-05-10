const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('../controllers/handlerFactory');

// -- Upload a photo
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
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

// Image middleware 1:
exports.uploadUserPhoto = upload.single('photo'); // the field

// Image middleware 2:
exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer) // from memoryStorage
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`); // destination

  next();
};

// -- Filter from restrictTo
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

// Middleware after img's middlewares
exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);

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
  // check for updating the photo:
  if (req.file) filteredBody.photo = req.file.filename;

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
