const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: true,
    validate: [validator.isEmail, 'Email address is invalid'],
  },
  password: {
    type: String,
    minlength: 6,
    required: true,
    //   select: false
  },
  passwordConfirm: {
    type: String,
    required: true,
    validate: {
      validator: function (passConf) {
        return passConf === this.password;
      },
      message: 'Confirm password should be the same as password.',
    },
    //   select: false
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  image: {
    type: String,
    default: 'default.jpg',
  },
  active: {
    type: Boolean,
    default: true,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await bcrypt.hash(this.password, 12);
  } catch (err) {
    return next(err);
  }

  this.passwordConfirm = undefined;
  next();
});

module.exports = mongoose.model('User', userSchema);
