const assetCacheName = 'assets-v0.0.3';

const assets = [
    "./index.html",
    "https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"
]

self.addEventListener('install', e => {
    console.log('[Service worker] install');
    e.waitUntil((async () => {
        const cache = await caches.open(assetCacheName);
        console.log('[Service Worker] Caching all: app shell');
        await cache.addAll(assets);
    }))
});

const network = r => fetch(r).then(d => d.ok ? caches.open(assetCacheName).then(c => c.delete(r).then(() => c.put(r, d.clone())).then(_ => d)) : d);

self.addEventListener('fetch', (e) => {
  if(!(e.request.url.startsWith("http"))) {
      return;
  }
  // console.log(`[Service Worker] Fetching resource ${e.request.url}`);
  e.respondWith(
     (navigator.onLine ? network(e.request)
        .catch(ne => (console.log("[Service Worker] Network request failed, trying cache"), caches.match(e.request))) : caches.open(assetCacheName).then(c => c.match(e.request)))
        .catch(ce => (console.log("[Service Worker] Request failed"), console.error(ne), console.error(ce)))
    .then(resp => resp.url.startsWith("https://cdn.jsdelivr.net/npm/three/examples/") ? resp.text().then(rtext => [rtext, resp]) : resp)
    .then(r => Array.isArray(r) ? new Response(r[0].replaceAll("from 'three'", "from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js'"), {
      headers: r[1].headers
    }) : r)
  );
});
