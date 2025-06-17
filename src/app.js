const express = require('express');
const passport = require('passport');
const logger = require('./logger');
const { strategy } = require('./auth');
const routes = require('./routes');
const { createErrorResponse } = require('./response');

const app = express();

passport.use(strategy());
app.use(passport.initialize());
app.use('/', routes);

app.use((req, res) => {
  res.status(404).json(createErrorResponse(404, 'not found'));
});

app.use((err, req, res, next) => {
  logger.error({ err }, 'Unhandled exception');
  res.status(500).json(createErrorResponse(500, err.message));
});

module.exports = app;