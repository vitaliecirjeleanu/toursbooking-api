const express = require('express');

const imageUpload = require('../utils/image-upload');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    imageUpload.fields([
      { name: 'imageCover', maxCount: 1 },
      { name: 'images', maxCount: 3 },
    ]),
    tourController.createTour
  );

router.get('/:slug', tourController.getTour);
router.get(
  '/checkout-session/:tid',
  authController.protect,
  tourController.getCheckoutSession
);

router
  .route('/:slug')
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
