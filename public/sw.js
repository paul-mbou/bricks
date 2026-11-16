/* Bricks service worker — static assets only; never poison HTML/auth shells. */
const CACHE = 'bricks-v3';
const PRECACHE = ['/manifest.webmanifest', '/favicon.svg'];

/** Only same-origin /app paths — blocks open redirects from push payloads. */
function safeAppUrl(raw) {
  try {
    const url = new URL(String(raw || '/app'), self.location.origin);
    if (url.origin !== self.location.origin) return `${self.location.origin}/app`;
    if (!url.pathname.startsWith('/app')) return `${self.location.origin}/app`;
    return url.href;
  } catch {
    return `${self.location.origin}/app`;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache cross-origin (Appwrite, CDNs) — opaque responses corrupt auth.
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML / navigation — avoids stale auth-pending shells.
  if (request.mode === 'navigate' || (request.headers.get('accept') ?? '').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() =>
          caches.match('/connexion').then((cached) => cached ?? new Response('Hors ligne', { status: 503 })),
        ),
    );
    return;
  }

  // Cache-first for content-hashed Astro assets.
  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE).then((cache) => cache.put(request, response.clone())).catch(() => {});
          }
          return response;
        });
      }),
    );
    return;
  }

  // Stale-while-revalidate for icons / manifest — never respondWith(undefined).
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE).then((cache) => cache.put(request, response.clone())).catch(() => {});
          }
          return response;
        })
        .catch(() => cached ?? new Response('Hors ligne', { status: 503 }));
      return cached ?? fetched;
    }),
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Bricks', body: 'Nouvelle alerte', url: '/app/alertes' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* ignore malformed push */
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Bricks', {
      body: data.body || 'Nouvelle alerte',
      data: { url: safeAppUrl(data.url) },
      icon: '/favicon.svg',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = safeAppUrl(event.notification.data?.url);
  event.waitUntil(clients.openWindow(url));
});
