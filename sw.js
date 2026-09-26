const CACHE = 'gatefold-v33-aged-shelf';
const COVER_CACHE = 'gatefold-cover-thumbnails-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key => key !== CACHE && key !== COVER_CACHE)
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
   * Cache only the small Google Drive cover thumbnails.
   * The saved thumbnail appears immediately while a fresh copy
   * is downloaded quietly in the background.
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
   * Never cache the live Apps Script catalog, Google API requests,
   * or large Google Drive EPUB downloads.
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
   * Normal app files use the cache first.
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

        caches.open(CACHE).then(cache => {
          cache.put(request, responseCopy);
        });

        return networkResponse;
      });
    })
  );
});
