const APP_VERSION="0.9.183";
const CACHE="ficard-v"+APP_VERSION;
const CORE=[
  "./",
  "./index.html",
  "./ficard-theme.js?v="+APP_VERSION,
  "./ficard-runtime.js?v="+APP_VERSION,
  "./ficard-navigation.js?v="+APP_VERSION,
  "./ficard-i18n.js?v=2.0.9",
  "./ficard-polish.css?v=0.9.183",
  "./ficard-viewport.js?v=0.9.119",
  "./ficard-promo.js?v=0.9.120",
  "./ficard-content.js?v=0.9.183",
  "./ficard-ads-config.js?v=0.9.183",
  "./ficard-ads.js?v=0.9.183",
  "./ficard-stores.js?v=0.9.183",
  "./ficard-stores-ui.js?v=0.9.183",
  "./ficard-theme.css?v=0.9.183",
  "./ficard-reader.js?v=1.1.2",
  "./scandixit-scanner.js?v=1.1.0",
  "./nav-barcode.svg?v=0.9.43",
  "./barcode-crops.js?v=0.9.35",
  "./merchant-ocr.js?v=0.9.183",
  "./scandixit.html",
  "./scandixit-i18n.js?v=1.0.0",
  "./manifest.webmanifest",
  "./privacy.html",
  "./ficard-analytics-config.js?v=0.9.183",
  "./ficard-analytics.js?v=0.9.183",
  "./vendor/leaflet.js","./vendor/leaflet.css",
  "./vendor/images/layers.png","./vendor/images/layers-2x.png","./vendor/images/marker-icon.png","./vendor/images/marker-icon-2x.png","./vendor/images/marker-shadow.png",
  "./icon.svg","./icon-32.png","./icon-180.png","./icon-192.png","./icon-512.png",
  "./brand-approved.png",
  "./vendor/leaflet.markercluster.js","./vendor/MarkerCluster.css",
  "./vendor/JsBarcode.all.min.js","./vendor/bwip-js-min.js","./vendor/html5-qrcode.min.js"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith("ficard-")&&key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

function latestShellRequest(url){
  const path=url.pathname;
  if(path.endsWith("/ficard-theme.js"))return "./ficard-theme.js?v="+APP_VERSION;
  if(path.endsWith("/ficard-runtime.js"))return "./ficard-runtime.js?v="+APP_VERSION;
  if(path.endsWith("/ficard-navigation.js"))return "./ficard-navigation.js?v="+APP_VERSION;
  if(path.endsWith("/ficard-i18n.js"))return "./ficard-i18n.js?v=2.0.9";
  return "";
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||!event.request.url.startsWith(self.registration.scope))return;

  const forced=latestShellRequest(url);
  const request=forced
    ? new Request(new URL(forced,self.registration.scope),{cache:"no-store"})
    : event.request;

  event.respondWith(
    fetch(request,{cache:"no-store"})
      .then(response=>{
        if(response.ok){
          const copy=response.clone();
          event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}));
        }
        return response;
      })
      .catch(async()=>{
        const shell=url.pathname.endsWith("/scandixit.html")?"./scandixit.html":url.pathname.endsWith("/privacy.html")?"./privacy.html":"./index.html";
        return await caches.match(event.request)||await caches.match(request)||await caches.match(event.request,{ignoreSearch:true})||(event.request.mode==="navigate"?await caches.match(shell):null)||Response.error();
      })
  );
});
