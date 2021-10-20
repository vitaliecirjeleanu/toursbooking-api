const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');

const getCoordsForAddress = require('../utils/location');

const tourSchema = mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: [true, 'A tour must have a name.'],
  },
  summary: {
    type: String,
    trim: true,
    // minlength: 25
    required: [true, 'A tour must have a summary.'],
  },
  description: {
    type: [String],
    trim: true,
    minlength: 50,
    required: [true, 'A tour must have a description.'],
  },
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration.'],
  },
  maxPeople: {
    type: Number,
    required: [true, 'A tour must have a max number of people.'],
    max: [15, 'A tour can have maximum 15 person.'],
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty.'],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty is either: easy, medium or difficult.',
    },
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price.'],
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image.'],
    default: 'default.img',
  },
  images: [String],
  nextStartDate: {
    type: String,
    required: [true, 'A tour must have a start date'],
  },
  startDates: {
    type: [String],
    required: [true, 'A tour must have some start dates'],
  },
  locationsAddress: {
    type: [String],
    required: [true, 'A tour must have an address for every locations.'],
  },
  startLocation: String,
  locationsCoordinates: [Array],
  // locationsCoordinates: [Object], //this is for GOOGLE MAPS
  days: [String],
  slug: String,
  guides: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
  ],
  creator: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'User',
  },
});

//DOCUMENT MIDDLEWARE

tourSchema.pre('save', async function (next) {
  const coordsPromises = this.locationsAddress.map(async address => {
    try {
      const coordinates = await getCoordsForAddress(address);
      return coordinates;
    } catch (err) {
      return next(err);
    }
  });

  this.locationsCoordinates = await Promise.all(coordsPromises);
  this.slug = slugify(this.name, { lower: true });

  next();
});

//QUERY MIDDLEWARE

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '_id name email role image',
  }).populate({
    path: 'creator',
    select: '_id name email',
  });
  next();
});

module.exports = mongoose.model('Tour', tourSchema);
