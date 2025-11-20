// Service Worker para PWA e modo offline
// VERSION: v2.3 - Corrigido para ignorar todos métodos não-GET antes de processar
const CACHE_NAME = 'strong-wel-v2.3';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições (estratégia: Network First, Cache Fallback)
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não podem ser cacheadas
  const request = event.request;
  
  // CRÍTICO: Ignorar métodos não-GET ANTES de qualquer processamento
  // HEAD, POST, PUT, PATCH, DELETE não podem ser cacheados
  if (request.method !== 'GET') {
    // Não fazer nada, deixar a requisição passar normalmente
    return;
  }
  
  const url = new URL(request.url);
  
  // Ignorar chrome-extension, chrome://, etc
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'chrome:' ||
      url.hostname === 'chrome-extension' ||
      request.url.includes('chrome-extension://')) {
    return;
  }

  // Apenas processar requisições GET
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Apenas cachear respostas bem-sucedidas e do tipo basic
        // Garantir que é GET (já verificamos antes, mas dupla verificação)
        if (response && 
            response.status === 200 && 
            response.type === 'basic' &&
            request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch((error) => {
              // Ignorar erros de cache silenciosamente
              // (ex: quota exceeded, método não suportado)
              // Não logar para evitar spam no console
            });
          });
        }
        return response;
      })
      .catch(() => {
        // Se offline, tentar buscar do cache
        return caches.match(event.request);
      })
  );
});

