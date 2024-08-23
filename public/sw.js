const assetCacheName = 'assets-v0.0.5';

const assets = [
  "./index.html",
  "https://cdn.jsdelivr.net/npm/material-icons@1.13.3/iconfont/material-icons.min.css",
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,200,0,0",
  "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.13.1/cdn/themes/dark.css",
  "https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.13.1/cdn/shoelace-autoloader.js"
]

self.addEventListener('install', e => {
    console.log(`[Service worker] install ${assetCacheName}`);
    return e.waitUntil((async () => {
        const cache = await caches.open(assetCacheName);
        console.log('[Service Worker] Caching all: app shell');
        await cache.addAll(assets);
    })())
});

self.addEventListener("activate", e => {
  e.waitUntil(clients.claim())
})

const network = r => fetch(r).then(d => d.ok && r.method.toLowerCase() === "get"
  ? caches.open(assetCacheName).then(c => c.delete(r).then(() => c.put(r, d.clone())).then(_ => d)) 
  : d);

const tryCache = (req) => caches.open(assetCacheName).then(c => c.match(req))
const checkCache = (req) => caches.open(assetCacheName).then(c => c.match(req))

self.addEventListener('fetch', (e) => {
  if(!(e.request.url.startsWith("http"))) {
      return;
  }
  // console.log(`[Service Worker] Fetching resource ${e.request.url}`);
  e.respondWith(
     (e.request.url.endsWith("/esbuild") 
       ? fetch(e.request)
       : e.request.url.startsWith("https://cdn.jsdelivr.net/npm/")
       ? network(e.request)
       : navigator.onLine || e.request.url.includes("localhost")
      ? Promise.any([
         network(e.request),
        tryCache(e.request)
       ])
      : tryCache(e.request))
        .catch(ce => (console.log("[Service Worker] Request failed"), console.error(ne), console.error(ce)))
    .then(resp => resp && resp.url.endsWith(".js") ? resp.text().then(rtext => [rtext, resp]) : resp)
    .then(r => Array.isArray(r) ? new Response(r[0]
      .replaceAll(/(from|import) ['"]three['"]/g, "$1 'https://cdn.jsdelivr.net/npm/three/build/three.webgpu.js'")
      .replaceAll(/(from|import) ['"]three\/nodes['"]/g, "$1 'https://cdn.jsdelivr.net/npm/three/src/nodes/Nodes.js'"),
      {
      headers: r[1].headers
      }) : r));
});
