/* VivasayiMart service worker
 * - App shell + built assets: work offline after the first visit
 * - Selected GET API calls (listings, farmer pages, orders, session): network first, cached copy when offline
 * - Never caches writes (POST/PUT/DELETE), logins, AI calls, or admin data
 * The page clears the API cache on login/logout so one user's data never shows for another.
 */
const VERSION = 'v1';
const STATIC_CACHE = `vm-static-${VERSION}`;
const API_CACHE = 'vm-api-v1'; // name shared with client/src/utils/offline.js
const KEEP = [STATIC_CACHE, API_CACHE];
const MAX_API_ENTRIES = 80;

// GET endpoints safe to keep for offline reading
const CACHEABLE_API = /^\/api\/(posts(\/[0-9a-f]{24})?|farmer-profile(\/.*)?|reviews\/farmer\/.*|orders\/(mine|received|badge|stats)|auth)$/;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(['/', '/index.html', '/manifest.json', '/logo192.png'])).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !KEEP.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'CLEAR_API_CACHE') event.waitUntil(caches.delete(API_CACHE));
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

const trim = async (cacheName, max) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map(k => cache.delete(k)));
};

const offlineJson = () => new Response(JSON.stringify({ msg: 'You are offline' }), {
  status: 503,
  headers: { 'Content-Type': 'application/json', 'X-Offline': '1' }
});

// network first, fall back to cache
const apiStrategy = async request => {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      // key by URL only (auth header is not part of the key; cache is wiped on login/logout)
      cache.put(request.url, response.clone()).then(() => trim(API_CACHE, MAX_API_ENTRIES));
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request.url);
    return cached || offlineJson();
  }
};

// cache first for hashed build files
const cacheFirst = async request => {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
};

// serve cache immediately, refresh in the background
const staleWhileRevalidate = async request => {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request).then(response => {
    if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || refresh;
};

// page loads: network first, fall back to the cached app shell (single-page app)
const navigationStrategy = async request => {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && response.headers.get('content-type') && response.headers.get('content-type').includes('text/html')) {
      cache.put('/index.html', response.clone());
    }
    return response;
  } catch (err) {
    return (await cache.match('/index.html')) || (await cache.match('/')) || Response.error();
  }
};

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname === '/sw.js') return; // always fetch the latest worker
    if (url.pathname.startsWith('/api/')) {
      if (CACHEABLE_API.test(url.pathname)) event.respondWith(apiStrategy(request));
      return;
    }
    if (request.mode === 'navigate') return event.respondWith(navigationStrategy(request));
    if (url.pathname.startsWith('/static/')) return event.respondWith(cacheFirst(request));
    return event.respondWith(staleWhileRevalidate(request));
  }

  // icon font CSS/files from the CDN used by the app
  if (url.hostname.endsWith('fontawesome.com')) event.respondWith(staleWhileRevalidate(request));
});
