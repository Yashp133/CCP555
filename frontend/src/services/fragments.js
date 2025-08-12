// frontend/src/services/fragments.js
import api from '../api';

// ---- Public ----
export const getHealth = () =>
  api.get('/v1/health', { headers: { Accept: 'application/json' } })
     .then(r => r.data);

// ---- Auth required ----
export const listFragments = () =>
  api.get('/v1/fragments', { headers: { Accept: 'application/json' } })
     .then(r => r.data);

export const getFragmentInfo = (id) =>
  api.get(`/v1/fragments/${id}/info`, { headers: { Accept: 'application/json' } })
     .then(r => r.data);

// Raw data (Accept decides format)
export const getFragmentData = (id, accept = 'text/plain') =>
  api.get(`/v1/fragments/${id}`, {
    responseType: 'arraybuffer',
    headers: { Accept: accept },
  }).then(r => r.data);

// Convert via .ext (e.g., md->html, png->jpeg)
export const getFragmentConverted = (id, ext) =>
  api.get(`/v1/fragments/${id}.${ext}`, { responseType: 'arraybuffer' })
     .then(r => r.data);

// Create / Update / Delete
export const createFragment = (data, contentType) =>
  api.post('/v1/fragments', data, { headers: { 'Content-Type': contentType } })
     .then(r => r.data);

export const updateFragment = (id, data, contentType) =>
  api.put(`/v1/fragments/${id}`, data, { headers: { 'Content-Type': contentType } })
     .then(r => r.data);

export const deleteFragment = (id) =>
  api.delete(`/v1/fragments/${id}`).then(r => r.data);

// Helper for previews
export function arrayBufferToBlobUrl(buf, mime = 'application/octet-stream') {
  const blob = new Blob([buf], { type: mime });
  return URL.createObjectURL(blob);
}
