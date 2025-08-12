// backend/src/index.js
'use strict';

require('dotenv').config(); // load .env

//  Only set HTPASSWD_FILE fallback for unit tests
if (process.env.NODE_ENV === 'test' && !process.env.HTPASSWD_FILE) {
  process.env.HTPASSWD_FILE = 'tests/.htpasswd';
}

const app = require('./app');
const logger = require('./logger');

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Server started');
});
