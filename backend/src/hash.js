'use strict';
const crypto = require('crypto');

module.exports.hash = (value) =>
  crypto.createHash('sha256').update((value || '').toLowerCase().trim(), 'utf8').digest('hex');
