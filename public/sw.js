self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Empty fetch handler to satisfy PWA installability requirements
  // No caching is performed. All requests pass through to the network natively.
});
