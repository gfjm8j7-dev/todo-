// 🔒 Service Worker لتطبيق سجل صالح للتداول PRO
const CACHE_NAME = 'saleh-trading-pwa-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

// 🧩 تثبيت الـService Worker وتخزين App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ⚙️ تفعيل الـService Worker وحذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => {
        console.log('✅ Service Worker activated:', CACHE_NAME);
        return self.clients.claim();
      })
  );
});

// 🌐 التعامل مع الطلبات (fetch)
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير GET
  if (event.request.method !== 'GET') return;

  // تجاهل الطلبات الخارجية (CDN أو APIs)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          // نسخ الاستجابة وتخزينها في الكاش
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, responseClone))
            .catch(() => {});
          return networkResponse;
        })
        .catch(() => {
          // في حالة فشل الشبكة، استخدم index.html فقط للصفحات
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
