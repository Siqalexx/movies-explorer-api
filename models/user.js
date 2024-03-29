const mongoose = require('mongoose');
// const validator = require('validator');
const { REGEPX_EMAIL } = require('../constants/constants');

function validateEmail(email) {
  return REGEPX_EMAIL.test(email);
}

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: validateEmail,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  name: {
    required: true,
    type: String,
    minlength: 2,
    maxlength: 30,
  },
});

module.exports.userModel = mongoose.model('user', userSchema);
