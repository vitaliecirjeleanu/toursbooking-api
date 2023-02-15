const fs = require('fs');
const path = require('path');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');

const AppError = require('./utils/appError');

const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');

const upload = multer();

// Start express app
const app = express();

// App configurations
app.use(cors({
    origin: '*'
}));
// app.options('*', cors());
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
// app.use(upload.none());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

// ROUTES
app.use('/api/users', userRouter);
app.use('/api/tours', tourRouter);

app.use((req, res, next) => {
  return next(new AppError('Could not find this route.', 404));
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, err => console.error(err));
  }

  if (req.files) {
    fs.unlink(req.files.imageCover[0].path, err => console.error(err));
    req.files.images.forEach(image => {
      fs.unlink(image.path, err => console.error(err));
    });
  }

  if (res.headersSent) return next(error);

  res.status(error.statusCode || 500).json({
    message: error.message || 'An unknown error occured!',
  });
});

module.exports = app;
