const CACHE = 'gatefold-v3';

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
    // Bypass HTTP cache too, so a fresh install always grabs the real
    // current files rather than whatever was cached at the network edge.
    await Promise.all(
      LOCAL_ASSETS.map(async url => {
        try {
          const response = await fetch(url, {cache: 'no-store'});
          if (response.ok) await cache.put(url, response.clone());
        } catch (err) {}
      })
    );

    // Cache each external library independently so one temporary CDN failure
    // does not prevent the PWA itself from installing. These are pinned to
    // exact version numbers in their URLs, so they never change and are
    // safe to cache aggressively.
    await Promise.allSettled(
      REMOTE_ASSETS.map(async url => {
        const response = await fetch(url, {mode:'cors'});
        if (response.ok) await cache.put(url, response.clone());
      })
    );
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const isNavigation = event.request.mode === 'navigate';
  const url = new URL(event.request.url);
  const isLocalAppFile = url.origin === self.location.origin;

  if (isNavigation || isLocalAppFile) {
    // Network-first for the app's own files (HTML/JS/manifest/icons), so any
    // update pushed to GitHub Pages is picked up the next time the app is
    // opened with a connection, instead of silently serving whatever was
    // cached at install time forever. Cache is only a fallback for offline use.
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, {cache: 'no-store'});
        const copy = response.clone();
        const cache = await caches.open(CACHE);
        cache.put(event.request, copy).catch(() => {});
        return response;
      } catch (err) {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (isNavigation) return caches.match('./index.html');
        throw err;
      }
    })());
    return;
  }

  // Cache-first for external CDN libraries. These URLs are pinned to exact
  // version numbers (e.g. /turn.js/3/turn.min.js), so the content behind a
  // given URL never changes — caching aggressively here is safe and keeps
  // the app fast and usable offline.
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    try {
      const response = await fetch(event.request);
      const copy = response.clone();
      const cache = await caches.open(CACHE);
      cache.put(event.request, copy).catch(() => {});
      return response;
    } catch (err) {
      throw err;
    }
  })());
});
