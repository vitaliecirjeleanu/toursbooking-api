const User = require('../models/userModel');
const AppError = require('../utils/appError');
const filterObject = require('../utils/filterObject');

exports.getAllUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find();

    if (!users || users === null) {
      return next(new AppError('Getting the users failed.', 500));
    }
  } catch (err) {
    return next(err);
  }

  res.json({
    status: 'success',
    quantity: users.length,
    users,
  });
};

exports.getUser = async (req, res, next) => {
  const userId = req.params.uid;
  let user;

  try {
    user = await User.findById(userId).select('-password');

    if (!user) {
      return next(new AppError('No user found with this id.', 404));
    }
  } catch (err) {
    return next(err);
  }

  res.json({
    status: 'success',
    user,
  });
};

exports.updateMe = async (req, res, next) => {
  // id will be get from req, it will be tansmited from protect middleware
  const filteredBody = filterObject(req.body, 'email', 'name');
  if (req.file) filteredBody.image = req.file.path;

  let updatedUser;

  try {
    updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
    });
  } catch (err) {
    return next(
      new AppError('Updating the user failed. Please try again'),
      500
    );
  }

  res.json({
    status: 'success',
    user: updatedUser,
  });
};

exports.closeMyAccount = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });
  } catch (err) {
    return next(err);
  }

  res.json({ status: 'success', message: 'Account closed successfully.' });
};

// these 2 operations must be available just for an Administator

exports.createUser = async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  let user;
  try {
    user = await User.create({
      name,
      email,
      password,
      passwordConfirm,
    });

    if (!user) {
      return next(
        new AppError('Creating an user fialed! Please try again.', 500)
      );
    }
  } catch (err) {
    return next(err);
  }

  res.status(201).json({
    status: 'succes',
    user,
  });
};

exports.deleteUser = async (req, res, next) => {
  const userId = req.params.uid;

  try {
    const user = await User.findByIdAndDelete(userId);
    console.log(user);

    if (!user) return next(new AppError('No user found with this id.', 404));
  } catch (err) {
    return next(err);
  }

  res.json({ status: 'success', message: 'User deleted successfully!' });
};
