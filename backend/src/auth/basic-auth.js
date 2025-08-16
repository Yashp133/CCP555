'use strict';

const auth = require('http-auth');
const authPassport = require('http-auth-passport');
const logger = require('../logger');
const authorize = require('./auth-middleware');

if (!process.env.HTPASSWD_FILE) {
  throw new Error('missing expected env var: HTPASSWD_FILE');
}

logger.info('Using HTTP Basic Auth for auth');

module.exports.strategy = () =>
  authPassport(auth.basic({ file: process.env.HTPASSWD_FILE }));

// Use our custom authorize wrapper so req.user becomes a hashed ownerId
module.exports.authenticate = () => authorize('http');
