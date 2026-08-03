/* global self, caches, fetch, Request, Response, URL */
/**
 * Hearth service worker.
 *
 * Hand-rolled rather than generated. Next 16 builds with Turbopack, and the
 * usual generators (@serwist/next, next-pwa) are webpack plugins — under
 * Turbopack they never run, and forcing `next build --webpack` to get them
 * would regress the whole build. See docs/hearth-native-app-plan-v1.md.
 *
 * Not having a build plugin costs us a precomputed asset manifest. That turns
 * out not to matter: Next's static output is content-hashed and immutable, so
 * a CacheFirst rule over /_next/static/ reaches the same place after one
 * visit. What genuinely must survive a cold, offline launch — the /offline
 * document and the app icons — is precached explicitly at install.
 *
 * PRIVACY — the rules below are deliberate, not incidental:
 *   - Navigations are never cached. Hearth renders children's names, photos
 *     and learning records into authenticated HTML; persisting that to disk
 *     would outlive sign-out.
 *   - Evidence photos (Vercel Blob) are never cached. They are private
 *     children's images served through an authenticated proxy.
 *   - /api/ is never cached.
 * Only public, non-personal assets are stored.
 */

const VERSION = 'v1';
const SHELL_CACHE = `hearth-shell-${VERSION}`;
const STATIC_CACHE = `hearth-static-${VERSION}`;
const IMAGE_CACHE = `hearth-images-${VERSION}`;

const CURRENT_CACHES = new Set([SHELL_CACHE, STATIC_CACHE, IMAGE_CACHE]);

const OFFLINE_URL = '/offline';

// The minimum that must exist for a cold offline launch to show something
// that looks like Hearth.
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Keep the Sanity image cache from growing without bound on a parent's phone.
const IMAGE_CACHE_LIMIT = 60;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Individually, not addAll — addAll is atomic, so one 404 would throw
      // away the whole precache and leave us with no offline document.
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            await cache.add(new Request(url, { cache: 'reload' }));
          } catch {
            // A missing asset must not block activation.
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('hearth-') && !CURRENT_CACHES.has(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

/** Trim a cache to `limit` entries, oldest-inserted first. */
async function trimCache(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  await Promise.all(keys.slice(0, keys.length - limit).map((k) => cache.delete(k)));
}

/** Immutable, content-hashed assets: serve from cache, fall back to network. */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

/** Public remote images: serve stale, refresh in the background. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone()).then(() => trimCache(cacheName, IMAGE_CACHE_LIMIT));
      }
      return response;
    })
    .catch(() => null);

  return hit ?? (await network) ?? Response.error();
}

/**
 * Navigations: always network, never stored. On failure serve the precached
 * offline document. This is the airplane-mode path App Review exercises.
 */
async function navigate(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match(OFFLINE_URL, { cacheName: SHELL_CACHE });
    return (
      cached ??
      new Response('You are offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    );
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignore non-http schemes (browser extensions, etc).
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (request.mode === 'navigate') {
    event.respondWith(navigate(request));
    return;
  }

  const sameOrigin = url.origin === self.location.origin;

  // Never cache: API traffic, Sentry's tunnel, Clerk, and private evidence
  // photos. Fall through to the network untouched.
  if (
    (sameOrigin && (url.pathname.startsWith('/api/') || url.pathname.startsWith('/monitoring'))) ||
    url.hostname.endsWith('.blob.vercel-storage.com') ||
    url.hostname.includes('clerk.')
  ) {
    return;
  }

  // Content-hashed build output — safe to cache indefinitely.
  //
  // Deliberately uncapped, unlike the image cache. Entries accumulate across
  // deploys (each build hashes differently), and reclamation happens two ways:
  // bumping VERSION drops the whole cache on activate, and the browser evicts
  // under storage pressure. A FIFO trim would be worse than the problem — it
  // could evict assets the *current* build still needs and break the offline
  // shell, since insertion order says nothing about which build an asset is from.
  if (sameOrigin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Static brand assets shipped from public/.
  if (sameOrigin && (url.pathname.startsWith('/icons/') || url.pathname.startsWith('/brand/'))) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // Public CMS imagery.
  if (url.hostname === 'cdn.sanity.io') {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
  }
});
