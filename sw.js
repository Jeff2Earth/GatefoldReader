const CACHE = 'gatefold-v10-library-card-reset';

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
    await cache.addAll(LOCAL_ASSETS);

    // Cache external libraries independently so one temporary failure
    // does not prevent Gatefold Reader from installing.
    await Promise.allSettled(
      REMOTE_ASSETS.map(async url => {
        const response = await fetch(url, { mode: 'cors' });

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

  // Never cache the bookshelf, cover images, or large EPUB transfers.
  const requestUrl = new URL(event.request.url);

  if (
    /^(script\.google\.com|script\.googleusercontent\.com|drive\.google\.com|drive\.usercontent\.google\.com|www\.googleapis\.com)$/
      .test(requestUrl.hostname)
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);

    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(event.request);
      const copy = response.clone();
      const cache = await caches.open(CACHE);

      cache.put(event.request, copy).catch(() => {});

      return response;
    } catch (error) {
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }

      throw error;
    }
  })());
});
