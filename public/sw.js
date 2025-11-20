// Service Worker para PWA e modo offline
// VERSION: v2.4 - Ignora completamente métodos não-GET e esquemas não suportados
const CACHE_NAME = 'strong-wel-v2.4';
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
  const request = event.request;
  
  // CRÍTICO: Ignorar métodos não-GET ANTES de qualquer processamento
  // HEAD, POST, PUT, PATCH, DELETE não podem ser cacheados
  if (request.method !== 'GET') {
    // Não fazer nada, deixar a requisição passar normalmente
    // Não usar event.respondWith para métodos não-GET
    return;
  }
  
  // Verificar URL antes de processar
  try {
    const url = new URL(request.url);
    
    // Ignorar esquemas não suportados
    if (url.protocol === 'chrome-extension:' || 
        url.protocol === 'chrome:' ||
        url.protocol === 'moz-extension:' ||
        url.protocol === 'safari-extension:' ||
        url.hostname === 'chrome-extension' ||
        request.url.includes('chrome-extension://') ||
        request.url.includes('moz-extension://')) {
      return;
    }
    
    // Ignorar requisições para APIs do Supabase (não cachear)
    if (url.hostname.includes('supabase.co') || 
        url.pathname.includes('/rest/v1/') ||
        url.pathname.includes('/storage/v1/')) {
      // Deixar passar sem cachear
      return;
    }
  } catch (e) {
    // Se não conseguir fazer parse da URL, ignorar
    return;
  }

  // Apenas processar requisições GET válidas
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Apenas cachear respostas bem-sucedidas e do tipo basic
        if (response && 
            response.status === 200 && 
            response.type === 'basic' &&
            request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Tentar cachear, mas ignorar erros silenciosamente
            cache.put(event.request, responseToCache).catch(() => {
              // Ignorar todos os erros de cache (quota, método não suportado, etc)
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

