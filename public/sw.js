const CACHE_NAME="lingolive-shell-v92";
const SAFE_SHELL=["/offline","/manifest.webmanifest","/favicon.svg","/icons/icon-192.png","/icons/icon-512.png","/icons/maskable-512.png","/icons/apple-touch-icon.png"];

self.addEventListener("install",event=>{
  event.waitUntil(Promise.all([
    caches.open(CACHE_NAME).then(cache=>cache.addAll(SAFE_SHELL)),
    self.skipWaiting()
  ]));
});

self.addEventListener("activate",event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener("message",event=>{
  if(event.data?.type==="SKIP_WAITING")self.skipWaiting();
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||url.pathname.startsWith("/api/")||url.pathname.startsWith("/administration")||url.pathname.startsWith("/auth/")||url.pathname.startsWith("/account"))return;
  if(request.mode==="navigate"){
    event.respondWith(fetch(request).catch(()=>caches.match("/offline")));
    return;
  }
  const codeAsset=/\.(?:css|js)$/.test(url.pathname);
  if(codeAsset){
    event.respondWith(fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy))}
      return response;
    }).catch(()=>caches.match(request)));
    return;
  }
  const staticAsset=url.pathname.startsWith("/assets/")||/\.(?:woff2?|png|svg|webp|ico)$/.test(url.pathname);
  if(staticAsset){
    event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy))}
      return response;
    })));
  }
});
