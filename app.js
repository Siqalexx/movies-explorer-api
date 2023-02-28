require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { celebrate, Joi, errors } = require('celebrate');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const userRouter = require('./routes/user');
const movieRouter = require('./routes/movie');
const { auth } = require('./middlewares/auth');
const { cors } = require('./middlewares/cors');
const NotFound = require('./error/NotFound');
const { REGEPX_URL } = require('./constants/constants');
const { login, registration } = require('./controlers/user');

mongoose.connect('mongodb://localhost:27017/bitfilmsdb');

const app = express();

app.use(cors);
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.post(
  '/signin',
  celebrate({
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required().min(6),
    }),
  }),
  login
);

app.post(
  '/signup',
  celebrate({
    body: Joi.object().keys({
      name: Joi.string().required().min(2).max(30),
      email: Joi.string().required().email(),
      password: Joi.string().required().min(6),
    }),
  }),
  registration
);

app.use('/users', auth, userRouter);

app.use('/movies', auth, movieRouter);

app.use(errorLogger);

app.use((req, res, next) => {
  next(new NotFound('Неправильный адрес'));
});

app.use(errors());

app.use((err, req, res, next) => {
  const { message, status = 500 } = err;
  if (status !== 500) {
    res.status(status).send({
      message,
    });
  } else {
    console.log(message);
    res.status(status).send({
      message: 'Ошибка сервера',
    });
  }
  next();
});

app.listen(3000, () => console.log('Сервер запущен'));