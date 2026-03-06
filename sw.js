/**
 * Service Worker for EV kWh Reimbursement App v2.1
 * Cache-first for app shell, network-first for CDN libraries.
 */

const CACHE_NAME = 'ev-reimburse-v3.1.0';

// Relative paths — resolved against SW scope at install time
const APP_SHELL_RELATIVE = [
  './',
  './index.html',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/animations.css',
  './css/responsive.css',
  './js/app.js',
  './js/storage.js',
  './js/profiles.js',
  './js/billing.js',
  './js/fields.js',
  './js/csv.js',
  './js/chart.js',
  './js/summary.js',
  './js/ui.js',
  './js/feedback.js',
  './js/history.js',
  './js/presets.js',
  './js/trend.js',
  './js/utils/dates.js',
  './js/exports/excel.js',
  './js/exports/pdf.js',
  './js/exports/receipt.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/og-image.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32x32.png',
  './manifest.json'
];

const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.7.0/jspdf.plugin.autotable.min.js'
];

// Install — cache app shell using absolute URLs resolved from SW scope
self.addEventListener('install', (event) => {
  const scope = self.registration.scope;
  const appShell = APP_SHELL_RELATIVE.map(p => new URL(p, scope).href);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(appShell);
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — cache-first for app shell, network-first for CDN
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CDN resources: network-first with cache fallback
  if (CDN_URLS.some(cdn => event.request.url.startsWith(cdn.split('?')[0]))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell: cache-first
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
