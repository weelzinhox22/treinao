// Service Worker para PWA e modo offline
// VERSION: v2.2 - Corrigido para ignorar HEAD, POST e chrome-extension
const CACHE_NAME = 'strong-wel-v2.2';
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
  const url = new URL(request.url);
  
  // Ignorar métodos não-GET (HEAD, POST, PUT, DELETE, etc)
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorar chrome-extension, chrome://, etc
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'chrome:' ||
      url.hostname === 'chrome-extension' ||
      request.url.includes('chrome-extension://')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Apenas cachear respostas bem-sucedidas e do tipo basic
        // E apenas requisições GET
        if (response && 
            response.status === 200 && 
            response.type === 'basic' &&
            request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch((error) => {
              // Ignorar erros de cache silenciosamente
              // (ex: quota exceeded, método não suportado)
              console.debug('Cache put failed (ignored):', error);
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

