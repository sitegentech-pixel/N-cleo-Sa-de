const STATIC_CACHE = 'ns-static-v11';
const CDN_CACHE    = 'ns-cdn-v1';
const API_CACHE    = 'ns-api-v1';
const ALL_CACHES   = [STATIC_CACHE, CDN_CACHE, API_CACHE];

const STATIC_FILES = [
  '/index.html',
  '/index.prod.html',
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
  '/app/calendario.jsx',
  '/app/workspace.jsx',
  '/app/feedback.jsx',
  '/app/usuarios.jsx',
  '/app/perfil.jsx',
  '/app/main.jsx',
  '/dist/app/icons.js',
  '/dist/app/ui.js',
  '/dist/app/tweaks-panel.js',
  '/dist/app/data.js',
  '/dist/app/extras.js',
  '/dist/app/sidebar.js',
  '/dist/app/login.js',
  '/dist/app/dashboard.js',
  '/dist/app/pendencias.js',
  '/dist/app/demandas.js',
  '/dist/app/equipe.js',
  '/dist/app/calendario.js',
  '/dist/app/workspace.js',
  '/dist/app/feedback.js',
  '/dist/app/usuarios.js',
  '/dist/app/perfil.js',
  '/dist/app/main.js',
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
    // { cache: 'reload' } bypasses the browser HTTP cache (which marks /dist/
    // as immutable) so the precache is always populated with fresh files.
    caches.open(STATIC_CACHE).then(cache =>
      cache.addAll(STATIC_FILES.map(u => new Request(u, { cache: 'reload' })))
    )
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
    event.respondWith(apiNetworkFirst(request, API_CACHE));
    return;
  }

  if (CDN_ORIGINS.some(o => request.url.startsWith(o))) {
    event.respondWith(staleWhileRevalidate(request, CDN_CACHE));
    return;
  }

  // Our own HTML + compiled JS + assets: network-first so a new deploy always
  // wins over stale cache. Falls back to cache when offline.
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    // cache: 'reload' bypasses the immutable HTTP cache on /dist/ assets.
    const response = await fetch(request, { cache: 'reload' });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const fallback = await cache.match('/index.prod.html');
      if (fallback) return fallback;
    }
    return Response.error();
  }
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

async function apiNetworkFirst(request, cacheName) {
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
