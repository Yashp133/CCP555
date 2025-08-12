// --- Simple Fragments UI auth + calls (Cognito Hosted UI, Implicit flow) ---

import axios from 'axios';

// ----- ENV -----
const API_BASE = process.env.REACT_APP_API_BASE_URL; // http://fragments-alb-...elb.amazonaws.com
const COGNITO_DOMAIN = process.env.REACT_APP_COGNITO_DOMAIN; // us-east-1qrtv0zeoj.auth.us-east-1.amazoncognito.com
const COGNITO_REGION = process.env.REACT_APP_COGNITO_REGION || 'us-east-1';
const COGNITO_CLIENT_ID = process.env.REACT_APP_COGNITO_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_COGNITO_REDIRECT_URI; // http://localhost:3000/auth/callback
const LOGOUT_URI = process.env.REACT_APP_COGNITO_LOGOUT_URI;     // http://localhost:3000/
const RESPONSE_TYPE = process.env.REACT_APP_COGNITO_RESPONSE_TYPE || 'token';
const SCOPES = (process.env.REACT_APP_COGNITO_SCOPES || 'openid email').replace(/\s+/g, '+');

// ----- DOM -----
const el = (id) => document.getElementById(id);

// ----- Token store -----
function saveTokens({ access_token, id_token, expires_in }) {
  if (access_token) localStorage.setItem('access_token', access_token);
  if (id_token) localStorage.setItem('id_token', id_token);
  if (expires_in) {
    const expAt = Date.now() + Number(expires_in) * 1000;
    localStorage.setItem('token_exp', String(expAt));
  }
}
function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('id_token');
  localStorage.removeItem('token_exp');
}
function getBearer() {
  // prefer id_token (what our API usually verifies), fallback to access_token
  return localStorage.getItem('id_token') || localStorage.getItem('access_token');
}
function isLoggedIn() {
  const t = getBearer();
  const exp = Number(localStorage.getItem('token_exp') || '0');
  return Boolean(t) && (!exp || Date.now() < exp);
}

// ----- Cognito URLs -----
function authUrl() {
  const u = new URL(`https://${COGNITO_DOMAIN}/oauth2/authorize`);
  u.searchParams.set('client_id', COGNITO_CLIENT_ID);
  u.searchParams.set('response_type', RESPONSE_TYPE); // implicit -> token
  u.searchParams.set('scope', SCOPES);
  u.searchParams.set('redirect_uri', REDIRECT_URI);
  return u.toString();
}
function logoutUrl() {
  const u = new URL(`https://${COGNITO_DOMAIN}/logout`);
  u.searchParams.set('client_id', COGNITO_CLIENT_ID);
  u.searchParams.set('logout_uri', LOGOUT_URI);
  return u.toString();
}

// ----- Parse hash on /auth/callback -----
function parseHashFragment(hash) {
  // e.g. "#id_token=...&access_token=...&expires_in=3600&token_type=Bearer"
  const out = {};
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  h.split('&').forEach((pair) => {
    const [k, v] = pair.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return out;
}

// ----- UI wiring -----
async function refreshHealth() {
  try {
    const { data } = await axios.get(`${API_BASE}/v1/health`);
    el('health').textContent = JSON.stringify(data);
  } catch (e) {
    el('health').textContent = `Health error: ${e.message}`;
  }
}
async function refreshList() {
  if (!isLoggedIn()) {
    el('fragments').textContent = '[]';
    return;
  }
  try {
    const token = getBearer();
    const { data } = await axios.get(`${API_BASE}/v1/fragments?expand=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    el('fragments').textContent = JSON.stringify(data.fragments || [], null, 2);
  } catch (e) {
    el('fragments').textContent = `List error: ${e.message}`;
  }
}
async function createText() {
  const token = getBearer();
  const value = el('newText').value || 'Hello from UI';
  await axios.post(`${API_BASE}/v1/fragments`, value, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
  });
  el('newText').value = '';
  await refreshList();
}

function updateAuthState() {
  el('status').textContent = isLoggedIn() ? '✅ Signed in' : '❌ Signed out';
  el('btnLogin').disabled = isLoggedIn();
  el('btnLogout').disabled = !isLoggedIn();
  el('btnCreate').disabled = !isLoggedIn();
  el('btnRefresh').disabled = !isLoggedIn();
}

// ----- Event handlers -----
function handleLogin() {
  window.location.assign(authUrl());
}
function handleLogout() {
  clearTokens();
  // hit Cognito to clear its SSO cookies too
  window.location.assign(logoutUrl());
}

// ----- Boot -----
async function boot() {
  // If we're on /auth/callback with a hash, capture tokens then bounce home
  if (window.location.pathname === new URL(REDIRECT_URI).pathname && window.location.hash) {
    const tokens = parseHashFragment(window.location.hash);
    if (tokens.error) {
      console.error('Auth error:', tokens.error, tokens.error_description);
      alert(`Login failed: ${tokens.error_description || tokens.error}`);
    } else {
      saveTokens(tokens);
    }
    // Clean up the URL and go home
    window.location.replace('/');
    return;
  }

  // Wire buttons
  el('btnHealth').onclick = refreshHealth;
  el('btnLogin').onclick = handleLogin;
  el('btnLogout').onclick = handleLogout;
  el('btnCreate').onclick = createText;
  el('btnRefresh').onclick = refreshList;

  el('apiBase').textContent = API_BASE;
  el('cognitoDomain').textContent = `https://${COGNITO_DOMAIN}`;

  updateAuthState();
  await refreshHealth();
  if (isLoggedIn()) await refreshList();
}

boot();
