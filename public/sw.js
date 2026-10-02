const C="co-v14-cache";
const OLD=["co-v2-cache","co-v2-fix1-cache","co-v3-fix1-cache","co-v4-cache","co-v5-cache","co-v6-cache","co-v7-cache","co-v8-cache","co-v9-cache","co-v12-cache"];
const A=["./","./index.html","./manifest.json","./logo-suaps.png","./logo-staps.png","https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"];
self.addEventListener("install",e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A).catch(()=>{})).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(Promise.all(OLD.map(x=>caches.delete(x))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;if(e.request.mode==="navigate"||e.request.destination==="document"){e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put("./index.html",c));return r}).catch(()=>caches.match("./index.html")));return}e.respondWith(caches.match(e.request).then(x=>x||fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match("./index.html"))))});
