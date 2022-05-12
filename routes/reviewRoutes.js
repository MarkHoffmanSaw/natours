const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // for getting access ":tourId" in "tourRoutes"
// tour/...id.../reviews/ (and access to the middlewares:)

// AFTER authentication
router.use(authController.protect);

router.route('/').get(reviewController.getAllReviews).post(
  authController.protect,
  authController.restrictTo('user'), // only for 'user'
  reviewController.setTourUserIds, // set :tourId and user._id (after login)
  reviewController.createReview
);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
