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
function cached(p){
 try{
  const v=JSON.parse(root.localStorage.getItem(CACHE_KEY)||'null');
  if(v?.version!==1||!v.center||!Number.isFinite(v.at)||Date.now()-v.at>7*86400000||distance(p,v.center)>8000)return false;
  points={};
  for(const key of KEYS){
   const list=v.points?.[key];
   if(Array.isArray(list))points[key]=list.filter(point=>point&&Number.isFinite(point.lat)&&Number.isFinite(point.lng)&&distance(p,point)<=MAX_RADIUS);
  }
  state='ready';return true;
 }catch{return false}
}
function notify(){onChange?.()}
function query(p){
 const coord=p.lat.toFixed(6)+','+p.lng.toFixed(6);
 const pattern='Conad|Leroy\\s*Merlin|OVS';
 return '[out:json][timeout:25];('+
  'nwr(around:'+MAX_RADIUS+','+coord+')["shop"]["name"~"'+pattern+'",i];'+
  'nwr(around:'+MAX_RADIUS+','+coord+')["shop"]["brand"~"'+pattern+'",i];'+
  ');out body center;';
}
async function updatePosition(p,realCards,brands){
 if(!keys(realCards).length)return;
 if(!validPosition(p)){state='waiting';notify();return}
 if(center&&distance(p,center)<8000&&state==='ready')return;
 center={lat:p.lat,lng:p.lng};
 if(cached(center)){notify();return}
 if(inflight||root.navigator?.onLine===false){state=root.navigator?.onLine===false?'offline':state;notify();return}
 if(Date.now()-lastTry<30000)return;
 lastTry=Date.now();state='loading';notify();
 const captured={...center};
 inflight=(async()=>{
  try{
   const S=root.FiCardStores;
   if(!S?.request||!S?.parse)throw Error('Store locator unavailable');
   const data=await S.request(query(captured));
   const descriptors=KEYS.map(key=>({id:key,names:S.names({name:brands[key]?.name||key},brands,key)}));
   const matches=S.parse(data,descriptors);
   const found={};
   for(const m of matches){
    const d=distance(captured,m.point);
    if(d>MAX_RADIUS)continue;
    (found[m.cardId]||(found[m.cardId]=[])).push({point:m.point,d});
   }
   if(distance(captured,center)>8000)return;
   points=Object.fromEntries(Object.entries(found).map(([key,rows])=>[key,rows.sort((a,b)=>a.d-b.d).slice(0,250).map(x=>x.point)]));
   state='ready';
   try{root.localStorage.setItem(CACHE_KEY,JSON.stringify({version:1,center:captured,points,at:Date.now()}))}catch{}
  }catch{if(distance(captured,center)<=8000)state='error'}
  finally{inflight=null;notify()}
 })();
 await inflight;
}
root.FiCardDemo={keys,cards,isDemoId,getStatus,getPoint,updatePosition,onChange:fn=>{onChange=fn},query,distance};
})(window);
