// src/auth.js
const cfg = {
  rawDomain: (import.meta.env.VITE_COGNITO_DOMAIN || '').trim(),
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirectUri: import.meta.env.VITE_REDIRECT_URI,
  logoutRedirectUri: import.meta.env.VITE_LOGOUT_REDIRECT_URI || import.meta.env.VITE_REDIRECT_URI,
  scopes: (import.meta.env.VITE_COGNITO_SCOPES || 'openid').split(' '),
};

const domain = cfg.rawDomain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');

export function login() {
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    response_type: 'token',     // implicit flow -> id_token in hash
    scope: cfg.scopes.join(' '),
    redirect_uri: cfg.redirectUri,
  });
  // ⬇️ use the OAuth2 authorize endpoint
  window.location.assign(`https://${domain}/oauth2/authorize?${params}`);
}

export function logout() {
  localStorage.removeItem('id_token');
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    logout_uri: cfg.logoutRedirectUri,
  });
  // logout endpoint (works for new UI)
  window.location.assign(`https://${domain}/logout?${params}`);
}

export function parseHashToken() {
  const h = new URLSearchParams(window.location.hash.slice(1));
  const idToken = h.get('id_token');
  if (idToken) {
    localStorage.setItem('id_token', idToken);
    window.history.replaceState({}, '', '/');
    return idToken;
  }
  return null;
}

export function getIdToken() {
  return localStorage.getItem('id_token');
}
