const CACHE = 'gatefold-V10.4  CoverArtHomepage Version 4.89988';
const COVER_CACHE = 'gatefold-cover-thumb-v1';

const pendingShares = new Map();

function generateUUID() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, function(c) {
    return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
  });
}

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './KJV%20Strongs.epub'
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
  const requestUrl = new URL(request.url);

  if (request.method === 'POST' && requestUrl.pathname.endsWith('/share-book')) {
    event.respondWith((async () => {
      try {
        const formData = await request.formData();
        const file = formData.get('book');
        if (!file || !(file instanceof File)) return new Response('No file', {status: 400});
        const token = generateUUID();
        pendingShares.set(token, {file, name: file.name});
        return Response.redirect(new URL('./index.html?shared-book=' + token, requestUrl.href).href, 303);
      } catch(e) {
        return new Response('Share failed', {status: 500});
      }
    })());
    return;
  }

  if (requestUrl.pathname.includes('/incoming-epub/')) {
    const token = requestUrl.pathname.split('/incoming-epub/')[1];
    if (request.method === 'GET') {
      event.respondWith((async () => {
        const pending = pendingShares.get(token);
        if (!pending) return new Response('Not found', {status: 404});
        return new Response(pending.file, {
          status: 200,
          headers: {
            'Content-Type': pending.file.type || 'application/epub+zip',
            'X-Book-Name': encodeURIComponent(pending.name || 'Shared.epub')
          }
        });
      })());
      return;
    }
    if (request.method === 'DELETE') {
      event.respondWith((async () => {
        pendingShares.delete(token);
        return new Response(null, {status: 204});
      })());
      return;
    }
  }

  if (request.method !== 'GET') {
    return;
  }

  const requestUrlForCache = requestUrl;

  /*
   * Cache only the small Google Drive cover thumbnails.
   * The saved thumbnail appears immediately while a fresh copy
   * is downloaded quietly in the background.
   */
  if (
    requestUrlForCache.hostname === 'drive.google.com' &&
    requestUrlForCache.pathname === '/thumbnail'
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
    requestUrlForCache.hostname === 'script.google.com' ||
    requestUrlForCache.hostname.endsWith('.googleusercontent.com') ||
    requestUrlForCache.hostname === 'www.googleapis.com' ||
    requestUrlForCache.hostname === 'drive.google.com'
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
