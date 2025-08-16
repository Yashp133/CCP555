// Covers success and failure paths in src/auth/cognito.js
describe('cognito bearer strategy verify()', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, AWS_COGNITO_POOL_ID: 'pool', AWS_COGNITO_CLIENT_ID: 'client' };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('verify succeeds and returns email', async () => {
    jest.doMock('aws-jwt-verify', () => ({
      CognitoJwtVerifier: {
        create: jest.fn(() => ({
          hydrate: jest.fn().mockResolvedValue(undefined),
          verify: jest.fn().mockResolvedValue({ email: 'user@example.com' }),
        })),
      },
    }));

    const cognito = require('../../src/auth/cognito');
    const strat = cognito.strategy();

    await new Promise((resolve, reject) => {
      strat._verify('fakeToken', (err, user) => {
        try {
          expect(err).toBeNull();
          expect(user).toBe('user@example.com');
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  test('verify failure returns false', async () => {
    jest.doMock('aws-jwt-verify', () => ({
      CognitoJwtVerifier: {
        create: jest.fn(() => ({
          hydrate: jest.fn().mockResolvedValue(undefined),
          verify: jest.fn().mockRejectedValue(new Error('bad token')),
        })),
      },
    }));

    const cognito = require('../../src/auth/cognito');
    const strat = cognito.strategy();

    await new Promise((resolve, reject) => {
      strat._verify('fakeToken', (err, user) => {
        try {
          expect(err).toBeNull();
          expect(user).toBe(false);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
