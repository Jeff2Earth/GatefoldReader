
const SHARE_CACHE = 'gatefold-incoming-epub-v1';
const SHARE_URL = new URL('./share-book', self.registration.scope);
const INCOMING_URL = new URL('./incoming-epub/', self.registration.scope);

async function receiveBook(request) {
  try {
    const form = await request.formData();
    const file = form.getAll('book').find(
      f => typeof f !== 'string' && /\.epub$/i.test(f.name || '')
    );

    if (!file) {
      return new Response('Please share an EPUB file.', { status: 400 });
    }

    const token = crypto.randomUUID();
    const cache = await caches.open(SHARE_CACHE);

    // Remove abandoned transfers older than a day.
    for (const key of await cache.keys()) {
      const old = await cache.match(key);
      if (Date.now() - Number(old.headers.get('X-Saved-At') || 0) > 86400000) {
        await cache.delete(key);
      }
    }

    await cache.put(
      new URL(token, INCOMING_URL).href,
      new Response(file, {
        headers: {
          'Content-Type': 'application/epub+zip',
          'X-Book-Name': encodeURIComponent(file.name),
          'X-Saved-At': String(Date.now())
        }
      })
    );

    const target = new URL('./index.html', self.registration.scope);
    target.searchParams.set('shared-book', token);
    return Response.redirect(target.href, 303);
  } catch (error) {
    return new Response('Could not receive this book. Please use Load Book.', {
      status: 500
    });
  }
}

const CACHE = 'gatefold-v4-share1';

const LOCAL_ASSETs = [
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
    await cache.addAll(LOCAL_ASSETs);

    // One unavailable external library should not prevent installation.
    await Promise.allSettled(
      REMOTE_ASSETS.map(async url => {
        const response = await fetch(url, { mode: 'cors' });
        if (response.ok) await cache.put(url, response.clone());
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
        .filter(k => /^gatefold-v/.test(k) && k !== CACHE)
        .map(k => caches.delete(k))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (
    url.origin === SHARE_URL.origin &&
    url.pathname === SHARE_URL.pathname &&
    event.request.method === 'POST'
  ) {
    event.respondWith(receiveBook(event.request));
    return;
  }

  if (
    url.origin === INCOMING_URL.origin &&
    url.pathname.startsWith(INCOMING_URL.pathname)
  ) {
    event.respondWith((async () => {
      const cache = await caches.open(SHARE_CACHE);

      if (event.request.method === 'DELETE') {
        await cache.delete(url.href);
        return new Response(null, { status: 204 });
      }

      return await cache.match(url.href) ||
        new Response('Book not found', { status: 404 });
    })());
    return;
  }

  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    const cached = await caches.match(event.request) ||
      (
        event.request.mode === 'navigate' &&
        url.searchParams.has('shared-book')
          ? await caches.match(
              new URL('./index.html', self.registration.scope).href
            )
          : null
      );

    if (cached) return cached;

    try {
      const response = await fetch(event.request);
      const copy = response.clone();
      const cache = await caches.open(CACHE);
      cache.put(event.request, copy).catch(() => {});
      return response;
    } catch (err) {
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
      throw err;
    }
  })());
});
