const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDublicateFieldsDB = (err) => {
  const value = err.keyValue.name;
  const message = `Duplicate field value: "${value}". Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid data: ${errors.join('. ')}`;

  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token! Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again', 401);

// Development errors
const sendErrDev = (err, req, res) => {
  // -- Requests to the API (BACK)
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // -- Working with a website (FRONT)
  console.error('ERROR', err);
  return res
    .status(err.statusCode)
    .render('error', { title: 'Something went wrong...', msg: err.message });
};

// Production errors
const sendErrProd = (err, req, res) => {
  // -- Requests to the API (BACK)
  if (req.originalUrl.startsWith('/api')) {
    // - Operational (AppError), trusted error: send message to the client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // - Programming or other uknowing error: don't leak error details
    // 1. Log the error
    console.error('ERROR', err);
    // 2. Send the message
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }

  // -- Working with a website (FRONT)
  // - Operational (AppError), trusted error: send message to the client
  if (err.isOperational) {
    console.log(err.message);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  // - Programming or other uknowing error: don't leak error details
  // 1. Log the error
  console.error('ERROR', err);
  // 2. Send the message
  return res.status(500).render('error', {
    title: 'Something went wrong...',
    msg: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack); // where the err happend

  err.status = err.status || 'failed';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Error from 'mongoose':
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDublicateFieldsDB(error); // or: err.name === 'MongoServerError'
    if (err._message === 'Validation failed')
      error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrProd(error, req, res);
  }
};

// export to app.js as "globalErrorHandler"
