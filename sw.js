const CACHE = 'gatefold-v6-install-fix';

const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

const REMOTE_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/1.8.3/jquery.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/turn.js/3/turn.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.11.0/mammoth.browser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.min.mjs',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);

    // Cache files individually so ONE missing/stale file cannot
    // prevent the entire PWA service worker from installing.
    await Promise.allSettled(
      LOCAL_ASSETS.map(async url => {
        const response = await fetch(url, { cache: 'reload' });

        if (response.ok) {
          await cache.put(url, response.clone());
        }
      })
    );

    await Promise.allSettled(
      REMOTE_ASSETS.map(async url => {
        const response = await fetch(url, {
          mode: 'cors',
          cache: 'reload'
        });

        if (response.ok) {
          await cache.put(url, response.clone());
        }
      })
    );
  })());

  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key => key !== CACHE)
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestURL = new URL(event.request.url);

  // Always prefer the newest HTML and manifest.
  if (
    event.request.mode === 'navigate' ||
    requestURL.pathname.endsWith('/manifest.json')
  ) {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, {
          cache: 'no-store'
        });

        if (response.ok) {
          const cache = await caches.open(CACHE);
          cache.put(event.request, response.clone()).catch(() => {});
        }

        return response;

      } catch (err) {
        const cached =
          await caches.match(event.request) ||
          await caches.match('./index.html');

        if (cached) return cached;

        throw err;
      }
    })());

    return;
  }

  // Everything else can be cache-first.
  event.respondWith((async () => {
    const cached = await caches.match(event.request);

    if (cached) return cached;

    try {
      const response = await fetch(event.request);

      if (response && response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(event.request, response.clone()).catch(() => {});
      }

      return response;

    } catch (err) {
      throw err;
    }
  })());
});
