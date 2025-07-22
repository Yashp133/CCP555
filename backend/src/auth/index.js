const path = require('path');
const fs = require('fs');

// Debug environment variables
console.log('🔍 Auth Configuration:');
console.log('- AWS_COGNITO_POOL_ID:', !!process.env.AWS_COGNITO_POOL_ID);
console.log('- AWS_COGNITO_CLIENT_ID:', !!process.env.AWS_COGNITO_CLIENT_ID);
console.log('- HTPASSWD_FILE:', process.env.HTPASSWD_FILE);
console.log('- NODE_ENV:', process.env.NODE_ENV);

// Force Basic Auth for debugging (comment out in production)
if (process.env.HTPASSWD_FILE) {
  console.log('⚠️ FORCING BASIC AUTH FOR DEBUGGING');
  const basicAuth = require('./basic-auth');
  
  // Add verification of .htpasswd file
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

  module.exports = basicAuth;
}
// Original conditional logic
else if (
  process.env.AWS_COGNITO_POOL_ID &&
  process.env.AWS_COGNITO_CLIENT_ID &&
  process.env.HTPASSWD_FILE
) {
  throw new Error('env contains configuration for both AWS Cognito and HTTP Basic Auth. Only one is allowed.');
}
else if (process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID) {
  module.exports = require('./cognito');
} 
else {
  throw new Error('missing env vars: no authorization configuration found');
}

// Add auth verification endpoint
if (process.env.HTPASSWD_FILE) {
  console.log('🔐 Basic Auth test credentials:');
  console.log('- testuser:testuser');
  console.log('- user1@email.com:password1');
}