
const CACHE_VERSION = "sunpalm-v9";

const PRECACHE = [
  "index.html",
  "shop.html",
  "designer.html",
  "track.html",
  "reviews.html",
  "contact.html",
  "about.html",
  "news.html",
  "lenses.html",
  "css/bootstrap.min.css",
  "css/bootstrap.rtl.min.css",
  "css/style.css",
  "js/bootstrap.bundle.min.js",
  "js/i18n.js",
  "js/glasses.js",
  "js/store.js",
  "js/chatbot.js",
  "js/track.js",
  "js/uv.js",
  "js/designer.js",
  "js/glasses3d.js",
  "js/facetrack.js",
  "js/compare.js",
  "js/quiz.js",
  "js/family.js",
  "js/lenslab.js",
  "js/script.js",
  "manifest.webmanifest",
  "images/logo.png",
  "images/icons/icon-192.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Pages: try the network first so prices and stock are fresh, fall back to the cached copy offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("index.html")))
    );
    return;
  }

  // Same-site files, fonts and icon CSS: serve from cache, refresh in the background.
  const cacheable = url.origin === self.location.origin || /fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(url.host);
  if (!cacheable) return;
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok || response.type === "opaque") {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
