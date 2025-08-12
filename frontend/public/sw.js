// Very small SW to cache the basic app shell so it opens offline.
// API calls are not cached; UI falls back to last known list from localStorage.

const CACHE = 'fragments-static-v1';
const SHELL = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only try to serve GET shell files from cache; let API calls go to network.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Cache-first for shell files
  if (SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request))
    );
    return;
  }

  // For other GETs, try network; fall back to cache if available
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
