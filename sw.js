const APP_VERSION="0.9.209";
const CACHE="ficard-v"+APP_VERSION;
const CORE=[
  "./logos-hq/studio/action-8323e8b19bd3.png",
  "./logos-hq/studio/aldi-42f288f8353a.png",
  "./logos-hq/studio/autogrill-d21fe6ba0d04.png",
  "./logos-hq/studio/bata-673303d350e2.png",
  "./logos-hq/studio/benetton-63529418e41e.png",
  "./logos-hq/studio/bennet-e9a78c7ceca7.png",
  "./logos-hq/studio/benu-1d805657564c.png",
  "./logos-hq/studio/bershka-a8f3d6099578.png",
  "./logos-hq/studio/bottegaverde-f1d0cd5c8c0e.png",
  "./logos-hq/studio/bricocenter-a873489253d3.png",
  "./logos-hq/studio/burgerking-606520e7e02a.png",
  "./logos-hq/studio/calzedonia-61541208b47f.png",
  "./logos-hq/studio/carrefour-c08324f39426.png",
  "./logos-hq/studio/cisalfa-8ebb69ffddcc.png",
  "./logos-hq/studio/coin-dd6f4581057c.png",
  "./logos-hq/studio/conad-1debb7736974.png",
  "./logos-hq/studio/crai-7aea931bd451.png",
  "./logos-hq/studio/comet-1ee9980021fb.png",
  "./logos-hq/studio/deco-d9ec5e64f983.png",
  "./logos-hq/studio/deichmann-278d8b2b5d2c.png",
  "./logos-hq/studio/demos-b5d674729e64.png",
  "./logos-hq/studio/despar-409f8741dc11.png",
  "./logos-hq/studio/dipiu-1fe278233fc7.png",
  "./logos-hq/studio/dm-f429f9fbb4c3.png",
  "./logos-hq/studio/douglas-79bcb7f082b2.png",
  "./logos-hq/studio/drmax-a0315b67c4a7.png",
  "./logos-hq/studio/elitepet-068b93b0ffd2.png",
  "./logos-hq/studio/emark-a53ca3e53860.png",
  "./logos-hq/studio/eni-f15816e9a125.png",
  "./logos-hq/studio/euronics-9b8584616927.png",
  "./logos-hq/studio/eurospin-f3b1916ebd9e.png",
  "./logos-hq/studio/expert-5c921fa9b7bb.png",
  "./logos-hq/studio/famila-75cedce0a191.png",
  "./logos-hq/studio/farmacia-42fccd4e022d.png",
  "./logos-hq/studio/feltrinelli-240ebfb31898.png",
  "./logos-hq/studio/flyingtiger-80487a9a8dd9.png",
  "./logos-hq/studio/footlocker-661455eda5ef.png",
  "./logos-hq/studio/geox-50292b67fe19.png",
  "./logos-hq/studio/globalpet-c7900d9eb8c0.png",
  "./logos-hq/studio/grandvision-51e3871c5fee.png",
  "./logos-hq/studio/hm-1100f545a92d.png",
  "./logos-hq/studio/ikea-921b25e267eb.png",
  "./logos-hq/studio/ins-d633018777c9.png",
  "./logos-hq/studio/intersport-3777fbf9696b.png",
  "./logos-hq/studio/intimissimi-aea5ee9d9ffa.png",
  "./logos-hq/studio/ip-5c8a62be42b8.png",
  "./logos-hq/studio/iper-dea6afde118b.png",
  "./logos-hq/studio/pim-d754b161cd4f.png",
  "./logos-hq/studio/italpet-6c3ab62c109c.png",
  "./logos-hq/studio/iperal-6d77f32b02d2.png",
  "./logos-hq/studio/jdsports-f38f25d7e459.png",
  "./logos-hq/studio/jysk-c64057f054e6.png",
  "./logos-hq/studio/kfc-fcc79b9987b5.png",
  "./logos-hq/studio/kiabi-dd44a47c70a1.png",
  "./logos-hq/studio/kiko-7da8429d076f.png",
  "./logos-hq/studio/aando-e940b716b4b1.png",
  "./logos-hq/studio/coop-93eac253b01c.png",
  "./logos-hq/studio/gamelife-076e58275fc3.png",
  "./logos-hq/studio/isoladeitesori-d42a700fab2b.png",
  "./logos-hq/studio/lapiadineria-76ac5d222552.png",
  "./logos-hq/studio/leroymerlin-8f7f158c546e.png",
  "./logos-hq/studio/libraccio-6165a05b9d56.png",
  "./logos-hq/studio/lidl-f1041728efbb.png",
  "./logos-hq/studio/lillapois-de40dbbde46b.png",
  "./logos-hq/studio/lloyds-d3b9bdc8e5e7.png",
  "./logos-hq/studio/lotteria-9b921eea0a08.png",
  "./logos-hq/studio/majesticpets-ca947dd3343c.png",
  "./logos-hq/studio/mango-71a93df66e39.png",
  "./logos-hq/studio/maurys-6d793191f03b.png",
  "./logos-hq/studio/maxizoo-b05ff0261786.png",
  "./logos-hq/studio/mercato-45f154e65f93.png",
  "./logos-hq/studio/mondadori-124b99e7f192.png",
  "./logos-hq/studio/motivi-e4ca4ae20250.png",
  "./logos-hq/studio/naturasi-09d09a6ac577.png",
  "./logos-hq/studio/nike-4aaf42278d9c.png",
  "./logos-hq/studio/notino-614cfedc6776.png",
  "./logos-hq/studio/obi-08f7724d6d29.png",
  "./logos-hq/studio/norauto-df12c3b1657b.png",
  "./logos-hq/studio/oldwildwest-17d11de32926.png",
  "./logos-hq/studio/ovs-96f5dc0b2b99.png",
  "./logos-hq/studio/pam-7a8d514503ed.png",
  "./logos-hq/studio/penny-5309f74e06d0.png",
  "./logos-hq/studio/pepco-538b59064c5c.png",
  "./logos-hq/studio/petsupermarket-56325bb983fa.png",
  "./logos-hq/studio/petmark-499b3548d323.png",
  "./logos-hq/studio/pewex-aa4f9d3f63e7.png",
  "./logos-hq/studio/piazzaitalia-8df353ea1e85.png",
  "./logos-hq/studio/pinalli-d93736fd48f4.png",
  "./logos-hq/studio/pittarosso-dd3fb64be731.png",
  "./logos-hq/studio/primark-284aa11abedc.png",
  "./logos-hq/studio/primigi-414a5200d7f6.png",
  "./logos-hq/studio/pullandbear-1544890d0df5.png",
  "./logos-hq/studio/puma-b95d68f461bf.png",
  "./logos-hq/studio/q8-23bb4c817f42.png",
  "./logos-hq/studio/risparmiocasa-6fb4cbba33d6.png",
  "./logos-hq/studio/roadhouse-6338d779048b.png",
  "./logos-hq/studio/robinsonpetshop-ed75a6e64f05.png",
  "./logos-hq/studio/rossopomodoro-a86ed1682d30.png",
  "./logos-hq/studio/salmoiraghi-04983cea7caa.png",
  "./logos-hq/studio/sephora-be77067c7d8f.png",
  "./logos-hq/studio/shell-0033914aae0c.png",
  "./logos-hq/studio/sigma-9a1eb70a9434.png",
  "./logos-hq/studio/simply-421f9ff15159.png",
  "./logos-hq/studio/skechers-16bfa62622a9.png",
  "./logos-hq/studio/sole365-c16b1f515dfb.png",
  "./logos-hq/studio/starbucks-d971b1ac7b62.png",
  "./logos-hq/studio/stradivarius-e5b042dbad8e.png",
  "./logos-hq/studio/tamoil-c5f831203f3a.png",
  "./logos-hq/studio/tecnomat-6b53d60c2a28.png",
  "./logos-hq/studio/terranova-1f0a17885cfa.png",
  "./logos-hq/studio/tesco-00d3fc639234.png",
  "./logos-hq/studio/tezenis-7d293e89acf2.png",
  "./logos-hq/studio/thun-8dac32c4e797.png",
  "./logos-hq/studio/tigota-66c080cf33fc.png",
  "./logos-hq/studio/todis-8d70c3d88859.png",
  "./logos-hq/studio/total-9e740a7c8ac9.png",
  "./logos-hq/studio/trony-84686d030fdd.png",
  "./logos-hq/studio/unieuro-5f92c58227ca.png",
  "./logos-hq/studio/upim-45c5deb29d98.png",
  "./logos-hq/studio/venchi-d39061e18a4f.png",
  "./logos-hq/studio/yvesrocher-5c43c9748733.png",
  "./logos-hq/studio/zara-ceb578873e6e.png",
  "./logos-hq/studio/zooservice-98d75fef58b1.png",
  "./logos-hq/studio/zooplus-a84c6df7a77a.png",

  "./locales/it.js?v=0.9.209",
  "./locales/en.js?v=0.9.209",
  "./locales/fr.js?v=0.9.209",
  "./locales/es.js?v=0.9.209",
  "./locales/pt.js?v=0.9.209",
  "./locales/nl.js?v=0.9.209",
  "./locales/de.js?v=0.9.209",

  "./logos-hq/kasanova-approved.svg",
  "./logos-hq/bialetti-approved.png",
  "./logos-hq/thun-approved.svg",
  "./logos-hq/unieuro-approved.svg",
  "./logos-hq/decathlon.svg",
  "./logos-hq/coin-approved.png",
  "./logos-hq/pinalli-approved.png",
  "./logos-hq/douglas-approved.svg",
  "./logos-hq/sephora-approved.png",
  "./logos-hq/tigota.svg",
  "./logos-hq/lotteria-approved.png",
  "./logos-hq/primigi-approved.png",
  "./logos-hq/bimbostore-approved.png",
  "./logos-hq/blukids-approved.png",
  "./logos-hq/francogioielli-approved.png",
  "./logos-hq/cisalfa-approved.png",
  "./",
  "./index.html",
  "./ficard-theme.js?v="+APP_VERSION,
  "./ficard-runtime.js?v="+APP_VERSION,
  "./ficard-navigation.js?v="+APP_VERSION,
  "./ficard-i18n.js?v=2.1.0",
  "./ficard-polish.css?v=0.9.209",
  "./ficard-viewport.js?v=0.9.119",
  "./ficard-promo.js?v=0.9.120",
  "./ficard-content.js?v=0.9.209",
  "./ficard-ads-config.js?v=0.9.209",
  "./ficard-ads.js?v=0.9.209",
  "./ficard-stores.js?v=0.9.209",
  "./ficard-shared-stores.js?v=0.9.209",
  "./ficard-stores-ui.js?v=0.9.209",
  "./ficard-theme.css?v=0.9.209",
  "./ficard-reader.js?v=1.1.2",
  "./scandixit-scanner.js?v=1.1.1",
  "./nav-barcode.svg?v=0.9.43",
  "./barcode-crops.js?v=0.9.35",
  "./merchant-ocr.js?v=0.9.209",
  "./scandixit.html",
  "./scandixit-catalog.js?v=1.0.0",
  "./scandixit-i18n.js?v=2.1.0",
  "./manifest.webmanifest",
  "./privacy.html",
  "./ficard-analytics-config.js?v=0.9.209",
  "./ficard-analytics.js?v=0.9.209",
  "./scandixit-saved.js?v=0.9.209",
  "./ficard-promos.js?v=0.9.209",
  "./scandixit-links.js?v=0.9.209",
  "./scandixit-saved.css?v=0.9.209",
  "./ficard-brand-requests.js?v=0.9.209",
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
  if(path.endsWith("/ficard-i18n.js"))return "./ficard-i18n.js?v=2.1.0";
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
