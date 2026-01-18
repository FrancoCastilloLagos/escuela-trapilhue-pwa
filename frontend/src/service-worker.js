const CACHE_NAME = 'trapilhue-v2';

// Solo archivos que sabemos al 100% que existen y tienen ese nombre exacto
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  console.log('SW: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usamos una estrategia individual para que si uno falla, los demás se guarden
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
          return fetch(url).then(response => {
            if (!response.ok) throw new Error(`Fallo al cargar ${url}`);
            return cache.put(url, response);
          }).catch(err => console.warn(`SW: Saltando archivo no encontrado: ${url}`));
        })
      );
    }).then(() => self.skipWaiting()) // Fuerza la activación inmediata
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Toma el control de la página inmediatamente
  console.log('SW: Activado y listo.');
});

self.addEventListener('fetch', (event) => {
  // Estrategia: Red primero, si falla, usar Caché
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then(response => {
        if (response) return response;
        // Si no está en caché y es una navegación, devolver index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});