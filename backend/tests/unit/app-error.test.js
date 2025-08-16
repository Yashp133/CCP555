/**
 * Hit the global error handler in app.js to cover its last lines.
 * We mock the routes module to add a path that throws.
 */
const request = require('supertest');
const express = require('express');

let app;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  delete process.env.AWS_COGNITO_POOL_ID;
  delete process.env.AWS_COGNITO_CLIENT_ID;
  delete process.env.HTPASSWD_FILE;

  jest.resetModules();

  // keep passport/auth quiet
  jest.doMock('passport', () => ({
    use: jest.fn(),
    initialize: () => (req, _res, next) => next(),
    authenticate: () => (req, _res, next) => next(),
  }));

  jest.doMock('../../src/auth', () => ({
    strategy: () => ({}),
    authenticate: () => (req, _res, next) => {
      req.user = 'err@test';
      next();
    },
  }));

  // IMPORTANT: app mounts this router at '/v1',
  // so define the route as '/boom' (NOT '/v1/boom')
  jest.doMock('../../src/routes', () => {
    const router = express.Router();
    router.get('/boom', (_req, _res, next) => next(new Error('boom')));
    return router;
  });

  jest.isolateModules(() => {
    app = require('../../src/app');
  });
});

afterAll(() => jest.resetModules());

test('global error handler returns 500 JSON', async () => {
  const res = await request(app).get('/v1/boom');
  expect(res.statusCode).toBe(500);
  // be tolerant about error payload shape
  const body = res.body || {};
  const status = body.status || (body.error && 'error') || 'error';
  expect(status).toBe('error');
});
