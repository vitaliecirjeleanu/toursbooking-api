const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const { findById } = require('../models/userModel');

exports.signup = async (req, res, next) => {
  const { name, email, password, passwordConfirm, role } = req.body;
  let newUser;

  try {
    const exsitingUser = await User.findOne({ email: email });

    if (exsitingUser)
      return next(
        new AppError('Could not create a user, email already exists.', 422)
      );
  } catch (err) {
    return next(new AppError(err.message, 500));
  }

  try {
    newUser = await User.create({
      name,
      email,
      password,
      passwordConfirm,
      role,
      image: req.file ? req.file.path : 'default.jpg',
    });

    if (!newUser) {
      return next(new AppError('Creating a user failed.', 500));
    }
  } catch (err) {
    return next(new AppError(err.message, 500));
  }

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email },
    process.env.JWT_KEY,
    { expiresIn: '6h' }
  );

  if (!token) {
    return next(new AppError('Signup failed. Please try again.', 500));
  }

  // deleting password from output
  newUser.password = undefined;

  res.json({
    status: 'success',
    user: newUser,
    token,
  });
};

exports.login = async (req, res, next) => {
  const { password, email } = req.body;
  let user;

  if (!email || !password) {
    return next(new AppError('Email and password must be provided.', 400));
  }

  try {
    user = await User.findOne({ email: email }).select(
      'password id email role image active'
    );
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new AppError('Incorret email or password', 401));
    }

    if (user && user.active === false) {
      return next(new AppError('This user no longer exist.', 401));
    }
  } catch (err) {
    return next(err);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_KEY,
    { expiresIn: '6h' }
  );

  if (!token) {
    return next(new AppError('Login failed. Please try again.', 500));
  }

  user.password = undefined;

  res.json({
    status: 'success',
    user,
    token,
  });
};

// logout functionality will be implemented on the client side with localStorage.removeItem()

exports.protect = async (req, res, next) => {
  let token, currentUser;
  //1. verify if token exists
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get acces.', 401)
    );
  }
  //2. verifiy if token is correct
  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('The user with this token no longer exist.', 401)
      );
    }
  } catch (err) {
    return next(new AppError(err, 401));
  }

  //3. if all is good, allow acces
  req.user = currentUser;
  next();
};

exports.changePassword = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.user.id);

    if (!(await bcrypt.compare(req.body.passwordCurrent, user.password))) {
      return next(new AppError('Incorect current password.', 401));
    }
  } catch (err) {
    return next(err);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_KEY,
    { expiresIn: '6h' }
  );

  if (!token) {
    return next(new AppError('Something went wrong. Please try again.', 500));
  }

  try {
    user.password = req.body.passwordNew;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
  } catch (err) {
    return next(err);
  }

  res.json({ status: 'success', user, token });
};

exports.restrictTo =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
