// src/auth.js

// --- Config ---
const cfg = {
  rawDomain: (import.meta.env.VITE_COGNITO_DOMAIN || '').trim(),
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirectUri: import.meta.env.VITE_REDIRECT_URI,
  logoutRedirectUri: import.meta.env.VITE_LOGOUT_REDIRECT_URI || import.meta.env.VITE_REDIRECT_URI,
  scopes: (import.meta.env.VITE_COGNITO_SCOPES || 'openid').split(' '),
};

const domain = cfg.rawDomain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');

// --- PKCE Helpers ---
function base64URLEncode(str) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest('SHA-256', data);
}

function generateRandomString(length) {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

// --- Auth Functions ---
export async function login() {
  // Generate code verifier and challenge
  const codeVerifier = generateRandomString(64);
  localStorage.setItem('pkce_verifier', codeVerifier);

  const codeChallenge = base64URLEncode(await sha256(codeVerifier));

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    response_type: 'code',
    scope: cfg.scopes.join(' '),
    redirect_uri: cfg.redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  window.location.assign(`https://${domain}/oauth2/authorize?${params}`);
}

export function logout() {
  localStorage.removeItem('id_token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    logout_uri: cfg.logoutRedirectUri,
  });
  window.location.assign(`https://${domain}/logout?${params}`);
}

// --- Exchange Code for Tokens ---
export async function handleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  if (!code) return null;

  const codeVerifier = localStorage.getItem('pkce_verifier');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    code,
    code_verifier: codeVerifier,
  });

  const resp = await fetch(`https://${domain}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const data = await resp.json();

  if (data.id_token) {
    localStorage.setItem('id_token', data.id_token);
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }

    // Clean up URL (remove ?code=... from address bar)
    window.history.replaceState({}, '', '/');
    return data.id_token;
  }

  return null;
}

export function getIdToken() {
  return localStorage.getItem('id_token');
}

export function getAccessToken() {
  return localStorage.getItem('access_token');
}

export function getRefreshToken() {
  return localStorage.getItem('refresh_token');
}
