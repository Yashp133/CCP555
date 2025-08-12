// backend/src/routes/index.js
'use strict';

const express = require('express');
const router = express.Router();

const pkg = require('../../package.json');
const createSuccessResponse = require('../response').createSuccessResponse;
const authenticate = require('../auth').authenticate;

// Public: /v1/health (router is mounted at /v1 in app.js)
router.get('/health', function (req, res) {
  res.status(200).json({ status: 'ok' });
});

// Public: /v1/  (nice to have; root / is handled in app.js)
router.get('/', function (req, res) {
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json(
    createSuccessResponse({
      version: pkg.version,
      author: pkg.author,
      githubUrl: 'https://github.com/Yashp133/CCP555'
    })
  );
});

// Protected API (mounted at /v1 in app.js, so these are /v1/*)
router.use('/', authenticate(), require('./api'));

module.exports = router;
