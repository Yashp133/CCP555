/**
 * Covers the non-expanded list branch (?expand=0 or no expand).
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
      req.user = 'list@test';
      next();
    },
  }));

  jest.isolateModules(() => {
    app = require('../../src/app');
  });
});

afterAll(() => jest.resetModules());

describe('GET /v1/fragments non-expanded listing', () => {
  test('returns array of ids when not expanded', async () => {
    // create one fragment so list isn't empty
    const create = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('hello');
    expect(create.statusCode).toBeGreaterThanOrEqual(200);

    // ask for non-expanded list (explicit 0)
    const list0 = await request(app).get('/v1/fragments?expand=0');
    expect(list0.statusCode).toBe(200);
    expect(Array.isArray(list0.body.fragments)).toBe(true);

    // also test default (no expand param) branch
    const listDefault = await request(app).get('/v1/fragments');
    expect(listDefault.statusCode).toBe(200);
    expect(Array.isArray(listDefault.body.fragments)).toBe(true);
  });
});
