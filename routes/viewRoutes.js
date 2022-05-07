const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

// isLoggedIn:
router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);

// logged in:
router.get('/me', authController.protect, viewsController.getAccount);

// Upd without API
// router.post(
//   '/submit-user-data',
//   authController.protect,
//   viewsController.updateUserData
// );

// Needs to complete:
// router.get('/signup', viewsController.getSignupForm);

module.exports = router;
