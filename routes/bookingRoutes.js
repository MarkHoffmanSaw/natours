const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession
);

router.get('/', bookingController.getAllBookings);
router.get('/:id', bookingController.getOneBooking);

module.exports = router;
