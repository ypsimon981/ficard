/* Simple published brand catalog. Logo tools stay in the studio; satin is app styling. */
(function(root){
'use strict';
const CACHE='ficard.brandCatalog.cache.v3',CHECKED='ficard.brandCatalog.checkedAt.v3';
const LOGOS='ficard-catalog-logos-v1',MAX_AGE=6*60*60*1000;
const ENDPOINT='https://fi-card.app/developer/api.php?action=public_catalog';
const originals=new Map(),objectUrls=new Map();let applied=new Set(),pending=null,applyEpoch=0;
function readCache(){try{const v=JSON.parse(root.localStorage.getItem(CACHE)||'null');return v&&Array.isArray(v.rows)?v:null}catch{return null}}
function writeCache(v){try{root.localStorage.setItem(CACHE,JSON.stringify(v));root.localStorage.setItem(CHECKED,String(Date.now()))}catch{}}
function cleanRow(r){
 if(!r||!/^([a-z0-9][a-z0-9_-]{0,63})$/.test(r.brand_key||'')||r.status!=='published'||r.is_complete===false||!/^#[0-9a-f]{6}$/i.test(r.color||''))return null;
 let logo;try{logo=new URL(r.logo_url);if(logo.protocol!=='https:'||logo.hostname!=='fi-card.app'||logo.pathname!=='/developer/api.php'||logo.searchParams.get('action')!=='public_logo')return null}catch{return null}
 const n=Number(r.logo_scale);return {brand_key:r.brand_key,name:String(r.name||r.brand_key).slice(0,160),category:String(r.category||'altro'),color:r.color,mark:String(r.mark||r.name||r.brand_key).slice(0,160),logo_url:logo.href,logo_scale:Number.isFinite(n)?Math.max(25,Math.min(95,n)):80,revision:Number(r.revision)||1,status:'published'};
}
async function cachedLogo(url){
 if(objectUrls.has(url))return objectUrls.get(url);
 try{if(!root.caches)return url;const cache=await root.caches.open(LOGOS);let response=await cache.match(url);
  if(!response&&root.navigator?.onLine!==false){const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),6000);try{response=await root.fetch(url,{credentials:'omit',referrerPolicy:'no-referrer',signal:abort.signal})}finally{clearTimeout(timer)};if(!response.ok||!/^image\/png(?:;|$)/i.test(response.headers.get('Content-Type')||''))return url;const blob=await response.clone().blob();if(blob.size>3000000)return url;await cache.put(url,response.clone())}
  if(response){const local=root.URL.createObjectURL(await response.blob());objectUrls.set(url,local);return local}
 }catch{}return url;
}
async function applyRows(rows){
 if(typeof BRANDS!=='object')return false;
 const epoch=++applyEpoch,clean=(rows||[]).map(cleanRow).filter(Boolean),logos=new Map();let next=0;
 await Promise.all(Array.from({length:Math.min(4,clean.length)},async()=>{while(next<clean.length){const r=clean[next++];logos.set(r.brand_key,await cachedLogo(r.logo_url))}}));
 if(epoch!==applyEpoch)return false;
 const previous=new Map([...applied].map(key=>[key,BRANDS[key]]));
 for(const key of applied){const old=originals.get(key);if(old===null)delete BRANDS[key];else BRANDS[key]=old}applied=new Set();
 for(const r of clean){const key=r.brand_key;if(!originals.has(key))originals.set(key,Object.hasOwn(BRANDS,key)?{...BRANDS[key]}:null);
  BRANDS[key]={...(BRANDS[key]||{}),name:r.name,category:Object.hasOwn(CATEGORIES,r.category)?r.category:'altro',color:r.color,mark:r.mark,logo:logos.get(key),logoBg:'transparent',logoScale:r.logo_scale,studioRevision:r.revision,remoteCatalog:true,previousColors:[...new Set([...(previous.get(key)?.previousColors||[]),...(BRANDS[key]?.previousColors||[]),previous.get(key)?.color,BRANDS[key]?.color].filter(Boolean))]};applied.add(key)
 }
 refreshUi();return true;
}
function refreshUi(){try{if(typeof normalizeCategories==='function')normalizeCategories()}catch{}try{if(typeof renderAll==='function')renderAll();else if(typeof renderCards==='function')renderCards()}catch{}
 try{const select=root.document?.getElementById('addBrand');if(select&&typeof catalogOptions==='function'){const value=select.value;select.innerHTML=catalogOptions(value);select.value=value}if(typeof renderBrandResults==='function')renderBrandResults()}catch{}
}
async function performSync(){
 if(root.navigator?.onLine===false)return false;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
 try{const r=await root.fetch(ENDPOINT,{credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:controller.signal});if(!r.ok)return false;
  const data=await r.json();if(!data||!Array.isArray(data.brands)||typeof data.version!=='string')return false;
  const rows=data.brands.map(cleanRow);if(rows.some(x=>!x))return false;
  const cached=readCache();if(!cached||cached.version!==data.version){await applyRows(rows);writeCache({version:data.version,rows})}else try{root.localStorage.setItem(CHECKED,String(Date.now()))}catch{}return true;
 }catch{return false}finally{clearTimeout(timer)}
}
function sync(){if(!pending)pending=performSync().finally(()=>{pending=null});return pending}
async function boot(){if(typeof BRANDS!=='object'){setTimeout(boot,50);return}const cached=readCache();if(cached)await applyRows(cached.rows);checkAge()}
function checkAge(){let last=0;try{last=Number(root.localStorage.getItem(CHECKED)||0)}catch{}if(Date.now()-last>MAX_AGE)sync()}
root.FiCardCatalog={sync,applyRows,cache:readCache};
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else if(root.document)boot();
root.addEventListener?.('online',sync);root.document?.addEventListener('visibilitychange',()=>{if(root.document.visibilityState==='visible')checkAge()});
})(typeof window==='undefined'?globalThis:window);
