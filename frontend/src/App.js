import React, { useEffect, useState } from 'react';
import api from './api';
import {
  isConfigured,
  isAuthenticated,
  login,
  logout,
  handleRedirectCallback,
} from './auth/cognito';

function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [status, setStatus] = useState('');
  const [fragments, setFragments] = useState([]);
  const [newText, setNewText] = useState('Hello from UI');

  // Handle Cognito redirect on /auth/callback
  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      handleRedirectCallback();
      window.history.replaceState({}, '', '/');
      setAuthed(isAuthenticated());
    }
  }, []);

  const fetchHealth = async () => {
    try {
      const { data } = await api.get('/v1/health');
      setStatus(JSON.stringify(data));
    } catch (e) {
      setStatus(`Health error: ${e.message}`);
    }
  };

  const listFragments = async () => {
    try {
      const { data } = await api.get('/v1/fragments');
      setFragments(data.fragments || []);
    } catch (e) {
      alert(`List error: ${e.message}`);
    }
  };

  const createText = async () => {
    try {
      const res = await api.post('/v1/fragments', newText, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
      alert(`Created: ${res.data.fragment.id}`);
      await listFragments();
    } catch (e) {
      alert(`Create error: ${e.message}`);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Fragments UI</h1>

      <section style={{ margin: '1rem 0' }}>
        <strong>API:</strong> {process.env.REACT_APP_API_BASE_URL || '(not set)'}
        <br />
        <strong>Cognito domain:</strong> {process.env.REACT_APP_COGNITO_DOMAIN || '(not set)'}
      </section>

      <section style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        {!isConfigured() && (
          <div style={{ color: 'crimson' }}>
            ⚠️ Configure .env.local (API + Cognito) and restart the dev server.
          </div>
        )}
        <button onClick={fetchHealth}>Health</button>
        <span>{status}</span>
      </section>

      <section style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        {authed ? (
          <>
            <span>✅ Signed in</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <span>❌ Signed out</span>
            <button onClick={login} disabled={!isConfigured()}>
              Login with Cognito
            </button>
          </>
        )}
      </section>

      <hr />

      <section>
        <h2>Your Fragments</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={listFragments} disabled={!authed}>
            Refresh List
          </button>
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            style={{ flex: 1 }}
            placeholder="New text fragment content"
          />
          <button onClick={createText} disabled={!authed}>
            Create Text
          </button>
        </div>
        <pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 6 }}>
{JSON.stringify(fragments, null, 2)}
        </pre>
      </section>
    </div>
  );
}

export default App;
