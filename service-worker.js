const CACHE_NAME = 'raslan-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/order.html',
  '/orderstate.html',
  '/feedback.html',
  '/login.html',
  '/styles/style.css',
  '/scripts/script.js',
  '/imgs/favicon.png'
  // أضف أي صور أو assets أخرى تريد cache لها
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
                  .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => caches.match('/index.html'));
    })
  );
});
