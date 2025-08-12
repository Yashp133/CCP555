// backend/src/index.js
'use strict';

require('dotenv').config();   // load .env into process.env

// Ensure HTPASSWD_FILE is always defined (fallback to tests/.htpasswd)
if (!process.env.HTPASSWD_FILE) {
  process.env.HTPASSWD_FILE = 'tests/.htpasswd';
}

const app = require('./app');
const logger = require('./logger');

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  logger.info({ port: PORT }, 'Server started and listening on 0.0.0.0');
});
