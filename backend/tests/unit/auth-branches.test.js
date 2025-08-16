/**
 * Tests for selecting the correct auth branch (Basic vs Cognito)
 * without talking to real AWS.
 */

const path = require('path');

const resetEnv = () => {
  delete process.env.AWS_COGNITO_POOL_ID;
  delete process.env.AWS_COGNITO_CLIENT_ID;
  delete process.env.HTPASSWD_FILE;
  delete process.env.NODE_ENV;
};

afterEach(() => {
  resetEnv();
  jest.resetModules();
});

describe('auth config branches', () => {
  test('throws if both Cognito and Basic are configured', () => {
    process.env.AWS_COGNITO_POOL_ID = 'us-east-1_123456789';
    process.env.AWS_COGNITO_CLIENT_ID = 'fakeclientid';
    process.env.HTPASSWD_FILE = path.join('tests', '.htpasswd');

    jest.resetModules();
    expect(() => require('../../src/auth/index')).toThrow(
      /both AWS Cognito and HTTP Basic Auth/i
    );
  });

  test('basic-only loads in test env', () => {
    process.env.NODE_ENV = 'test';
    process.env.HTPASSWD_FILE = path.join('tests', '.htpasswd');
    delete process.env.AWS_COGNITO_POOL_ID;
    delete process.env.AWS_COGNITO_CLIENT_ID;

    jest.resetModules();
    expect(() => require('../../src/auth/index')).not.toThrow();
  });

  test('cognito-only loads in production env', async () => {
    // Mock the Cognito verifier so we don’t hit AWS and don’t validate IDs.
    // Include a no-op hydrate() to avoid "hydrate is not a function".
    jest.doMock('aws-jwt-verify', () => ({
      CognitoJwtVerifier: {
        create: jest.fn(() => ({
          verify: jest.fn().mockResolvedValue({ sub: '123' }),
          hydrate: jest.fn().mockResolvedValue(undefined),
        })),
      },
    }));
    const { CognitoJwtVerifier } = require('aws-jwt-verify');

    process.env.NODE_ENV = 'production';
    process.env.AWS_COGNITO_POOL_ID = 'us-east-1_123456789'; // valid-looking
    process.env.AWS_COGNITO_CLIENT_ID = 'fakeclientid';
    delete process.env.HTPASSWD_FILE;

    // Load the module in isolation so our mock is used
    jest.isolateModules(() => {
      expect(() => require('../../src/auth/index')).not.toThrow();
    });

    // Ensure our mock was used with the expected shape
    expect(CognitoJwtVerifier.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userPoolId: process.env.AWS_COGNITO_POOL_ID,
        clientId: process.env.AWS_COGNITO_CLIENT_ID,
      })
    );

    // Accept either 'id' or 'access' depending on implementation detail
    const arg = CognitoJwtVerifier.create.mock.calls[0][0];
    expect(['id', 'access']).toContain(arg.tokenUse);
  });
});
