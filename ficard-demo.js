/* Fi-Card onboarding demonstration cards. Virtual only: never in personal card storage, exports or analytics. */
(function(root){
'use strict';
const KEYS=['conad','leroymerlin','ovs'],MAX_RADIUS=30000,CACHE_KEY='ficard.demo.stores.v1',DONE_KEY='ficard.onboarding.cardsComplete.v1';
const ID_PREFIX='ficard-demo-';
let center=null,points={},state='waiting',inflight=null,lastTry=0,onChange=null;
function keys(realCards){
 if(realCards.length>=3){try{root.localStorage.setItem(DONE_KEY,'1')}catch{}return []}
 try{if(root.localStorage.getItem(DONE_KEY)==='1')return []}catch{}
 const owned=new Set(realCards.map(c=>c.brandKey));
 return KEYS.filter(key=>!owned.has(key)).slice(0,Math.max(0,3-realCards.length));
}
function cards(realCards,brands){
 return keys(realCards).map(key=>{
  const b=brands[key],locations=points[key]||[];
  return {id:ID_PREFIX+key,isDemo:true,name:b?.name||key,alias:'Carta dimostrativa',brandKey:key,category:b?.category||'altro',color:b?.color||'#5B3DF5',locations,code:'',format:'CODE128'};
 });
}
function isDemoId(id){return typeof id==='string'&&id.startsWith(ID_PREFIX)&&KEYS.includes(id.slice(ID_PREFIX.length))}
function getStatus(){return state}
function getPoint(key){return points[key]?.[0]||null}
function distance(a,b){
 const p=Math.PI/180,dLat=(b.lat-a.lat)*p,dLon=(b.lng-a.lng)*p;
 const x=Math.sin(dLat/2)**2+Math.cos(a.lat*p)*Math.cos(b.lat*p)*Math.sin(dLon/2)**2;
 return 12742000*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));
}
function validPosition(p){return p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Number.isFinite(p.accuracy)&&p.accuracy<=500&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180}
function descriptors(brands){const S=root.FiCardStores;return KEYS.map(key=>({id:key,names:S.names({name:brands[key]?.name||key},brands,key)}))}
function mergeMatches(data,p,brands){
 const S=root.FiCardStores;if(!data?.elements?.length)return false;
 const matches=S.parse(data,descriptors(brands));let changed=false;
 for(const m of matches){
  const d=distance(p,m.point);if(d>MAX_RADIUS)continue;
  const list=points[m.cardId]||(points[m.cardId]=[]);
  if(list.some(x=>(x.osmId&&x.osmId===m.point.osmId)||distance(x,m.point)<35))continue;
  list.push(m.point);changed=true;
 }
 if(changed){for(const key of KEYS)if(points[key])points[key].sort((a,b)=>distance(p,a)-distance(p,b)).splice(250);notify()}
 return changed;
}
function cached(p,brands){
 try{
  const v=JSON.parse(root.localStorage.getItem(CACHE_KEY)||'null');
  if(v?.version===1&&v.center&&Number.isFinite(v.at)&&Date.now()-v.at<7*86400000&&distance(p,v.center)<5000){
   for(const key of KEYS)for(const point of (Array.isArray(v.points?.[key])?v.points[key]:[])){
    if(point&&Number.isFinite(point.lat)&&Number.isFinite(point.lng)&&distance(p,point)<=MAX_RADIUS)(points[key]||(points[key]=[])).push(point);
   }
   state='partial';notify();
  }
 }catch{}
 try{const S=root.FiCardStores;mergeMatches(S.readCache(root.localStorage),p,brands)}catch{}
}
function notify(){onChange?.()}
function query(p,radius=MAX_RADIUS){
 const coord=p.lat.toFixed(6)+','+p.lng.toFixed(6);
 const pattern='Conad|Leroy.Merlin|OVS';
 return '[out:json][timeout:25];('+
  'nwr(around:'+radius+','+coord+')["shop"]["name"~"'+pattern+'",i];'+
  'nwr(around:'+radius+','+coord+')["shop"]["brand"~"'+pattern+'",i];'+
  ');out body center;';
}
function saveCache(p){
 try{root.localStorage.setItem(CACHE_KEY,JSON.stringify({version:1,center:p,points,at:Date.now()}))}catch{}
}
async function updatePosition(p,realCards,brands){
 if(!keys(realCards).length)return;
 if(!validPosition(p)){state='waiting';notify();return}
 if(center&&distance(p,center)<5000&&['ready','partial','loading'].includes(state))return;
 center={lat:p.lat,lng:p.lng};points={};cached(center,brands);
 if(root.navigator?.onLine===false){state=Object.values(points).some(x=>x.length)?'partial':'offline';notify();return}
 if(inflight){return}
 if(Date.now()-lastTry<20000){notify();return}
 lastTry=Date.now();state='loading';notify();
 const captured={...center};
 inflight=(async()=>{
  const S=root.FiCardStores,shared=root.FiCardSharedStores;
  let full=false,partial=false;
  try{
   if(!S?.request||!S?.parse)throw Error('Store locator unavailable');
   // Prefer the national store archive: one bounded request, not a 30 km city-wide Overpass scan.
   if(shared?.enabled?.()&&shared?.request){
    try{
     const b=S.boundsFor(captured,10500);
     const data=await shared.request(b);
     if(data?.source==='shared'){mergeMatches(data,captured,brands);partial=true}
    }catch(e){console.warn('FiCard demo: archivio condiviso non disponibile',e)}
   }
   // A small targeted search can work even when a 30 km Overpass query times out.
   if(!Object.values(points).some(x=>x.length)){
    try{mergeMatches(await S.request(query(captured,4500)),captured,brands);partial=true}
    catch(e){console.warn('FiCard demo: ricerca locale non disponibile',e)}
   }
   // Complete the requested 30 km radius. Keep any already-discovered shops if it fails.
   try{mergeMatches(await S.request(query(captured,MAX_RADIUS)),captured,brands);full=true}
   catch(e){console.warn('FiCard demo: ricerca 30 km non disponibile',e)}
   if(distance(captured,center)>5000)return;
   state=full?'ready':Object.values(points).some(x=>x.length)?'partial':'error';
   if(full||partial||Object.values(points).some(x=>x.length))saveCache(captured);
  }catch(e){console.warn('FiCard demo:',e);state=Object.values(points).some(x=>x.length)?'partial':'error'}
  finally{inflight=null;notify()}
 })();
 await inflight;
}
root.FiCardDemo={keys,cards,isDemoId,getStatus,getPoint,updatePosition,onChange:fn=>{onChange=fn},query,distance};
})(window);
