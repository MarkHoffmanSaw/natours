class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'failed' : 'error';
    this.isOperational = true;

    // Show app all errors (in order of occurrence), beginning w/ constructor funсtion
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError; // to tourController, authController
