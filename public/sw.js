// === Service Worker DSM Suivi Caution ===
// Version : bump ce numéro à chaque mise à jour d'icône ou de contenu pour forcer le remplacement
const CACHE_VERSION = 'dsm-v3';
const CACHE_NAME = `suivi-caution-${CACHE_VERSION}`;

// Ressources à précacher (icônes + pages essentielles)
const PRECACHE_URLS = [
  '/',
  '/consultation',
  '/icon-192x192-v2.png',
  '/icon-512x512-v2.png',
  '/manifest.webmanifest',
];

// ─── Installation : mise en cache des ressources essentielles ────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Force l'activation immédiate sans attendre la fermeture des anciens onglets
  self.skipWaiting();
});

// ─── Activation : suppression de tous les anciens caches ────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME) // garder uniquement la version actuelle
          .map((name) => {
            console.log(`[SW] Suppression ancien cache : ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Prend le contrôle de tous les clients (onglets/applis) immédiatement
      return self.clients.claim();
    })
  );
});

// ─── Fetch : stratégie Network First (fraîcheur > performance) ──────────────
self.addEventListener('fetch', (event) => {
  // On ne gère que les requêtes GET
  if (event.request.method !== 'GET') return;

  // On ignore les requêtes API (toujours réseau)
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Mise en cache de la réponse fraîche
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Hors ligne : on sert depuis le cache
        return caches.match(event.request);
      })
  );
});
