/* Missing-brand requests: only a brand name, category and per-request random ID. */
(function(root){
'use strict';
const PREF='ficard.brandRequests.enabled.v1',QUEUE='ficard.brandRequests.queue.v1',SENT='ficard.brandRequests.sent.v1';
let running=false,controllers=new Set();
const categories=new Set(['supermercati','abbigliamento','sport','elettronica','casa','casalinghi','petstore','farmacia','beauty','ristorazione','carburanti','altro']);
function read(key,fallback){try{return JSON.parse(root.localStorage.getItem(key))||fallback}catch{return fallback}}
function write(key,value){try{root.localStorage.setItem(key,JSON.stringify(value))}catch{}}
function enabled(){try{return root.localStorage.getItem(PREF)!=='no'}catch{return false}}
function normalize(name){return String(name||'').normalize('NFKC').trim().replace(/\s+/g,' ').slice(0,100)}
function identity(name,category){return name.toLocaleLowerCase('it')+'|'+category}
function setEnabled(value){try{root.localStorage.setItem(PREF,value?'yes':'no')}catch{}if(!value){controllers.forEach(c=>c.abort());write(QUEUE,[])}render();if(value)flush()}
function submit(c){
 if(!enabled()||c.brandKey)return Promise.resolve(false);
 const name=normalize(c.name),category=categories.has(c.category)?c.category:'altro';
 if(name.length<2||/[\x00-\x1f@<>]|\d{6}|https?:|www\./i.test(name))return Promise.resolve(false);
 const key=identity(name,category),queue=read(QUEUE,[]),sent=read(SENT,[]);
 if(sent.includes(key)||queue.some(x=>identity(x.brand_name,x.category)===key)||queue.length>=20)return Promise.resolve(false);
 queue.push({id:root.crypto.randomUUID(),brand_name:name,category});write(QUEUE,queue);return flush();
}
async function flush(){
 const config=root.FICARD_ANALYTICS_CONFIG;
 if(running||!enabled()||root.navigator?.onLine===false||!config?.key||!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(config.url))return false;
 running=true;let success=false;
 try{for(const item of read(QUEUE,[])){
  if(!enabled())break;
  const controller=new AbortController();controllers.add(controller);const timer=root.setTimeout(()=>controller.abort(),5000);
  try{const r=await root.fetch(config.url+'/rest/v1/ficard_brand_requests',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({id:item.id,brand_name:item.brand_name,category:item.category}),credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});
   if(!enabled())break;
   if(r.ok||r.status===409){const key=identity(item.brand_name,item.category);write(SENT,[...new Set([...read(SENT,[]),key])].slice(-500));write(QUEUE,read(QUEUE,[]).filter(x=>x.id!==item.id));success=true}
   else if(r.status===400){write(QUEUE,read(QUEUE,[]).filter(x=>x.id!==item.id))}else break;
  }catch{break}finally{root.clearTimeout(timer);controllers.delete(controller)}
 }}finally{running=false}return success;
}
function render(){
 for(const id of ['brandRequestSettings','imageBrandRequestSettings','editBrandRequestSettings']){const box=root.document?.getElementById(id);if(!box)continue;
 box.innerHTML='<label style="display:flex;gap:10px;align-items:center"><input class="brandRequestsEnabled" type="checkbox" style="width:20px;height:20px;flex:none">Segnala automaticamente i marchi mancanti</label><p class="hint">Quando salvi una carta personalizzata, inviamo agli sviluppatori solo il nome del marchio e la categoria. Scrivi il marchio nel nome della carta e usa l’alias per nomi personali. Non inviamo codice, alias, foto o posizione. Le richieste vengono raggruppate e revisionate prima di aggiungere il marchio al catalogo.</p>';
 const check=box.querySelector('.brandRequestsEnabled');check.checked=enabled();check.onchange=()=>setEnabled(check.checked);}
}
root.FiCardBrandRequests={submit,flush,enabled,setEnabled,render};
root.addEventListener?.('online',flush);
function init(){render();flush()}
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof window==='undefined'?globalThis:window);
