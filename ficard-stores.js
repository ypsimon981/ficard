(function(root){
'use strict';
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const aliases={pam:['Pam','Panorama'],coop:['Coop','Ipercoop'],despar:['Despar','Eurospar','Interspar'],tigota:['Tigotà','Tigota'],acquaesapone:['Acqua & Sapone','Acqua e Sapone'],jdsports:['JD Sports'],idromarket:['Idromarket','Idro Market'],arcaplanet:['Arcaplanet','Arca Planet'],maxizoo:['Maxi Zoo','Maxizoo'],isoladeitesori:["L'Isola dei Tesori",'Isola dei Tesori'],italpet:['Italpet','Ital Pet'],petmark:['Petmark','Pet Mark'],robinsonpetshop:['Robinson Pet Shop','Robinson Petshop'],zooservice:['Zoo Service','Zooservice'],majesticpets:["Majestic Pet's",'Majestic Pets'],elitepet:['Elite Pet','ElitePet'],petsupermarket:['Pet Supermarket','Petsupermarket'],globalpet:['Global Pet','GlobalPet'],emark:['Emark','E Mark'],maurys:["Maury's",'Maurys']};
function names(card,brands,key){return [...new Set(aliases[key]||[brands[key]?.name||card.name])].filter(s=>s&&s.length>=2)}
function matches(tags,list){return ['brand','name','operator'].some(k=>{const value=' '+normalize(tags[k])+' ';return list.some(n=>value.includes(' '+normalize(n)+' '))})}
function query(center,list,radius=3000,bounds=null){
 if(!Number.isFinite(center?.lat)||!Number.isFinite(center?.lng)||Math.abs(center.lat)>90||Math.abs(center.lng)>180)throw Error('Posizione non valida');
 if(!list.length)return null;
 if(!Number.isFinite(radius)||radius<=0||radius>10000)throw Error('Zona di ricerca non valida');
 const dy=radius/111320,dx=dy/Math.max(.1,Math.cos(center.lat*Math.PI/180));
 const b=bounds||[Math.max(-90,center.lat-dy),Math.max(-180,center.lng-dx),Math.min(90,center.lat+dy),Math.min(180,center.lng+dx)];
 if(!Array.isArray(b)||b.length!==4||!b.every(Number.isFinite)||b[0]>=b[2]||b[1]>=b[3]||b[0]<-90||b[2]>90||b[1]<-180||b[3]>180)throw Error('Zona di ricerca non valida');
 if(b[2]-b[0]>.2||b[3]-b[1]>.3)throw Error('Avvicina la mappa per cercare i negozi in questa zona.');
 const area='('+b.map(n=>n.toFixed(5)).join(',')+')';
 // Query indexed shop/category tags once; match owned-card brands locally.
 // `out tags` omits node coordinates, causing valid point shops to be discarded.
 return '[out:json][timeout:25];(nwr["shop"]'+area+';nwr["amenity"~"^(fuel|pharmacy)$"]'+area+';);out body center;';
}
function parse(data,descriptors){
 const found=[];for(const e of data.elements||[]){const lat=e.lat??e.center?.lat,lng=e.lon??e.center?.lon;if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)continue;
 const tags=e.tags||{},address=[tags['addr:street'],tags['addr:housenumber'],tags['addr:city']].filter(Boolean).join(' ');
 for(const d of descriptors)if(matches(tags,d.names)){const point={lat,lng,osmId:e.type+'/'+e.id,name:String(tags.name||tags.brand||d.names[0]).slice(0,200),address:address.slice(0,300),source:'osm-discovered'};
 if(!found.some(x=>x.cardId===d.id&&(x.point.osmId===point.osmId||Math.hypot(x.point.lat-lat,x.point.lng-lng)<.0003)))found.push({cardId:d.id,point});}
 }return found;
}
const CACHE_KEY='ficard.nearby-shops.v4',CACHE_AGE=7*86400000;
function boundsFor(center,radius=3000){const dy=radius/111320,dx=dy/Math.max(.1,Math.cos(center.lat*Math.PI/180));return [Math.max(-90,center.lat-dy),Math.max(-180,center.lng-dx),Math.min(90,center.lat+dy),Math.min(180,center.lng+dx)]}
function validBounds(b){return Array.isArray(b)&&b.length===4&&b.every(Number.isFinite)&&b[0]<b[2]&&b[1]<b[3]&&b[0]>=-90&&b[2]<=90&&b[1]>=-180&&b[3]<=180}
function compactElement(e){
 if(!e||!['node','way','relation'].includes(e.type)||!Number.isSafeInteger(e.id))return null;
 const lat=e.lat??e.center?.lat,lon=e.lon??e.center?.lon;
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;
 const tags={};for(const key of ['name','brand','operator','addr:street','addr:housenumber','addr:city'])if(typeof e.tags?.[key]==='string')tags[key]=e.tags[key].slice(0,300);
 if(!tags.name&&!tags.brand&&!tags.operator)return null;
 return {type:e.type,id:e.id,lat,lon,tags};
}
function mergeCache(cache,data,bounds=null,at=Date.now()){
 const elements=new Map();for(const e of [...(cache?.elements||[]),...(data?.elements||[])]){const c=compactElement(e);if(c){const key=c.type+'/'+c.id;elements.delete(key);elements.set(key,c)}}
 let zones=(cache?.zones||[]).filter(z=>validBounds(z.bounds)&&Number.isFinite(z.at));
 if(validBounds(bounds)&&Number.isFinite(at))zones=[{bounds:[...bounds],at},...zones.filter(z=>z.bounds.some((n,i)=>n!==bounds[i]))].slice(0,32);
 const all=[...elements.values()];if(all.length>8000)zones=[];
 return {version:4,elements:all.slice(-8000),zones};
}
function cacheCovers(cache,bounds,now=Date.now(),maxAge=CACHE_AGE){return validBounds(bounds)&&(cache?.zones||[]).some(z=>validBounds(z.bounds)&&Number.isFinite(z.at)&&now>=z.at&&now-z.at<maxAge&&z.bounds[0]<=bounds[0]&&z.bounds[1]<=bounds[1]&&z.bounds[2]>=bounds[2]&&z.bounds[3]>=bounds[3])}
function readCache(storage){
 let cache={version:4,elements:[],zones:[]};
 try{const saved=JSON.parse(storage.getItem(CACHE_KEY)||'null');if(saved?.version===4&&Array.isArray(saved.elements)&&Array.isArray(saved.zones))return mergeCache(saved,{elements:[]})}catch{}
 // Import previous searches without discarding stores from any visited area.
 try{const old=JSON.parse(storage.getItem('ficard.nearby-shops.v3')||'[]');if(Array.isArray(old))for(const x of [...old].reverse()){if(!Array.isArray(x?.data?.elements))continue;const coords=String(x.key||'').split('/')[0].split(',').map(Number);const bounds=coords.length===4?coords:coords.length===2?boundsFor({lat:coords[0],lng:coords[1]}):null;cache=mergeCache(cache,x.data,bounds,x.at)}}catch{}
 return cache;
}
function writeCache(storage,cache){
 // Keep room for the user's cards and photos in browser storage.
 let next=cache;while(JSON.stringify(next).length>1500000&&next.elements.length)next={...next,elements:next.elements.slice(Math.ceil(next.elements.length/4)),zones:[]};
 try{storage.setItem(CACHE_KEY,JSON.stringify(next));try{storage.removeItem('ficard.nearby-shops.v3')}catch{}return true}catch{return false}
}

async function request(q,signal){
 let last;for(const endpoint of ['https://overpass.private.coffee/api/interpreter','https://overpass-api.de/api/interpreter']){
 if(signal?.aborted)throw Error('Ricerca annullata');
 const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,30000);
 try{const r=await fetch(endpoint+'?'+new URLSearchParams({data:q}),{signal:controller.signal});if(!r.ok)throw Error('Servizio negozi: HTTP '+r.status);const data=await r.json();if(data.remark)throw Error('Ricerca incompleta. Riprova tra poco.');return data;}
 catch(e){last=e.name==='AbortError'&&!signal?.aborted?Error('Il server OpenStreetMap non risponde entro 30 secondi.'):e;if(signal?.aborted)throw e;}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
 }throw last;
}
function addressText(a={}){const road=a.road||a.pedestrian||a.footway||a.residential||'',town=a.city||a.town||a.village||a.municipality||'';return [road?[road,a.house_number].filter(Boolean).join(' '):'',town].filter(Boolean).join(', ')}
let addressQueue=Promise.resolve(),addressLast=0;const addressPending=new Map(),addressMemory=new Map();
function reverseAddress(point,storage){
 if(!Number.isFinite(point.lat)||!Number.isFinite(point.lng)||Math.abs(point.lat)>90||Math.abs(point.lng)>180)return Promise.resolve('');
 const key=point.lat.toFixed(5)+','+point.lng.toFixed(5);let cache={};try{cache=JSON.parse(storage?.getItem('ficard-addresses-v1')||'{}')||{}}catch(e){}
 if(typeof cache[key]==='string')return Promise.resolve(cache[key]);if(addressMemory.has(key))return Promise.resolve(addressMemory.get(key));if(addressPending.has(key))return addressPending.get(key);
 const job=addressQueue.catch(()=>{}).then(async()=>{
  const delay=Math.max(0,1100-(Date.now()-addressLast));if(delay)await new Promise(resolve=>setTimeout(resolve,delay));addressLast=Date.now();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{const url='https://nominatim.openstreetmap.org/reverse?'+new URLSearchParams({format:'jsonv2',lat:point.lat,lon:point.lng,zoom:18,addressdetails:1,'accept-language':'it'});const response=await fetch(url,{signal:controller.signal});if(!response.ok)return '';const data=await response.json(),address=addressText(data.address);if(address){addressMemory.set(key,address);try{cache=JSON.parse(storage?.getItem('ficard-addresses-v1')||'{}')||{};cache[key]=address;storage?.setItem('ficard-addresses-v1',JSON.stringify(Object.fromEntries(Object.entries(cache).slice(-500))))}catch(e){}}return address;
  }catch(e){return ''}finally{clearTimeout(timer)}
 });addressPending.set(key,job);addressQueue=job;job.finally(()=>addressPending.delete(key));return job;
}
root.FiCardStores={normalize,names,matches,query,parse,request,boundsFor,mergeCache,cacheCovers,readCache,writeCache,CACHE_AGE,addressText,reverseAddress};
})(window);
