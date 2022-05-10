const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { route } = require('express/lib/router');

const router = express.Router();

// BEFORE authentication:
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// AFTER authentication:
router.use(authController.protect); // req.user.id, for each router. below (middleware)

router.patch('/updateMyPassword', authController.updatePassword);
router.get(
  '/me',
  userController.getMe, // req.params.id = req.user.id >
  userController.getUser
);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto, // multer > memoryStorage > req.file.buffer
  userController.resizeUserPhoto, // sharp(req.file.buffer)
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

// ADMIN only:
router.use(authController.restrictTo('admin')); // routes below access only for an admin

router.route('/').get(userController.getAllUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
