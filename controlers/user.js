const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const ValidationError = require('../error/ValidationError');
const NotFound = require('../error/NotFound');
const { userModel } = require('../models/user');
const LoginError = require('../error/LoginError');
const Conflict = require('../error/Conflict');

const SECRET_SAUL = 10;
const PRIVATE_KEY = process.env.JWT_SECRET;

const getUser = (req, res, next) => {
  userModel
    .findOne({})
    .then((users) => {
      res.send(users);
    })
    .catch((err) => {
      next(err);
    });
};

const changeUser = (req, res, next) => {
  const { email, name } = req.body;
  const { id } = req.user;
  userModel
    .findByIdAndUpdate(
      { _id: id },
      { $set: { name, email } },
      {
        new: true,
        runValidators: true,
      }
    )
    .then((user) => {
      if (!user) {
        throw new NotFound('Пользователь не найден');
      }
      res.send(user);
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return next(new ValidationError(err.message));
      }
      return next(err);
    });
};
const login = (req, res, next) => {
  const { email, password } = req.body;
  userModel
    .findOne({ email })
    .select('+password')
    .then((data) => {
      if (data == null) {
        throw new LoginError('email or password is not correct');
      }
      bcrypt
        .compare(password, data.password)
        .then((result) => {
          if (!result) {
            throw new LoginError('email or password is not correct');
          }
          const token = jwt.sign(
            { id: data._id },
            process.env.NODE_ENV === 'production' ? PRIVATE_KEY : 'dev-secret',
            {
              expiresIn: '7d',
            }
          );
          res
            .cookie('jwt', token, {
              maxAge: 3600000,
              httpOnly: true,
              // secure: true,
              // sameSite: 'None', // мне кажется это очень странное решение, и оно может стать уязвимостью сайта
            })
            .send({ message: 'cookie is download' });
        })
        .catch(next);
    })
    .catch(next);
};

const registration = (req, res, next) => {
  const { name, email, password } = req.body;
  console.log(name, email, password);
  bcrypt
    .hash(password, SECRET_SAUL)
    .then((passwordHash) => {
      userModel
        .create({
          email,
          password: passwordHash,
          name,
        })
        .then((data) => {
          res.send({
            name: data.name,
            email: data.email,
          });
        })
        .catch((err) => {
          if (err.code === 11000) {
            return next(new Conflict(err.message));
          }
          if (err.name === 'ValidationError') {
            return next(new ValidationError(err.message));
          }
          return next(err);
        });
    })
    .catch(next);
};
const logout = (req, res, next) => {
  try {
    res.cookie('jwt', 'none', { maxAge: 0, httpOnly: true });
    return res.json({ message: 'User logged out successfully' });
  } catch (error) {
    return next(error);
  }
};
module.exports = {
  getUser,
  changeUser,
  login,
  registration,
  logout,
};