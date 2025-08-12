// frontend/src/App.js
import React, { useEffect, useState } from 'react';
import api from './api';
import {
  isConfigured,
  isAuthenticated,
  login,
  logout,
  handleRedirectCallback,
} from './auth/cognito';

import {
  getHealth,
  listFragments,
  createFragment,
  updateFragment,
  deleteFragment,
  getFragmentInfo,
  getFragmentData,
  getFragmentConverted,
  arrayBufferToBlobUrl,
} from './services/fragments';

function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [busy, setBusy] = useState(false);

  const [status, setStatus] = useState('');
  const [fragments, setFragments] = useState([]);

  const [newText, setNewText] = useState('Hello from UI');
  const [file, setFile] = useState(null);

  const [selectedId, setSelectedId] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [targetExt, setTargetExt] = useState('html');

  // Handle Cognito redirect on /auth/callback
  useEffect(() => {
    if (window.location.pathname === '/auth/callback') {
      handleRedirectCallback();
      window.history.replaceState({}, '', '/');
      setAuthed(isAuthenticated());
    }
  }, []);

  // Keep authed state in sync across tabs
  useEffect(() => {
    const sync = () => setAuthed(isAuthenticated());
    window.addEventListener('storage', sync);
    window.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('visibilitychange', sync);
    };
  }, []);

  // ---------- actions ----------
  const fetchHealth = async () => {
    setBusy(true);
    try {
      const data = await getHealth();
      setStatus(JSON.stringify(data));
    } catch (e) {
      setStatus(`Health error: ${e.response?.status || ''} ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const refreshList = async () => {
    setBusy(true);
    try {
      const data = await listFragments();
      setFragments(data.fragments || []);
    } catch (e) {
      alert(`List error: ${e.response?.status || ''} ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const createText = async () => {
    setBusy(true);
    try {
      await createFragment(newText, 'text/plain; charset=utf-8');
      await refreshList();
    } catch (e) {
      alert(`Create error: ${e.response?.status || ''} ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const createJson = async () => {
    setBusy(true);
    try {
      await createFragment(JSON.stringify({ hello: 'world' }), 'application/json');
      await refreshList();
    } catch (e) {
      alert(`Create JSON error: ${e.response?.status || ''} ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const uploadImage = async () => {
    if (!file) return alert('Choose a file first.');
    setBusy(true);
    try {
      await createFragment(file, file.type || 'application/octet-stream');
      setFile(null);
      await refreshList();
    } catch (e) {
      alert(`Upload error: ${e.response?.status || ''} ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const viewFragment = async (id) => {
    setBusy(true);
    try {
      const info = await getFragmentInfo(id).catch(() => ({ fragment: { type: 'text/plain' } }));
      const mime = info?.fragment?.type || 'text/plain';
      const buf = await getFragmentData(id, mime);
      const url = arrayBufferToBlobUrl(buf, mime);
      setSelectedId(id);
      setPreviewUrl(url);
    } catch (e) {
      alert(`View error: ${e.response?.status || ''} ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const convertFragment = async (id) => {
    const ext = targetExt.trim();
    if (!ext) return;
    setBusy(true);
    try {
      const buf = await getFragmentConverted(id, ext);
      const mimeMap = {
        html: 'text/html',
        md: 'text/markdown',
        txt: 'text/plain',
        json: 'application/json',
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      };
      const url = arrayBufferToBlobUrl(buf, mimeMap[ext] || 'application/octet-stream');
      setSelectedId(id);
      setPreviewUrl(url);
    } catch (e) {
      alert(`Convert error: ${e.response?.status || ''} ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const updateText = async (id) => {
    const text = window.prompt('New text value:');
    if (!text) return;
    setBusy(true);
    try {
      await updateFragment(id, text, 'text/plain; charset=utf-8');
      await refreshList();
    } catch (e) {
      alert(`Update error: ${e.response?.status || ''} ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const removeFragment = async (id) => {
    if (!window.confirm('Delete this fragment?')) return;
    setBusy(true);
    try {
      await deleteFragment(id);
      await refreshList();
    } catch (e) {
      alert(`Delete error: ${e.response?.status || ''} ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = () => {
    if (!isConfigured()) {
      alert('Configure .env (.env.local) with API + Cognito first.');
      return;
    }
    login(); // redirects to Hosted UI
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setAuthed(false);
      setFragments([]);
      setPreviewUrl('');
      setSelectedId('');
    }
  };

  return (
    <div style={{ maxWidth: 820, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Fragments UI</h1>

      <section style={{ margin: '1rem 0', lineHeight: 1.6 }}>
        <div><strong>API:</strong> {process.env.REACT_APP_API_BASE_URL || '(not set)'}</div>
        <div><strong>Cognito domain:</strong> {process.env.REACT_APP_COGNITO_DOMAIN || '(not set)'}</div>
        {!isConfigured() && (
          <div style={{ color: 'crimson', marginTop: 8 }}>
            ⚠️ Configure .env.local (API + Cognito) and restart the dev server.
          </div>
        )}
      </section>

      <section style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button onClick={fetchHealth} disabled={busy}>Health</button>
        <span>{status}</span>
      </section>

      <section style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        {authed ? (
          <>
            <span>✅ Signed in</span>
            <button onClick={handleLogout} disabled={busy}>Logout</button>
          </>
        ) : (
          <>
            <span>❌ Signed out</span>
            <button onClick={handleLogin} disabled={!isConfigured() || busy}>
              Login with Cognito
            </button>
          </>
        )}
      </section>

      <hr />

      <section>
        <h2>Your Fragments</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={refreshList} disabled={!authed || busy}>Refresh List</button>
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            style={{ flex: 1 }}
            placeholder="New text fragment content"
          />
          <button onClick={createText} disabled={!authed || busy}>Create Text</button>
          <button onClick={createJson} disabled={!authed || busy}>Create JSON</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button onClick={uploadImage} disabled={!authed || !file || busy}>Upload Image</button>

          <label style={{ marginLeft: 16 }}>
            Convert to:&nbsp;
            <select value={targetExt} onChange={(e) => setTargetExt(e.target.value)}>
              <option value="html">html</option>
              <option value="md">md</option>
              <option value="txt">txt</option>
              <option value="json">json</option>
              <option value="jpeg">jpeg</option>
              <option value="png">png</option>
              <option value="webp">webp</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {fragments.map((id) => (
            <div key={id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <code style={{ flex: 1, overflowWrap: 'anywhere' }}>{id}</code>
              <button onClick={() => viewFragment(id)} disabled={!authed || busy}>View</button>
              <button onClick={() => convertFragment(id)} disabled={!authed || busy}>Convert</button>
              <button onClick={() => updateText(id)} disabled={!authed || busy}>Update (text)</button>
              <button onClick={() => removeFragment(id)} disabled={!authed || busy} style={{ color: 'crimson' }}>
                Delete
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          {previewUrl && (
            <>
              <h3>Preview {selectedId && <small>({selectedId})</small>}</h3>
              <div style={{ border: '1px solid #ddd', padding: 8 }}>
                <img
                  src={previewUrl}
                  alt=""
                  style={{ maxWidth: '100%', display: 'block' }}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <iframe
                  src={previewUrl}
                  title="preview"
                  style={{ width: '100%', height: 320, border: 'none' }}
                />
                <p><a href={previewUrl} download>Download result</a></p>
              </div>
            </>
          )}
        </div>

        <pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 6, minHeight: 120 }}>
{JSON.stringify(fragments, null, 2)}
        </pre>
      </section>

      <footer style={{ marginTop: 24, fontSize: 12, color: '#555' }}>
        Using base URL: {process.env.REACT_APP_API_BASE_URL || '(not set)'}
      </footer>
    </div>
  );
}

export default App;
