const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');

// -- Creating a token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// -- Sending a token in the res
const createSendToken = (user, status, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === 'production' ? true : false,
    httpOnly: true,
  };

  res.cookie('jwt', token, cookieOptions);

  res.status(status).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// -- Getting the token for a new user
// POST
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    // don't use { req.body } for protecting!
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  createSendToken(newUser, 201, res);
});

// -- Getting the token for an existing user
// POST
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Checking if email & pass exist
  if (!email || !password)
    return next(new AppError('Please enter the email and password!', 400));

  // 2. Checking if the user exists and the password is correct
  const user = await User.findOne({ email }).select('+password'); // show up the pass

  // from userSchema.methods.correctPassword(pass,encrypted) (return true/false)
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Not correct email or password', 401));

  // 3. If everything is ok, send token to the client
  createSendToken(user, 200, res);
});

// -- Access to the data (tours) for an auth. user
// GET
exports.protect = catchAsync(async (req, res, next) => {
  // 1. Getting token and checking if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token)
    return next(
      new AppError("You haven't got the access. Please log in!", 401)
    );

  // 2. Verification token
  // Was token created by using the secret key? Decoding
  // return { id: ..., iat: ..., exp: ... }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // next step or error

  // 3. Checking if an user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(
      new AppError('The user belonging to this token does no longer exist'),
      401
    );

  // 4. Check if a user changed the password after the token was issued
  // iat: X ms
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError(
        'User recently changed the password! Please log in again',
        401
      )
    );

  // 5. Only after implemetnation steps above w/o errors:
  req.user = currentUser; // using in the next middleware
  next();
});

// DELETE (tours for "admin", "lead-guide")
exports.restrictTo = (...roles) => {
  // Closure: access to params from router.delete(mid1,mid2,mid3)
  return (req, res, next) => {
    // req.user from 'protect'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have a permission to do this action", 403)
      );
    }
    next(); // restrictTo()()
  };
};

// POST
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get a user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError('There is no user with that email adress', 404));

  // 2. Generate the random reset token
  const resetToken = user.createPasswordResetToken(); // get the original token, encoded - in the DB
  user.save({ validateBeforeSave: false }); // save it and turn off all request validators before .save()

  // 3. Send it to the user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Did you forget a password? Follow the link: ${resetURL} and get the new one.
  If you didn't forget your password, please ignore this message`;

  // * using try-catch in order to handle sending errors
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res
      .status(200)
      .json({ status: 'sucess', message: 'The token was sent to the email' });
  } catch (err) {
    // If it's error, then delete the token:
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

// PATCH
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get a user based on the token
  // Encryption:
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token) // original token from the email
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // old date + 10 min > Date.now()
  });

  // 2. If the token hasn't expired and there is a user, set the new password
  if (!user) {
    return next(new AppError('The token is invalid or has expired', 400));
  }

  user.password = req.body.password; // new one
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // now we need validators

  // 3. Update 'changePasswordAt' for the user
  // in the userModel middleware

  // 4. Log the user in, send JWT
  createSendToken(user, 200, res); // sometimes creating JWT faster than .save()
});

// PATCH
// req.body: { curr: ... , pass: .... , confirm: ... }
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get a user from the collection
  const user = await User.findById(req.user.id).select('+password'); // req.user.id - from the protect middleware

  // 2. Check if the POSTed current pass is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError("The current password isn't correct"));

  // 3. If it's correct, update the pass
  user.password = req.body.password; // new
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate - wouldn't work: validation(create and save only) & .pre('save')

  // 4. Log the user in, send JWT
  createSendToken(user, 200, res);
});
