const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. Get the current booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2. Create a checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`http://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100, // cents
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  // 3. Redirect to the session and then success/cancel
  res.redirect(303, session.url);
  //   res.status(200).json({ status: 'success', session });
});
