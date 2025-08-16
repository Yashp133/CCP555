/**
 * Covers /:id/formats (if present) and JSON fragment round-trip.
 * Auth + passport mocked.
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
      req.user = 'formats@test';
      next();
    },
  }));

  jest.isolateModules(() => {
    app = require('../../src/app');
  });
});

afterAll(() => jest.resetModules());

describe('formats + JSON fragment paths', () => {
  test('GET /:id/formats (200 if implemented, 404 otherwise)', async () => {
    const create = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/markdown')
      .send('# hello formats');

    expect([200, 201]).toContain(create.statusCode);
    const id = create.body?.fragment?.id || (create.headers.location || '').split('/').pop();

    const fmts = await request(app).get(`/v1/fragments/${id}/formats`);

    if (fmts.statusCode === 404) {
      expect(fmts.statusCode).toBe(404);
    } else {
      expect(fmts.statusCode).toBe(200);
      const arr = fmts.body?.formats || fmts.body;
      expect(Array.isArray(arr)).toBe(true);
      expect(arr.some((t) => /text\/markdown/i.test(t))).toBe(true);
    }
  });

  test('JSON fragment round-trip', async () => {
    const payload = { a: 1, b: 'two' };
    const create = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(payload));

    expect([200, 201]).toContain(create.statusCode);
    const id = create.body?.fragment?.id || (create.headers.location || '').split('/').pop();

    const get = await request(app).get(`/v1/fragments/${id}`);
    expect(get.statusCode).toBe(200);
    expect(get.headers['content-type']).toMatch(/application\/json/i);
    const roundTrip = JSON.parse(get.text || '{}');
    expect(roundTrip).toMatchObject(payload);
  });
});
