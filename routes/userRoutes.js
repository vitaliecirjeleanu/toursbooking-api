const express = require('express');

const imageUpload = require('../utils/image-upload');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', imageUpload.single('image'), authController.signup);
router.post('/login', authController.login);

router.get('/:uid', authController.protect, userController.getUser);
router.patch(
  '/updateMe',
  authController.protect,
  imageUpload.single('image'),
  userController.updateMe
);
router.patch(
  '/changePassword',
  authController.protect,
  authController.changePassword
);

router.patch(
  '/closeAccount',
  authController.protect,
  userController.closeMyAccount
);

// just for admin
router.get(
  '/',
  authController.protect,
  authController.restrictTo('admin'),
  userController.getAllUsers
);
router.post(
  '/',
  authController.protect,
  authController.restrictTo('admin'),
  userController.createUser
);
router.delete(
  '/:uid',
  authController.protect,
  authController.restrictTo('admin'),
  userController.deleteUser
);

module.exports = router;
