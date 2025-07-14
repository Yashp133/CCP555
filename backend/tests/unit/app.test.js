const request = require('supertest');
const app = require('../../src/app');

describe('404 handler', () => {
  test('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown');
    expect(res.statusCode).toBe(404);
    expect(res.body.error.code).toBe(404);
  });
});