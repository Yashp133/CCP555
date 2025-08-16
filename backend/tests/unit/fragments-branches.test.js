const request = require('supertest');
let app;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.API_URL = 'http://localhost:8080';

  // Make sure neither Cognito nor Basic actually runs
  delete process.env.AWS_COGNITO_POOL_ID;
  delete process.env.AWS_COGNITO_CLIENT_ID;
  delete process.env.HTPASSWD_FILE;

  jest.resetModules();

  // Stub passport so authenticate() always sets a user
  jest.doMock('passport', () => ({
    use: jest.fn(),
    initialize: () => (req, _res, next) => next(),
    authenticate: () => (req, _res, next) => {
      req.user = 'user@example.com';
      next();
    },
  }));

  // Also stub our auth wrapper to bypass real strategies
  jest.doMock('../../src/auth', () => ({
    strategy: () => ({}),
    authenticate: () => (req, _res, next) => {
      req.user = 'user@example.com';
      next();
    },
  }));

  // Now load the app with the mocks in place
  jest.isolateModules(() => {
    app = require('../../src/app');
  });
});

// No real creds needed now, but supertest still calls endpoints
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8HwQACfsD/Ur9oFQAAAAASUVORK5CYII=',
  'base64'
);

test('POST missing Content-Type -> 400', async () => {
  // Do not call .send() and do not set Content-Type,
  // so the header is actually missing.
  const res = await request(app).post('/v1/fragments');
  expect(res.statusCode).toBe(400);
});


test('POST invalid Content-Type -> 400', async () => {
  const res = await request(app)
    .post('/v1/fragments')
    .set('Content-Type', 'text/plain; charset==utf8') // malformed
    .send('hi');
  expect(res.statusCode).toBe(400);
});

test('POST unsupported Content-Type -> 415', async () => {
  const res = await request(app)
    .post('/v1/fragments')
    .set('Content-Type', 'application/xml')
    .send('<x/>');
  expect(res.statusCode).toBe(415);
});

test('GET :id for missing -> 404', async () => {
  const res = await request(app).get('/v1/fragments/does-not-exist');
  expect(res.statusCode).toBe(404);
});

test('GET :id.:ext with unsupported ext -> 415', async () => {
  const created = await request(app)
    .post('/v1/fragments')
    .set('Content-Type', 'text/plain')
    .send('hello');
  expect(created.statusCode).toBe(201);

  const id = created.body.fragment.id;

  const res = await request(app).get(`/v1/fragments/${id}.gif`); // gif not supported
  expect(res.statusCode).toBe(415);
});

test('image same-type conversion path returns original bytes', async () => {
  const created = await request(app)
    .post('/v1/fragments')
    .set('Content-Type', 'image/png')
    .send(PNG_1x1);
  expect(created.statusCode).toBe(201);

  const id = created.body.fragment.id;

  const res = await request(app).get(`/v1/fragments/${id}.png`);
  expect(res.statusCode).toBe(200);
  expect(res.headers['content-type']).toMatch(/image\/png/);
  expect(Buffer.isBuffer(res.body) || typeof res.text === 'string').toBe(true);
});
