// frontend/src/auth/cognito.js
// Hosted UI (Authorization Code + PKCE) helpers for the SPA.
// Exports: isConfigured, isAuthenticated, login, logout, handleRedirectCallback, getAccessToken

// ==== Config from env ====
const COGNITO_DOMAIN =
  (process.env.REACT_APP_COGNITO_DOMAIN || '').replace(/\/+$/, ''); // e.g. https://your-domain.auth.us-east-1.amazoncognito.com
const COGNITO_CLIENT_ID = process.env.REACT_APP_COGNITO_CLIENT_ID || '';     // App client id (no secret)
const REDIRECT_URI =
  process.env.REACT_APP_COGNITO_REDIRECT_URI || `${window.location.origin}/auth/callback`;
const LOGOUT_URI =
  process.env.REACT_APP_COGNITO_LOGOUT_URI || `${window.location.origin}`;
const SCOPES = (process.env.REACT_APP_COGNITO_SCOPES || 'openid email profile').trim();

// ==== Storage keys ====
const K = {
  access: 'cog.access_token',
  id: 'cog.id_token',
  refresh: 'cog.refresh_token',
  expires: 'cog.expires_at', // epoch ms
  state: 'cog.pkce_state',
  verifier: 'cog.pkce_verifier',
};

// ==== Public API ====
export function isConfigured() {
  return Boolean(COGNITO_DOMAIN && COGNITO_CLIENT_ID);
}

export function isAuthenticated() {
  const at = getAccessToken();
  return Boolean(at);
}

export function getAccessToken() {
  const token = localStorage.getItem(K.access);
  const exp = Number(localStorage.getItem(K.expires) || 0);
  if (!token || !exp) return null;
  // consider token expired if less than 60s left
  if (Date.now() > exp - 60_000) return null;
  return token;
}

export async function login() {
  if (!isConfigured()) throw new Error('Cognito not configured');

  // Create PKCE code_verifier and code_challenge
  const state = randomString(32);
  const verifier = randomString(64);
  const challenge = await pkceChallenge(verifier);

  sessionStorage.setItem(K.state, state);
  sessionStorage.setItem(K.verifier, verifier);

  const url = new URL(`${COGNITO_DOMAIN}/oauth2/authorize`);
  url.searchParams.set('client_id', COGNITO_CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('code_challenge', challenge);

  window.location.assign(url.toString());
}

export async function handleRedirectCallback() {
  // Handle /auth/callback?code=...&state=...
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const storedState = sessionStorage.getItem(K.state);
  const verifier = sessionStorage.getItem(K.verifier);

  // Clean up URL early
  window.history.replaceState({}, '', window.location.pathname);

  if (!code) return; // nothing to do (maybe user navigated directly)

  if (!state || !storedState || state !== storedState) {
    throw new Error('Invalid OAuth state');
  }
  if (!verifier) {
    throw new Error('Missing PKCE verifier');
  }

  // Exchange code -> tokens
  const tokenUrl = `${COGNITO_DOMAIN}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: COGNITO_CLIENT_ID,
    code,
    code_verifier: verifier,
    redirect_uri: REDIRECT_URI,
  });

  const resp = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Token exchange failed: ${resp.status} ${txt}`);
  }

  const json = await resp.json();

  // Persist tokens (you may also want to store id_token if needed)
  const now = Date.now();
  const expiresInSec = Number(json.expires_in || 3600);
  localStorage.setItem(K.access, json.access_token || '');
  if (json.refresh_token) localStorage.setItem(K.refresh, json.refresh_token);
  if (json.id_token) localStorage.setItem(K.id, json.id_token);
  localStorage.setItem(K.expires, String(now + expiresInSec * 1000));

  // Clear PKCE temp values
  sessionStorage.removeItem(K.state);
  sessionStorage.removeItem(K.verifier);
}

export async function logout() {
  // Clear local tokens first
  Object.values(K).forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  if (!isConfigured()) {
    // Just return to app if not configured
    window.location.assign(LOGOUT_URI);
    return;
  }

  // Redirect to Cognito logout so the Hosted UI session is cleared too
  const url = new URL(`${COGNITO_DOMAIN}/logout`);
  url.searchParams.set('client_id', COGNITO_CLIENT_ID);
  url.searchParams.set('logout_uri', LOGOUT_URI);
  window.location.assign(url.toString());
}

// ==== Helpers ====
function randomString(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  // URL-safe base64 without padding
  return base64url(bytes);
}

async function pkceChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64url(new Uint8Array(digest));
}

function base64url(bytes) {
  // Convert bytes to base64url string
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
