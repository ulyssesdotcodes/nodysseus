const assetCacheName = 'assets-v0.0.5';

const assets = [
  "./index.html",
  "https://cdn.jsdelivr.net/npm/material-icons@1.13.3/iconfont/material-icons.min.css"
]

self.addEventListener('install', e => {
    console.log(`[Service worker] install ${assetCacheName}`);
    return e.waitUntil((async () => {
        const cache = await caches.open(assetCacheName);
        console.log('[Service Worker] Caching all: app shell');
        await cache.addAll(assets);
    })())
});

const network = r => fetch(r).then(d => d.ok 
  ? caches.open(assetCacheName).then(c => c.delete(r).then(() => c.put(r, d.clone())).then(_ => d)) 
  : d);

self.addEventListener('fetch', (e) => {
  if(!(e.request.url.startsWith("http"))) {
      return;
  }
  // console.log(`[Service Worker] Fetching resource ${e.request.url}`);
  e.respondWith(
     (navigator.onLine || e.request.url.includes("localhost") 
       ? network(e.request).catch(ne => (console.log("[Service Worker] Network request failed, trying cache"), caches.open(assetCacheName).then(cache => cache.match(e.request)))) 
       : caches.open(assetCacheName).then(c => c.match(e.request)))
        .catch(ce => (console.log("[Service Worker] Request failed"), console.error(ne), console.error(ce)))
    .then(resp => resp && (
        resp.url.startsWith("https://cdn.jsdelivr.net/npm/three/examples/") 
        || resp.url.startsWith("https://cdn.jsdelivr.net/gh/ulyssesdotcodes/")
      ) ? resp.text().then(rtext => [rtext, resp]) : resp)
    .then(r => Array.isArray(r) ? new Response(r[0].replaceAll("from 'three'", "from 'https://cdn.jsdelivr.net/npm/three/build/three.module.js'"), {
      headers: r[1].headers
    }) : r)
  );
});
