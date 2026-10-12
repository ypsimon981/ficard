const cacheName='ficard-livorno-shell-v1';
const config=new URL(self.location.href);
const entry=new URL(config.searchParams.get('entry')||'./',self.location.href);
const vendor=new URL(config.searchParams.get('vendor')||'../vendor/',self.location.href);
const files=[entry.href,new URL('./livorno-map.js',self.location.href).href,new URL('./livorno-cache.js',self.location.href).href,new URL('leaflet.js',vendor).href,new URL('leaflet.css',vendor).href];
self.addEventListener('install',event=>{event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(files)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ficard-livorno-shell-')&&k!==cacheName).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 // Never cache Supabase reads, Overpass requests or third-party map tiles.
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'&&url.pathname===entry.pathname){
  event.respondWith(fetch(event.request).then(r=>{if(r.ok&&r.type!=='opaqueredirect'){const clone=r.clone();event.waitUntil(caches.open(cacheName).then(c=>c.put(entry.href,clone)));}return r;}).catch(()=>caches.match(entry.href)));return;
 }
 if(files.includes(url.href))event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
