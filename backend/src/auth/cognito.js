const BearerStrategy = require('passport-http-bearer').Strategy;
const { CognitoJwtVerifier } = require('aws-jwt-verify');
const logger = require('../logger');

// Fail fast if required env vars are missing
if (!(process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID)) {
  throw new Error('missing expected env vars: AWS_COGNITO_POOL_ID, AWS_COGNITO_CLIENT_ID');
}

logger.info('Using AWS Cognito for auth');

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.AWS_COGNITO_POOL_ID,
  clientId: process.env.AWS_COGNITO_CLIENT_ID,
  tokenUse: 'id',
});

jwtVerifier
  .hydrate()
  .then(() => logger.info('Cognito JWKS cached'))
  .catch((err) => logger.error({ err }, 'Unable to cache Cognito JWKS'));

// Create the bearer strategy
const bearerStrategy = new BearerStrategy(async (token, done) => {
  try {
    const user = await jwtVerifier.verify(token);
    logger.debug({ user }, 'verified user token');
    done(null, user.email);
  } catch (err) {
    logger.error({ err, token }, 'could not verify token');
    done(null, false);
  }
});

module.exports.strategy = () => bearerStrategy;

// Use authorize instead of passport.authenticate
module.exports.authenticate = () => bearerStrategy.authorize('bearer');
