// frontend/src/auth/cognito.js
// Hosted UI (Authorization Code + PKCE) helpers for the SPA.

function normalizeDomain(raw) {
  let d = (raw || '').trim();
  d = d.replace(/^https\/\/+/i, 'https://').replace(/^http\/\/+/i, 'http://');
  if (!/^https?:\/\//i.test(d)) d = `https://${d}`;
  d = d.replace(/\/+$/, '');
  return d;
}

const COGNITO_DOMAIN = normalizeDomain(process.env.REACT_APP_COGNITO_DOMAIN || '');
const COGNITO_CLIENT_ID = process.env.REACT_APP_COGNITO_CLIENT_ID || '';
const REDIRECT_URI =
  process.env.REACT_APP_COGNITO_REDIRECT_URI || `${window.location.origin}/auth/callback`;
const LOGOUT_URI =
  process.env.REACT_APP_COGNITO_LOGOUT_URI || `${window.location.origin}`;
const SCOPES = (process.env.REACT_APP_COGNITO_SCOPES || 'openid').trim();

const K = {
  access: 'cog.access_token',
  id: 'cog.id_token',
  refresh: 'cog.refresh_token',
  expires: 'cog.expires_at',
  state: 'cog.pkce_state',
  verifier: 'cog.pkce_verifier',
  cbCode: 'cog.cb.last_code',      // guard against double exchange
  processing: 'cog.cb.processing', // extra guard
};

// ---------- public helpers ----------
export function isConfigured() {
  return Boolean(COGNITO_DOMAIN && COGNITO_CLIENT_ID);
}

export function isAuthenticated() {
  return Boolean(getBearerToken());
}

export function getAccessToken() {
  const token = localStorage.getItem(K.access);
  const exp = Number(localStorage.getItem(K.expires) || 0);
  if (!token || !exp) return null;
  if (Date.now() > exp - 60_000) return null;
  return token;
}

export function getIdToken() {
  const token = localStorage.getItem(K.id);
  const exp = Number(localStorage.getItem(K.expires) || 0);
  if (!token || !exp) return null;
  if (Date.now() > exp - 60_000) return null;
  return token;
}

export function getBearerToken() {
  // Many backends validate the ID token; fall back to access token if needed
  return getIdToken() || getAccessToken();
}

// Decode ID token payload for UI (email, sub, etc.)
function decodeJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  try {
    const json = atob(b64 + pad);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getIdClaims() {
  return decodeJwt(getIdToken());
}

// ---------- login / logout ----------
export async function login() {
  if (!isConfigured()) throw new Error('Cognito not configured');

  const state = randomString(32);
  const verifier = randomString(64);
  const challenge = await pkceChallenge(verifier);

  sessionStorage.setItem(K.state, state);
  sessionStorage.setItem(K.verifier, verifier);

  const url = new URL(`${COGNITO_DOMAIN}/oauth2/authorize`);
  url.searchParams.set('client_id', COGNITO_CLIENT_ID);
  url.searchParams.set('response_type', 'code');           // PKCE code flow
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('code_challenge', challenge);

  console.log('Auth URL →', url.toString());
  window.location.assign(url.toString());
}

export async function handleRedirectCallback() {
  const params = new URLSearchParams(window.location.search);
  const err = params.get('error');
  const errDesc = params.get('error_description');
  const code = params.get('code');
  const state = params.get('state');

  // No code? just clean the URL and return
  if (!code) {
    window.history.replaceState({}, '', '/');
    return;
  }

  // already processed / currently processing? no-op (handles React StrictMode)
  if (sessionStorage.getItem(K.processing) === '1' || sessionStorage.getItem(K.cbCode) === code) {
    window.history.replaceState({}, '', '/');
    return;
  }

  const storedState = sessionStorage.getItem(K.state);
  const verifier = sessionStorage.getItem(K.verifier);

  try {
    if (err) {
      console.error('Auth error:', err, errDesc || '');
      alert(`Login failed: ${errDesc || err}`);
      return;
    }

    if (!state || !storedState || state !== storedState) throw new Error('Invalid OAuth state');
    if (!verifier) throw new Error('Missing PKCE verifier');

    sessionStorage.setItem(K.processing, '1');
    sessionStorage.setItem(K.cbCode, code);

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
      // if a duplicate exchange happens after success, avoid scaring the user
      if (!isAuthenticated()) {
        alert(`Login failed: Token exchange failed: ${resp.status} ${txt}`);
      } else {
        console.warn('Duplicate token exchange ignored:', txt);
      }
      return;
    }

    const json = await resp.json();
    const now = Date.now();
    const expiresInSec = Number(json.expires_in || 3600);
    // store both; API will typically use the ID token
    if (json.id_token) localStorage.setItem(K.id, json.id_token);
    localStorage.setItem(K.access, json.access_token || '');
    if (json.refresh_token) localStorage.setItem(K.refresh, json.refresh_token);
    localStorage.setItem(K.expires, String(now + expiresInSec * 1000));
  } finally {
    sessionStorage.removeItem(K.state);
    sessionStorage.removeItem(K.verifier);
    sessionStorage.removeItem(K.processing);
    window.history.replaceState({}, '', '/');
  }
}

export async function logout() {
  // clear local tokens
  Object.values(K).forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  if (!isConfigured()) {
    window.location.assign(LOGOUT_URI);
    return;
  }

  const url = new URL(`${COGNITO_DOMAIN}/logout`);
  url.searchParams.set('client_id', COGNITO_CLIENT_ID);
  url.searchParams.set('logout_uri', LOGOUT_URI);

  console.log('Logout URL →', url.toString());
  window.location.assign(url.toString());
}

// ---------- utils ----------
function randomString(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}
async function pkceChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64url(new Uint8Array(digest));
}
function base64url(bytes) {
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
