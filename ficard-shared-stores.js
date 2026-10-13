(function(root){
'use strict';
const ENDPOINT='https://jzmuwixgryvbbqqaudkh.supabase.co/functions/v1/ficard-store-cache',KEY='ficard.shared-store-cache.enabled';
const enabled=()=>{try{return root.localStorage?.getItem(KEY)!=='false';}catch{return true;}};
function cellsFor(b){
 if(!Array.isArray(b)||b.length!==4||!b.every(Number.isFinite)||b[0]>=b[2]||b[1]>=b[3])throw Error('Zona non valida');
 if(b[0]<35||b[2]>48||b[1]<6||b[3]>19)return null;
 const cells=[];for(let y=Math.floor(b[0]*20+1e-8);y<Math.ceil(b[2]*20-1e-8);y++)for(let x=Math.floor(b[1]*20+1e-8);x<Math.ceil(b[3]*20-1e-8);x++)cells.push({y,x});
 if(cells.length>48){const error=Error('Avvicina la mappa per cercare una zona più piccola.');error.code='AREA_TOO_LARGE';throw error;}return cells;
}
const bounds=c=>[c.y/20,c.x/20,(c.y+1)/20,(c.x+1)/20];
function validElement(e){return e&&['node','way','relation'].includes(e.type)&&Number.isSafeInteger(e.id)&&Number.isFinite(e.lat)&&Number.isFinite(e.lon)&&e.lat>=35&&e.lat<=48&&e.lon>=6&&e.lon<=19&&e.tags&&typeof e.tags==='object'&&!Array.isArray(e.tags);}
const pending=new Map();
async function request(b,signal){
 const cells=cellsFor(b);if(!cells)return {unsupported:true};
 const chunks=[];for(let i=0;i<cells.length;i+=16)chunks.push(cells.slice(i,i+16));
 const responses=await Promise.all(chunks.map(async batch=>{
  const r=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cells:batch}),signal:AbortSignal.any([...(signal?[signal]:[]),AbortSignal.timeout(12000)]),cache:'no-store'});
  if(!r.ok)throw Error('Archivio condiviso: HTTP '+r.status);
  const d=await r.json();if(d.disabled)return d;
  if(!Array.isArray(d.cells)||d.cells.length!==batch.length||d.cells.some(c=>!batch.some(expected=>expected.x===c.x&&expected.y===c.y)))throw Error('Risposta archivio non valida');return d;
 }));
 if(responses.some(d=>d.disabled))return {disabled:true};
 const data={cells:responses.flatMap(d=>d.cells),queue:responses.find(d=>d.queue)?.queue||null};
 const keys=new Set(cells.map(c=>c.y+'/'+c.x)),seen=new Set(),elements=new Map(),coverage=[];let waiting=0,partial=0;
 for(const c of data.cells){const key=c.y+'/'+c.x;if(!Number.isInteger(c.y)||!Number.isInteger(c.x)||typeof c.complete!=='boolean'||!keys.has(key)||seen.has(key)||!Array.isArray(c.elements)||!c.elements.every(validElement))throw Error('Settore archivio non valido');seen.add(key);
  for(const e of c.elements)elements.set(e.type+'/'+e.id,e);
  if(c.complete)coverage.push(bounds(c));else{partial++;if(c.snapshot_available!==true)waiting++;}
 }
 return {elements:[...elements.values()],coverage,complete:partial===0,pending:waiting,partial,source:'shared',queue:data.queue||null};
}
function prime(b){
 if(!enabled()||root.navigator?.onLine===false)return Promise.resolve(null);
 let cells;try{cells=cellsFor(b);}catch{return Promise.resolve(null);}if(!cells)return Promise.resolve(null);
 const key=JSON.stringify(cells);if(pending.has(key))return pending.get(key);
 const promise=request(b).catch(()=>null).finally(()=>pending.delete(key));pending.set(key,promise);return promise;
}
function setEnabled(value){try{root.localStorage.setItem(KEY,String(!!value));return true;}catch{return false;}}
root.FiCardSharedStores={enabled,setEnabled,cellsFor,bounds,request,prime};
const toggle=root.document?.getElementById('sharedStoreCacheToggle');
if(toggle){toggle.checked=enabled();toggle.onchange=()=>{if(!setEnabled(toggle.checked)){toggle.checked=enabled();root.toast?.('Impossibile salvare la preferenza.');return;}root.toast?.(toggle.checked?'Archivio condiviso attivo.':'Sistema precedente attivo. I dati salvati restano invariati.');};}
})(window);
