const path = require('path');
const fs = require('fs');
const logger = require('../logger');

// helper: silence debug logs during tests
const dbg = (...args) => {
  if (process.env.NODE_ENV === 'test') return;
  logger.debug(...args);
};

// Debug environment variables (debug level; silenced in tests)
dbg('Auth Configuration:');
dbg('- AWS_COGNITO_POOL_ID:', !!process.env.AWS_COGNITO_POOL_ID);
dbg('- AWS_COGNITO_CLIENT_ID:', !!process.env.AWS_COGNITO_CLIENT_ID);
dbg('- HTPASSWD_FILE:', process.env.HTPASSWD_FILE);
dbg('- NODE_ENV:', process.env.NODE_ENV);

// Conflict: both configs provided
if (
  process.env.HTPASSWD_FILE &&
  process.env.AWS_COGNITO_POOL_ID &&
  process.env.AWS_COGNITO_CLIENT_ID
) {
  throw new Error(
    'env contains configuration for both AWS Cognito and HTTP Basic Auth. Only one is allowed.'
  );
}

// Basic Auth
if (process.env.HTPASSWD_FILE) {
  logger.info('Using HTTP Basic Auth for auth');

  const basicAuth = require('./basic-auth');

  const htpasswdPath = path.resolve(process.env.HTPASSWD_FILE);
  dbg('🔍 .htpasswd location:', htpasswdPath);
  dbg('🔍 File exists:', fs.existsSync(htpasswdPath));

  if (fs.existsSync(htpasswdPath)) {
    const preview = fs.readFileSync(htpasswdPath, 'utf8').split('\n').slice(0, 3);
    dbg('🔍 First 3 lines of .htpasswd:');
    preview.forEach((line, i) => dbg(`${i + 1}: ${line}`));
  }

  // Optional hint logs (debug only)
  dbg('🔐 Basic Auth test credentials:');
  dbg('- testuser:testuser');
  dbg('- user1@email.com:password1');

  module.exports = basicAuth;
}
// Cognito
else if (process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID) {
  logger.info('Using AWS Cognito for auth');
  module.exports = require('./cognito');
} else {
  throw new Error('missing env vars: no authorization configuration found');
}
