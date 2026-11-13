/*
 * sw.js — Gatefold Reader service worker
 *
 * index.html is intentionally NOT cached: it is always fetched fresh from
 * the network so new builds go live immediately without touching this file.
 * Only cover thumbnails and the manifest get cached.
 */

const COVER_CACHE = 'gatefold-cover-thumbnails-v1';
const SHELL_CACHE = 'gatefold-shell-v2';  /* bumped to bust stale root-path cache */

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(['./manifest.json']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(key => key !== SHELL_CACHE && key !== COVER_CACHE)
          .map(key => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);

  /*
   * index.html — always fetch from network so every new build is live
   * immediately. Fall back to cache only when offline.
   */
  if (
    requestUrl.pathname === '/' ||
    requestUrl.pathname.endsWith('/') ||      /* catches /GatefoldReader/ subdirectory root */
    requestUrl.pathname.endsWith('/index.html')
  ) {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => caches.match(request))
    );
    return;
  }

  /*
   * Cover thumbnails: stale-while-revalidate so they appear instantly
   * and refresh in the background.
   */
  if (
    requestUrl.hostname === 'drive.google.com' &&
    requestUrl.pathname === '/thumbnail'
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(COVER_CACHE);
        const cachedCover = await cache.match(request);

        const freshCover = fetch(request)
          .then(response => {
            if (response && response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cachedCover);

        return cachedCover || freshCover;
      })()
    );
    return;
  }

  /*
   * Never cache live API calls or large EPUB downloads.
   */
  if (
    requestUrl.hostname === 'script.google.com' ||
    requestUrl.hostname.endsWith('.googleusercontent.com') ||
    requestUrl.hostname === 'www.googleapis.com' ||
    requestUrl.hostname === 'drive.google.com'
  ) {
    event.respondWith(fetch(request));
    return;
  }

  /*
   * Everything else (manifest, etc.) — cache first.
   */
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then(networkResponse => {
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type === 'opaque'
        ) {
          return networkResponse;
        }
        const responseCopy = networkResponse.clone();
        caches.open(SHELL_CACHE).then(cache => {
          cache.put(request, responseCopy);
        });
        return networkResponse;
      });
    })
  );
});
