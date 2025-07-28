// src/app.js
const express = require('express');
const passport = require('passport');
const logger = require('./logger'); // ✅ Keep logger and use it
const { strategy } = require('./auth');
const routes = require('./routes');
const { createErrorResponse } = require('./response');

const app = express();

// ─── Body parsers ────────────────────────────────────────────────
// parse JSON bodies when Content-Type: application/json
app.use(express.json());

// parse text bodies when Content-Type: text/plain (with or without charset)
app.use(express.text({ type: 'text/plain', defaultCharset: 'utf-8' }));
// ──────────────────────────────────────────────────────────────────

passport.use(strategy());
app.use(passport.initialize());

// Mount all your routes (including /v1/health, /v1/fragments, etc)
app.use('/', routes);

// ✅ Log successful route mount
logger.info('✅ All routes initialized');

// 404 handler
app.use((req, res) => {
  res.status(404).json(createErrorResponse(404, 'not found'));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error({ err }, 'Unhandled exception');
  res.status(500).json(createErrorResponse(500, err.message));
});

module.exports = app;
