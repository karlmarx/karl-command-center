// Minimum-viable service worker. Required for Android Chrome PWA installability —
// the browser checks for a registered SW with a fetch handler. We pass everything
// through to the network. No caching in v1 so the dashboard never shows stale data.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
