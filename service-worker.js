/* ============================================================
   GIMAK Service Worker — v2.0
   Met en cache les ressources essentielles pour le mode hors-ligne
   ============================================================ */

const CACHE_NAME = 'gimak-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Nunito:wght@400;600;700;800;900&display=swap'
];

/* --- Installation : mise en cache des ressources de base --- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

/* --- Activation : suppression des anciens caches --- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* --- Interception des requêtes : Network First, Cache Fallback --- */
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET et les requêtes vers des APIs externes
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Mettre en cache la nouvelle réponse si valide
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Réseau indisponible : servir depuis le cache
        return caches.match(event.request).then(cached => {
          return cached || caches.match('/index.html');
        });
      })
  );
});
