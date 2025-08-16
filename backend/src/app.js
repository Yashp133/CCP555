'use strict';

const express = require('express');
const passport = require('passport');
const logger = require('./logger');
const { strategy } = require('./auth');
const routesV1 = require('./routes');
const { createErrorResponse, createSuccessResponse } = require('./response');
const pkg = require('../package.json');

const app = express();

/**
 * CORS
 * - Supports comma-separated origins in CORS_ORIGIN
 * - If CORS_ORIGIN contains "*" we echo back whatever Origin we get
 * - Always send CORS headers (preflight + actual requests)
 */
const RAW_ALLOWED = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000';
const ALLOW_ANY = RAW_ALLOWED.split(',').map(s => s.trim()).includes('*');
const ALLOWED_ORIGINS = RAW_ALLOWED
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && (ALLOW_ANY || ALLOWED_ORIGINS.includes(origin))) {
    // Echo back the caller’s origin (better than "*", works with credentials if needed)
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  // If the browser asked specific headers in preflight, echo them back,
  // otherwise provide a sensible default (Authorization is important)
  const reqAllowHeaders = req.headers['access-control-request-headers'];
  res.setHeader(
    'Access-Control-Allow-Headers',
    reqAllowHeaders || 'Authorization, Content-Type, Accept'
  );

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('Access-Control-Expose-Headers', 'Location, ETag, Content-Type');

  // fingerprint so we can confirm we’re hitting this app
  res.setHeader('X-App', 'fragments-api');

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

logger.info({ ALLOWED_ORIGINS, ALLOW_ANY }, 'CORS configured');

// Body parsers
app.use(express.json({ type: ['application/json'], limit: '1mb' }));
app.use(express.text({ type: ['text/*'], defaultCharset: 'utf-8', limit: '1mb' }));
app.use(express.raw({ type: ['image/*', 'application/octet-stream'], limit: '10mb' }));
app.use(express.raw({ type: () => true, limit: '10mb' })); // safety net

// Debug tap for POST /v1/fragments
app.use((req, _res, next) => {
  if (req.method === 'POST' && req.path.startsWith('/v1/fragments')) {
    try {
      const b = req.body;
      const info = {
        ct: req.headers['content-type'],
        isBuffer: Buffer.isBuffer(b),
        ctor: b && b.constructor ? b.constructor.name : undefined,
        typeof: typeof b,
        length:
          (Buffer.isBuffer(b) && b.length) ||
          (b && typeof b.length === 'number' && b.length) ||
          (b && typeof b.byteLength === 'number' && b.byteLength) ||
          (b && b.data && Array.isArray(b.data) && b.data.length) ||
          undefined,
      };
      logger.info({ upload: info }, 'DEBUG upload');
    } catch (e) {
      logger.warn({ e }, 'DEBUG upload logging failed');
    }
  }
  next();
});

// Auth
passport.use(strategy());
app.use(passport.initialize());

// Root info (public)
app.get('/', (_req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.status(200).json(
    createSuccessResponse({
      version: pkg.version,
      author: pkg.author,
      githubUrl: 'https://github.com/Yashp133/CCP555',
    })
  );
});

// v1 routes
app.use('/v1', routesV1);
logger.info('✅ All /v1 routes initialized');

// 404
app.use((req, res) => {
  res.status(404).json(createErrorResponse(404, 'not found'));
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error({ err }, 'Unhandled exception');
  const status = err.status || 500;
  res.status(status).json(createErrorResponse(status, err.message || 'internal server error'));
});

module.exports = app;
