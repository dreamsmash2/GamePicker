const CACHE = 'gamepicker-v1';
const ASSETS = [
  '/GamePicker/',
  '/GamePicker/index.html',
  '/GamePicker/manifest.json',
  '/GamePicker/icon-192.png',
  '/GamePicker/icon-512.png',
];

// Install: cache all assets
self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

// Fetch: cache first, fallback to network
self.addEventListener('fetch', e=>{
  // Skip non-GET and cross-origin requests (Google APIs, fonts, etc.)
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if(url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached) return cached;
      return fetch(e.request).then(resp=>{
        // Cache new same-origin responses
        if(resp && resp.status===200){
          const clone = resp.clone();
          caches.open(CACHE).then(c=>c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
