// ════════════════════════════════════════════════════
//  Piccinin OS — Service Worker v2
//  Estratégia: Network-first para dados (Supabase),
//              Cache-first para assets estáticos
// ════════════════════════════════════════════════════
const CACHE_VERSION = 'piccinin-os-v2';
const CACHE_STATIC  = 'piccinin-static-v2';

// Assets que ficam em cache permanente (raramente mudam)
const STATIC_ASSETS = [
  './',
  './index.html',
  './relatorios.html',
  './css/reset.css',
  './css/layout.css',
  './css/components.css',
  './js/app.js',
  './js/ui.js',
  './js/api.js',
  './js/charts.js',
  './img/piccinin-semfundo.png',
  './img/logo-dark.png',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap'
];

// ── INSTALL: pré-cachear assets estáticos ──────────
self.addEventListener('install', event => {
  self.skipWaiting(); // Ativar imediatamente sem aguardar tab fechar
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// ── ACTIVATE: limpar caches antigos ───────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_VERSION)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: estratégia inteligente ─────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Supabase / APIs externas → Network-first (dados sempre frescos)
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('n8n') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/realtime/')
  ) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // 2. Assets estáticos → Cache-first, fallback network
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        // Guardar no cache se for resposta válida
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_STATIC).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: retorna index.html para navegação
        if (request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
