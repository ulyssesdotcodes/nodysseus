const assetCacheName = 'assets-v0.0.2';

const assets = [
    "./index.html",
    "https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js",
    "https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js",
]

// self.addEventListener('install', e => {
//     console.log('[Service worker] install');
//     e.waitUntil((async () => {
//         const cache = await caches.open(assetCacheName);
//         console.log('[Service Worker] Caching all: app shell');
//         await cache.addAll(assets);
//     }))
// });

const network = r => fetch(r).then(d => d.ok ? caches.open(assetCacheName).then(c => c.put(r, d.clone()).then(_ => d)) : d);

self.addEventListener('fetch', (e) => {
    console.log(e)
    if(!(e.request.url.startsWith("http"))) {
        return;
    }
  console.log(`[Service Worker] Fetching resource ${e.request.url}`);
  e.respondWith(
     (navigator.onLine ? network(e.request)
        .catch(ne => (console.log("[Service Worker] Network request failed, trying cache"), caches.match(e.request))) : caches.match(e.request))
        .catch(ce => (console.log("[Service Worker] Request failed"), console.error(ne), console.error(ce))));
});

