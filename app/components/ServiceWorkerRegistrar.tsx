'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Enregistré avec succès :', registration.scope);

          // Vérifie si une mise à jour est disponible
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'activated' &&
                navigator.serviceWorker.controller
              ) {
                // Nouveau SW actif → rechargement automatique pour appliquer les nouvelles icônes
                console.log('[SW] Nouvelle version active, rechargement...');
                window.location.reload();
              }
            });
          });
        })
        .catch((err) => console.error('[SW] Échec d\'enregistrement :', err));
    }
  }, []);

  return null;
}
