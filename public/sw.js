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

const network = (r) => fetch(r)
      .then(d => d.ok && r.method.toLowerCase() === "get"
  ? caches.open(assetCacheName).then(c => c.delete(r).then(() => c.put(r, d.clone())).then(_ => d)) 
  : d);

const tryCache = (req) => caches.open(assetCacheName).then(c => c.match(req)).then(r => {
  if(r === undefined) {
    return Promise.reject("cache failed")
  }
  return r
});
const checkCache = (req) => caches.open(assetCacheName).then(c => c.match(req))

self.addEventListener('fetch', (e) => {
  if(!(e.request.url.startsWith("http"))) {
      return;
  }
  // console.log(`[Service Worker] Fetching resource ${e.request.url}`);
  const maybeCachedRequest =
        (e.request.url.endsWith("/esbuild" || e.request.url.includes("sw.js"))
       ? fetch(e.request)
       : navigator.onLine || e.request.url.includes("localhost")
      ? Promise.any([
        // try network first, and for some requests delay the trycache
        network(e.request),
        new Promise((res, rej) => setTimeout(res,
                                             e.request.url.startsWith("https://cdn.jsdelivr.net/")
                || e.request.url.includes("localhost")
                                             || e.request.url.startsWith("https://nodysseus.io") ? 0 : 1000 , tryCache(e.request)))
       ])
        : tryCache(e.request))
        .catch(ce => (console.log("[Service Worker] Request failed", e.request),  console.error(ce)))
    ;

  e.respondWith(maybeCachedRequest);
});
