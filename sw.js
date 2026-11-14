/* ─────────────────────────────────────────────────────────────
   Gatefold Reader — Service Worker
   CHANGE THIS NUMBER every time you update index.html:
   ───────────────────────────────────────────────────────────── */
const VERSION = 'v346567';
/* ─────────────────────────────────────────────────────────────── */

const CACHE = 'gatefold-' + VERSION;

const PRECACHE = [
  './',
  './index.html',
];

/* Install: cache the shell */
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(PRECACHE);
    })
  );
});

/* Activate: delete every old cache whose name doesn't match CACHE */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

/* Fetch: cache-first for same-origin, network-only for everything else */
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;   /* CDN / external — skip */

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        var clone = response.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        return response;
      });
    })
  );
});
