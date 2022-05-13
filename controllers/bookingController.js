const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');

const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. Get the current booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2. Create a checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`, // >>> req.query: {tour,user,price}
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
        ],
        amount: tour.price * 100, // cents
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  // 3) Create the session as a response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// viewsRoutes:
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query;
//   if (!tour && !user && !price) return next();
//   await Booking.create({ tour, user, price });
//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async (session) => {
  // From the session which we have got (res session from stripe events)
  const tour = session.client_reference_id;
  const user = await User.findOne({ email: session.customer_email });
  const price = session.display_items[0].amount / 100;

  // Create a booking
  await Booking.create({ tour, user, price });
};

// Stripe webhook - for app.js (/webhook-checkout)
// Using after success_url as a middleware to add a new Booking
exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    // Create a stripe event
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // In webhook settings (listening for)
  if (event.type === 'checkout.session.completed')
    // event.data.object === session
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

// CRUD:
exports.createBooking = factory.createOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
