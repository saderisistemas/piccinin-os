// ════════════════════════════════════════════════════
//  Piccinin OS — Service Worker Kill Switch (v4)
//  Propósito: Desativar e desregistrar o Service Worker
// ════════════════════════════════════════════════════

self.addEventListener('install', event => {
  self.skipWaiting(); // Força a ativação imediata
});

self.addEventListener('activate', event => {
  event.waitUntil(
    // 1. Limpa todas as chaves de cache do PWA
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => caches.delete(key)));
    })
    // 2. Desregistra o próprio Service Worker
    .then(() => {
      return self.registration.unregister();
    })
    // 3. Notifica os clientes ativos
    .then(() => {
      return self.clients.claim();
    })
    .then(() => {
      console.log('[PWA] Service Worker desativado e caches removidos com sucesso.');
    })
  );
});
