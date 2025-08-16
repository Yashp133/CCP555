import React, { useEffect, useState } from 'react';
import ky from 'ky';
import { login, logout, parseHashToken, getIdToken } from './auth';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');

export default function App() {
  const [idToken, setIdToken] = useState(getIdToken());
  const [text, setText] = useState('hello fragments!');
  const [lastResponse, setLastResponse] = useState(null);

  useEffect(() => {
    if (!idToken) {
      const found = parseHashToken();
      if (found) setIdToken(found);
    }
  }, [idToken]);

  const createFragment = async () => {
    const res = await ky.post(`${API_URL}/v1/fragments`, {
      headers: { 'Content-Type': 'text/plain', 'Authorization': `Bearer ${idToken}` },
      body: text,
      throwHttpErrors: false,
    });
    const body = await res.json().catch(() => ({}));
    setLastResponse({ status: res.status, headers: Object.fromEntries(res.headers.entries()), body });
  };

  const getList = async () => {
    const res = await ky.get(`${API_URL}/v1/fragments`, {
      headers: { 'Authorization': `Bearer ${idToken}` },
      throwHttpErrors: false,
    });
    const body = await res.json().catch(() => ({}));
    setLastResponse({ status: res.status, headers: Object.fromEntries(res.headers.entries()), body });
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 800, margin: '40px auto' }}>
      <h1>Fragments UI</h1>

      <section style={{ marginBottom: 20 }}>
        <p><strong>API_URL:</strong> {API_URL || '(not set)'}</p>
        <p><strong>Signed in:</strong> {idToken ? 'Yes' : 'No'}</p>
        {!idToken ? (
          <button onClick={login}>Sign in with Cognito</button>
        ) : (
          <button onClick={logout}>Sign out</button>
        )}
      </section>

      {idToken && (
        <>
          <section style={{ marginBottom: 20 }}>
            <h2>Create text fragment</h2>
            <textarea rows={4} style={{ width: '100%' }} value={text} onChange={(e) => setText(e.target.value)} />
            <div style={{ marginTop: 8 }}>
              <button onClick={createFragment}>POST /v1/fragments (text/plain)</button>
              <button onClick={getList} style={{ marginLeft: 8 }}>GET /v1/fragments</button>
            </div>
          </section>

          <section>
            <h2>Last response</h2>
            <pre style={{ background: '#111', color: '#0f0', padding: 12, overflow: 'auto' }}>
{lastResponse ? JSON.stringify(lastResponse, null, 2) : '—'}
            </pre>
            {lastResponse?.headers?.location && <p><strong>Location:</strong> {lastResponse.headers.location}</p>}
          </section>
        </>
      )}
    </div>
  );
}
