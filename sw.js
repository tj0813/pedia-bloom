/* Pedia Bloom service worker — offline-first PWA caching.
 * Precaches the full app shell (now fully self-hosted: no CDN). Local images are
 * cached at runtime (stale-while-revalidate). Navigations fall back to the cached
 * shell when offline so the app always boots. */
var VERSION = "pedia-bloom-v6";
var SHELL = VERSION + "-shell";
var RUNTIME = VERSION + "-runtime";

var SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./app/app.js",
  "./app/screens-data.js",
  "./app/i18n/topics.js",
  "./app/assets/styles.css",
  "./app/assets/fonts/fonts.css",
  "./app/assets/fonts/quicksand-0.woff2",
  "./app/assets/fonts/quicksand-1.woff2",
  "./app/assets/fonts/quicksand-2.woff2",
  "./app/assets/fonts/material-symbols.woff2",
  "./app/assets/icon.svg",
  "./app/assets/placeholder.svg",
  "./app/assets/icons/icon-192.png",
  "./app/assets/icons/icon-512.png",
  "./app/assets/icons/icon-maskable-512.png",
  "./app/assets/icons/apple-touch-icon-180.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(SHELL).then(function (c) {
      // Don't let one missing optional asset abort the whole precache.
      return Promise.all(SHELL_ASSETS.map(function (url) {
        return c.add(url).catch(function () { /* tolerated */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf(VERSION) !== 0; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  // Only handle real web requests. Browser-extension requests (chrome-extension:, etc.)
  // can't be stored by the Cache API and aren't ours — let the browser handle them.
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  var sameOrigin = url.origin === location.origin;

  // Navigations: try network, fall back to the cached shell so the SPA always boots offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(function () {
        return caches.match("./index.html").then(function (r) { return r || caches.match("./"); });
      })
    );
    return;
  }

  // App shell + bundle + self-hosted assets: cache-first.
  var isShell = sameOrigin && (
    url.pathname.endsWith("/") ||
    /\/(index\.html|manifest\.webmanifest)$/.test(url.pathname) ||
    /\/app\/(app|screens-data)\.js$/.test(url.pathname) ||
    /\/app\/i18n\/topics\.js$/.test(url.pathname) ||
    /\/app\/assets\/styles\.css$/.test(url.pathname) ||
    /\/app\/assets\/fonts\//.test(url.pathname) ||
    /\/app\/assets\/icons?\//.test(url.pathname) ||
    /\/app\/assets\/(icon|placeholder)\.svg$/.test(url.pathname)
  );
  if (isShell) {
    e.respondWith(caches.match(req).then(function (r) { return r || fetch(req); }));
    return;
  }

  // Everything else (local topic images): stale-while-revalidate.
  e.respondWith(
    caches.open(RUNTIME).then(function (cache) {
      return cache.match(req).then(function (cached) {
        var network = fetch(req).then(function (res) {
          if (res && (res.status === 200 || res.type === "opaque")) cache.put(req, res.clone());
          return res;
        }).catch(function () { return cached; });
        return cached || network;
      });
    })
  );
});
