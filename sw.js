const CACHE = 'gamepicker-v2';
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

// Activate: delete old caches and take control immediately
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

// Fetch: network first for HTML (always get latest), cache first for assets
self.addEventListener('fetch', e=>{
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if(url.origin !== location.origin) return;

  // For HTML: network first so updates are always picked up
  if(e.request.destination === 'document' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')){
    e.respondWith(
      fetch(e.request)
        .then(resp=>{
          if(resp && resp.status===200){
            const clone = resp.clone();
            caches.open(CACHE).then(c=>c.put(e.request, clone));
          }
          return resp;
        })
        .catch(()=>caches.match(e.request)) // fallback to cache if offline
    );
    return;
  }

  // For other assets (icons, manifest): cache first
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached) return cached;
      return fetch(e.request).then(resp=>{
        if(resp && resp.status===200){
          const clone = resp.clone();
          caches.open(CACHE).then(c=>c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
