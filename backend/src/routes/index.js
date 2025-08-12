const express = require('express');
const router = express.Router();

const { version, author } = require('../../package.json');
const { createSuccessResponse } = require('../response');
const { authenticate } = require('../auth');

// --- Public routes (no auth) ---
// Preflight for any /v1/* requests (CORS headers added in app.js)
- router.options('/v1/*', (req, res) => res.sendStatus(204));
+ router.options('/*', (req, res) => res.sendStatus(204)); // or remove; app.js already handles OPTIONS

// ALB/browser health check
- router.get('/v1/health', (req, res) => {
+ router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Root info (public)
router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json(
    createSuccessResponse({
      version,
      author,
      githubUrl: 'https://github.com/Yashp133/CCP555',
    })
  );
});

// --- Protected API (Cognito/Basic based on AUTH_MODE) ---
- router.use('/v1', authenticate(), require('./api'));
+ router.use('/', authenticate(), require('./api'));

module.exports = router;
