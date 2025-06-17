if (
  process.env.AWS_COGNITO_POOL_ID &&
  process.env.AWS_COGNITO_CLIENT_ID &&
  process.env.HTPASSWD_FILE
) {
  throw new Error('env contains configuration for both AWS Cognito and HTTP Basic Auth. Only one is allowed.');
}

if (process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID) {
  module.exports = require('./cognito');
} else if (process.env.HTPASSWD_FILE && process.env.NODE_ENV !== 'production') {
  module.exports = require('./basic-auth');
} else {
  throw new Error('missing env vars: no authorization configuration found');
}