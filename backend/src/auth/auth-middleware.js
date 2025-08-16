'use strict';
const passport = require('passport');
const { hash } = require('../hash');
const logger = require('../logger');

module.exports = (strategyName) => [
  passport.authenticate(strategyName, { session: false }),
  (req, _res, next) => {
    const raw =
      (typeof req.user === 'string' && req.user) ||
      req.user?.email ||
      req.user?.username;
    if (!raw) {
      logger.warn('authorize: missing user identity on req.user');
      return next();
    }
    req.user = hash(raw);
    logger.debug({ ownerId: req.user }, 'authorized user');
    next();
  },
];
