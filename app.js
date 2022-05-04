const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// Settings for .pug templates
// npm i pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1. Global middlewares:

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Setting security http headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // REST DIR STATUS TIME - SIZE
}

// Limit for req/ms from the same IP
const limiter = rateLimit({
  // 100 req/hour:
  max: 100, // requests
  windowMs: 1000 * 60 * 60, // time in MS
  message: 'Too many requests from this IP. Try again later',
});
app.use('/api', limiter);

// Body parser,reading data from body into req.body
// {} - options
app.use(express.json({ limit: '10kb' })); // max-size req.body

// Data sanitization against NoSQL query injectioin:
// Login: req.body: { "email": { "$gt": "" }, "pass": "pass1234" } - it will run w/o a defender!
app.use(mongoSanitize());

// Data sanitization against XSS (Cross Site Scripting)
// Converting html code in req.body to String (symbols)
app.use(xss());

// Preventing parameter pollution (from duplicate)
// ...?sort=...&sort=... (it will be used the last one). Correct: ?sort=a,b,c
// { whitelist:[] } - not default criterias, for example 'duration' (tours)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsAverage',
      'price',
      'difficulty',
      'maxGroupSize',
    ],
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// 2. Routes

app.use('/', viewRouter); // using .pug (settings above)
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find '${req.originalUrl}' in the server`, 404));
});

app.use(globalErrorHandler); // errorController

module.exports = app;
