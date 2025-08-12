// frontend/src/auth/cognito.js
// Lightweight Cognito Hosted UI helper (implicit flow for demo)

const cfg = {
  domain:       process.env.REACT_APP_COGNITO_DOMAIN,          // e.g. us-east-1qrtv0zeoj.auth.us-east-1.amazoncognito.com
  region:       process.env.REACT_APP_COGNITO_REGION,          // optional
  clientId:     process.env.REACT_APP_COGNITO_CLIENT_ID,
  redirectUri:  process.env.REACT_APP_COGNITO_REDIRECT_URI,    // http://localhost:3000/auth/callback
  logoutUri:    process.env.REACT_APP_COGNITO_LOGOUT_URI,      // http://localhost:3000/
  responseType: process.env.REACT_APP_COGNITO_RESPONSE_TYPE || 'token',
  // IMPORTANT: space-separated, let URLSearchParams do encoding
  scope:        (process.env.REACT_APP_COGNITO_SCOPES || 'openid email').trim(),
};

const TOKENS_KEY = 'cog_tokens';

export function isConfigured() {
  return !!(cfg.domain && cfg.clientId && cfg.redirectUri);
}

export function buildAuthUrl() {
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    response_type: cfg.responseType,   // 'token' for implicit flow
    scope: cfg.scope,                  // 'openid email'
    redirect_uri: cfg.redirectUri,
  });
  return `https://${cfg.domain}/oauth2/authorize?${params.toString()}`;
}

export function buildLogoutUrl() {
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    logout_uri: cfg.logoutUri,
  });
  return `https://${cfg.domain}/logout?${params.toString()}`;
}

export function login() {
  if (!isConfigured()) {
    console.error('Cognito config missing:', {
      domain: !!cfg.domain,
      clientId: !!cfg.clientId,
      redirectUri: !!cfg.redirectUri,
    });
  }
  const url = buildAuthUrl();
  console.log('Auth URL ->', url);
  window.location.assign(url);
}

export function logout() {
  sessionStorage.removeItem(TOKENS_KEY);
  const url = buildLogoutUrl();
  console.log('Logout URL ->', url);
  window.location.assign(url);
}

function parseHash() {
  // Cognito returns tokens (or error) in the fragment: #access_token=...&id_token=...&...
  const hash = window.location.hash.replace(/^#/, '');
  return new URLSearchParams(hash);
}

export function handleRedirectCallback() {
  const p = parseHash();

  // If Cognito sent an error, surface it to the UI
  const error = p.get('error');
  if (error) {
    const desc = p.get('error_description') || error;
    console.error('Cognito callback error:', { error, desc });
    return { ok: false, error: desc };
  }

  const access_token = p.get('access_token');
  const id_token = p.get('id_token'); // may be null if response_type=token only
  const token_type = p.get('token_type') || 'Bearer';
  const expires_in = Number(p.get('expires_in') || '3600');

  if (!access_token) {
    console.error('No access_token present in callback fragment.');
    return { ok: false, error: 'No access token in callback' };
  }

  const expAt = Date.now() + expires_in * 1000;
  sessionStorage.setItem(TOKENS_KEY, JSON.stringify({ access_token, id_token, token_type, expAt }));

  return { ok: true };
}

export function getTokens() {
  try {
    const raw = sessionStorage.getItem(TOKENS_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    if (!t.expAt || Date.now() > t.expAt) {
      sessionStorage.removeItem(TOKENS_KEY);
      return null;
    }
    return t;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  const t = getTokens();
  return t?.access_token || null;
}

export function isAuthenticated() {
  return !!getAccessToken();
}
