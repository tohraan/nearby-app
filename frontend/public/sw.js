const CACHE_NAME = 'nearby-app-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event: cache core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ── GUARD: only handle http/https requests ──
  // chrome-extension://, data:, blob:, etc. will crash cache.put()
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Bypass for dev server websocket / HMR
  if (url.port === '5173' || url.port === '5174') return;

  // API Requests: Network only (offline caching handled in-app via IndexedDB)
  if (url.pathname.startsWith('/api') || url.port === '3001') {
    return; // Fall through to standard network fetch
  }

  // Static assets: Cache-first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        // Only cache successful GET responses for http/https URLs
        if (
          event.request.method === 'GET' &&
          networkResponse.ok &&
          (url.protocol === 'http:' || url.protocol === 'https:')
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
