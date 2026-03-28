// Service Worker - قبضة الجنرال PWA
const CACHE_NAME = 'generals-fist-v1';

// الملفات الأساسية التي يجب تخزينها مؤقتاً
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] تثبيت Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] تخزين الأصول الأساسية مؤقتاً');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // تفعيل فوري
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] تفعيل Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] حذف الكاش القديم:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// اعتراض طلبات الشبكة
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل طلبات غير HTTP/HTTPS
  if (!url.protocol.startsWith('http')) return;

  // تجاهل طلبات API والتتبع
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data')) {
    return;
  }

  // استراتيجية Stale While Revalidate للموارد الثابتة
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // استراتيجية Network First للصفحات
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // إذا لم نجد الصفحة في الكاش، نعرض صفحة غير متصل
            return caches.match('/');
          });
        })
    );
    return;
  }

  // للطلبات الأخرى: Network First مع Fallback للكاش
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// معالجة الرسائل من التطبيق
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
