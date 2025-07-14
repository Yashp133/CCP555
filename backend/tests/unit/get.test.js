const request = require('supertest');
const app = require('../../src/app');

console.log('HTPASSWD_FILE from test:', process.env.HTPASSWD_FILE);


describe('GET /v1/fragments', () => {
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments')
      .auth('invalid@email.com', 'wrong_password')
      .expect(401));

  test('authenticated users get a fragments array', async () => {
    const res = await request(app)
      .get('/v1/fragments')
      .auth('testuser', 'testuser');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });
});