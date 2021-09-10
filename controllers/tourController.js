const { strictEqual } = require('assert');
const fs = require('fs');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const filterObject = require('../utils/filterObject');

exports.getAllTours = async (req, res, next) => {
  let tours;

  try {
    tours = await Tour.find();

    if (!tours) {
      return next(new AppError('Getting the tours failed.', 500));
    }
  } catch (err) {
    return next(err);
  }

  res.json({
    status: 'success',
    quantity: tours.length,
    tours,
  });
};

exports.getTour = async (req, res, next) => {
  const slug = req.params.slug;
  let tour;

  try {
    tour = await Tour.findOne({ slug: slug });

    if (!tour) {
      return next(new AppError('No tour found with this slug', 404));
    }
  } catch (err) {
    return next(err);
  }

  res.json({
    status: 'success',
    tour,
  });
};

exports.createTour = async (req, res, next) => {
  const {
    name,
    duration,
    maxPeople,
    price,
    difficulty,
    summary,
    startDates,
    guides,
    locationsAddress,
    description,
  } = req.body;

  // converting the dates, guides and locationsAddress data to array if they are not
  const descriptionParagraphs = description.split('\n');
  let startDatesArray = startDates;
  let guidesArray = guides;
  let locationsAddressArray = locationsAddress;

  if (!Array.isArray(startDates)) startDatesArray = [startDates];
  if (!Array.isArray(guides)) guidesArray = [guides];
  if (!Array.isArray(locationsAddress))
    locationsAddressArray = [locationsAddress];

  //getting the start date from startDates array in the right format
  startDatesArray.forEach(date => {
    if (!date.includes('/'))
      return next(
        new AppError(
          'Wrong date format. Please use this format: dd/mm/yyyy',
          500
        )
      );
  });
  const euFormatTxt = startDatesArray[0].split('/').reverse().join();
  const nextStartDate = new Date(euFormatTxt).toLocaleString('en-EU', {
    year: 'numeric',
    month: 'long',
  });

  //getting the start location and days from locations address array
  const startLocation = locationsAddressArray[0].split(',').slice(1).join(', ');

  const days = locationsAddressArray.map(
    (address, i) => `Day ${i + 1}: ${address.split(',')[0]}`
  );

  const guidesId = [];
  try {
    for (const name of guidesArray) {
      const user = await User.findOne({ name: name });
      if (!user || user.role === 'admin' || user.role === 'user') {
        return next(
          new AppError(
            'All guides must be from our company. Please check the guides names.',
            500
          )
        );
      }
      guidesId.push(user._id);
    }
  } catch (err) {
    return next(err);
  }

  let tour;
  try {
    tour = await Tour.create({
      name,
      duration,
      maxPeople,
      price,
      difficulty,
      summary,
      startDates: startDatesArray,
      guides: guidesId,
      locationsAddress: locationsAddressArray,
      description: descriptionParagraphs,
      imageCover: req.files.imageCover[0].path,
      images: req.files.images.map(image => image.path),
      creator: req.user._id,
      nextStartDate,
      startLocation,
      days,
    });

    if (!tour) {
      return next(
        new AppError('Creating an tour failed. Please try again', 500)
      );
    }
  } catch (err) {
    return next(err);
  }

  res.status(201).json({
    status: 'success',
    tour,
  });
};

exports.updateTour = async (req, res, next) => {
  const slug = req.params.slug;
  const filteredBody = filterObject(
    req.body,
    'summary',
    'difficulty',
    'price',
    'duration',
    'maxPeople'
  );
  let updatedTour;

  try {
    updatedTour = await Tour.findOneAndUpdate({ slug: slug }, filteredBody, {
      new: true,
    });
    if (!updatedTour) {
      return next(new AppError('This tour is not found.', 404));
    }
  } catch (err) {
    return next(
      new AppError('Updating the tour failed. Please try again'),
      500
    );
  }

  res.json({
    status: 'success',
    tour: updatedTour,
  });
};

exports.deleteTour = async (req, res, next) => {
  const slug = req.params.slug;

  try {
    const tour = await Tour.findOneAndDelete({ slug: slug }).select(
      'imageCover images'
    );

    if (!tour) {
      return next(new AppError('This tour is not found.', 404));
    }

    const tourImagesPaths = [tour.imageCover, ...tour.images];
    tourImagesPaths.forEach(path => fs.unlink(path, err => console.error(err)));
  } catch (err) {
    return next(err);
  }

  res.json({ status: 'success', message: 'Place deleted successfully!' });
};

// tour book session

exports.getCheckoutSession = async (req, res, next) => {
  let session;
  try {
    const tour = await Tour.findById(req.params.tid);

    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      success_url: process.env.CLIENT_URL,
      cancel_url: `${process.env.CLIENT_URL}/tour/${tour.slug}`,
      mode: 'payment',
      customer_email: req.user.email,
      locale: 'en',
      line_items: [
        {
          name: `${tour.name} Tour`,
          description: tour.summary,
          amount: tour.price * 100,
          currency: 'usd',
          quantity: 1,
        },
      ],
    });
  } catch (err) {
    return next(err);
  }

  res.status(200).json({ status: 'success', session });
};
