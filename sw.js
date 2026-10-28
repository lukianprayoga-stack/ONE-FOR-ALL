/* Service worker ONE FOR ALL.
   Naikkan angka versi setiap kali isi aplikasi diubah agar HP mengambil versi baru. */
const CACHE = 'ofa-v58';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', event => {
  // File yang belum ada (mis. ikon belum diupload) dilewati agar aplikasi tetap terpasang.
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Hanya file dari situs ini; data Apps Script dan situs lain tidak disimpan.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    // Halaman: ambil yang terbaru dulu (lewati cache browser ±10 menit dari GitHub Pages),
    // pakai salinan tersimpan saat tidak ada sinyal.
    event.respondWith(
      fetch(new Request(request.url, {cache: 'no-cache', credentials: 'same-origin'}))
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // Ikon dan file lain: pakai salinan tersimpan, perbarui di belakang layar.
  event.respondWith(
    caches.match(request).then(hit => {
      const network = fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});
