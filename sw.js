const STATIC_CACHE = 'ns-static-v1';
const CDN_CACHE    = 'ns-cdn-v1';
const API_CACHE    = 'ns-api-v1';
const ALL_CACHES   = [STATIC_CACHE, CDN_CACHE, API_CACHE];

const STATIC_FILES = [
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/app/icons.jsx',
  '/app/ui.jsx',
  '/app/tweaks-panel.jsx',
  '/app/data.jsx',
  '/app/extras.jsx',
  '/app/sidebar.jsx',
  '/app/login.jsx',
  '/app/dashboard.jsx',
  '/app/pendencias.jsx',
  '/app/demandas.jsx',
  '/app/equipe.jsx',
  '/app/feedback.jsx',
  '/app/usuarios.jsx',
  '/app/main.jsx',
  '/ico.jpg',
  '/og.jpg',
];

const CDN_ORIGINS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com',
  'https://cdn.jsdelivr.net',
];

const SUPABASE_ORIGIN = 'https://fmxgsqkxhcbydvaqzefs.supabase.co';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin === SUPABASE_ORIGIN) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (CDN_ORIGINS.some(o => request.url.startsWith(o))) {
    event.respondWith(staleWhileRevalidate(request, CDN_CACHE));
    return;
  }

  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache        = await caches.open(cacheName);
  const cached       = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
