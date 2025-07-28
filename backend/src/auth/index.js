const path = require('path');
const fs = require('fs');

// Debug environment variables
console.log(' Auth Configuration:');
console.log('- AWS_COGNITO_POOL_ID:', !!process.env.AWS_COGNITO_POOL_ID);
console.log('- AWS_COGNITO_CLIENT_ID:', !!process.env.AWS_COGNITO_CLIENT_ID);
console.log('- HTPASSWD_FILE:', process.env.HTPASSWD_FILE);
console.log('- NODE_ENV:', process.env.NODE_ENV);

//  Conflict: Both configs provided
if (
  process.env.HTPASSWD_FILE &&
  process.env.AWS_COGNITO_POOL_ID &&
  process.env.AWS_COGNITO_CLIENT_ID
) {
  throw new Error('env contains configuration for both AWS Cognito and HTTP Basic Auth. Only one is allowed.');
}

//  Basic Auth
if (process.env.HTPASSWD_FILE) {
  console.log('⚠️ FORCING BASIC AUTH FOR DEBUGGING');
  const basicAuth = require('./basic-auth');
  
  const htpasswdPath = path.resolve(process.env.HTPASSWD_FILE);
  console.log('🔍 .htpasswd location:', htpasswdPath);
  console.log('🔍 File exists:', fs.existsSync(htpasswdPath));

  if (fs.existsSync(htpasswdPath)) {
    console.log('🔍 First 3 lines of .htpasswd:');
    fs.readFileSync(htpasswdPath, 'utf8')
      .split('\n')
      .slice(0, 3)
      .forEach((line, i) => console.log(`${i+1}: ${line}`));
  }

  // Show test creds
  console.log('🔐 Basic Auth test credentials:');
  console.log('- testuser:testuser');
  console.log('- user1@email.com:password1');

  module.exports = basicAuth;
}
//  Cognito
else if (process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID) {
  module.exports = require('./cognito');
}
else {
  throw new Error('missing env vars: no authorization configuration found');
}
