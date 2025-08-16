// Covers the branch in src/auth/basic-auth.js where HTPASSWD_FILE is missing
describe('basic-auth config missing HTPASSWD_FILE', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.HTPASSWD_FILE;         // simulate missing env
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('throws when HTPASSWD_FILE is not set', () => {
    expect(() => {
      // require the module directly to test its guard
      require('../../src/auth/basic-auth');
    }).toThrow(/missing expected env var: HTPASSWD_FILE/i);
  });
});
