/* Service Worker for PWA Offline Shell & Notifications */
const ONBELLEK = 'rezervasyon-talep-kabuk-v5';
const KABUK = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(ONBELLEK)
      .then(c => c.addAll(KABUK))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(adlar => Promise.all(adlar.filter(a => a !== ONBELLEK).map(a => caches.delete(a))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const istek = e.request;
  if (istek.method !== 'GET') return;
  const url = new URL(istek.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(istek)
      .then(cevap => {
        if (cevap && cevap.ok) {
          const kopya = cevap.clone();
          caches.open(ONBELLEK).then(c => c.put(istek, kopya)).catch(() => {});
        }
        return cevap;
      })
      .catch(() => caches.match(istek).then(c => c || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
