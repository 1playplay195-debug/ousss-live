const CACHE_NAME = 'kora-live-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/config.js',
  '/icon-192.png',
  '/icon-512.png'
];

// التثبيت: تخزين الملفات الأساسية
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// تفعيل: حذف الكاش القديم عند التحديث
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// استراتيجية Network First: الإنترنت أولًا، والكاش عند انقطاعه
// (مناسب لموقع نتائج مباشرة — النتائج تبقى حديثة، والموقع يفتح حتى بدون نت)
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});