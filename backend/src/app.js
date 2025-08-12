// src/app.js
const express = require('express');
const passport = require('passport');
const logger = require('./logger');
const { strategy } = require('./auth');
const routesV1 = require('./routes'); // v1 router (mounted at /v1)
const { createErrorResponse } = require('./response');

const app = express();

/**
 * CORS for browser calls from the frontend.
 * Set CORS_ORIGIN in env (e.g., http://localhost:3000). Defaults to localhost:3000.
 * MUST run before auth and routes.
 */
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Location, ETag');

  // fingerprint so we can confirm we’re hitting this app
  res.setHeader('X-App', 'fragments-api');

  if (req.method === 'OPTIONS') return res.sendStatus(204); // preflight never hits auth
  next();
});
logger.info({ CORS_ORIGIN }, 'CORS configured');

/**
 * Body parsers
 * - JSON: application/json -> object
 * - Text:  text/*          -> string (utf-8)
 * - Images/binary: image/* or application/octet-stream -> Buffer
 * - Fallback: anything not parsed above -> Buffer (safety net)
 */
app.use(express.json({ type: ['application/json'], limit: '1mb' }));
app.use(express.text({ type: ['text/*'], defaultCharset: 'utf-8', limit: '1mb' }));
app.use(express.raw({ type: ['image/*', 'application/octet-stream'], limit: '10mb' }));
app.use(express.raw({ type: () => true, limit: '10mb' })); // safety net

// Debug tap for POST /v1/fragments (helps confirm body shape)
app.use((req, res, next) => {
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

// Mount ALL v1 routes under /v1 (e.g., /v1/health)
app.use('/v1', routesV1);
logger.info('✅ All /v1 routes initialized');

// 404
app.use((req, res) => {
  res.status(404).json(createErrorResponse(404, 'not found'));
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error({ err }, 'Unhandled exception');
  const status = err.status || 500;
  res.status(status).json(createErrorResponse(status, err.message || 'internal server error'));
});

module.exports = app;
