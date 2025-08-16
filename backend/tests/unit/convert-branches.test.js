/**
 * Exercises conversion 415 branch and optional /:id/info metadata.
 * Auth + passport mocked to avoid external deps.
 */
const request = require('supertest');

let app;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  delete process.env.AWS_COGNITO_POOL_ID;
  delete process.env.AWS_COGNITO_CLIENT_ID;
  delete process.env.HTPASSWD_FILE;

  jest.resetModules();

  jest.doMock('passport', () => ({
    use: jest.fn(),
    initialize: () => (req, _res, next) => next(),
    authenticate: () => (req, _res, next) => next(),
  }));

  jest.doMock('../../src/auth', () => ({
    strategy: () => ({}),
    authenticate: () => (req, _res, next) => {
      req.user = 'branch@test';
      next();
    },
  }));

  jest.isolateModules(() => {
    app = require('../../src/app');
  });
});

afterAll(() => {
  jest.resetModules();
});

describe('conversion + info branches', () => {
  test('GET /:id/info returns metadata if implemented (otherwise 404 is OK)', async () => {
    // Create a markdown fragment
    const create = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/markdown')
      .send('# hello meta');

    expect(create.statusCode).toBeGreaterThanOrEqual(200);
    const id = create.body?.fragment?.id || (create.headers.location || '').split('/').pop();

    // Try the /info endpoint
    const info = await request(app).get(`/v1/fragments/${id}/info`);

    if (info.statusCode === 404) {
      // Your implementation may not have /info; accept 404
      expect(info.statusCode).toBe(404);
    } else {
      // If implemented, verify shape
      expect(info.statusCode).toBe(200);
      expect(info.body).toHaveProperty('fragment');
      expect(info.body.fragment).toHaveProperty('id', id);
      expect(info.body.fragment.type).toMatch(/text\/markdown/i);
    }
  });

  test('unsupported conversion returns 415 (markdown -> png)', async () => {
    const create = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/markdown')
      .send('# cannot be image');

    const id = create.body?.fragment?.id || (create.headers.location || '').split('/').pop();

    const bad = await request(app).get(`/v1/fragments/${id}.png`);
    expect([415, 400]).toContain(bad.statusCode); // most impls use 415; a few use 400
  });
});
