const LC=LivornoCache,$=id=>document.getElementById(id);
let storage;try{storage=localStorage;}catch(e){storage={getItem:()=>null,setItem:()=>{throw e;}};}
let data=LC.read(storage).data,filter='all',mode='online',busy=false,epoch=0,controller=null,fitted=false;
const map=L.map('map',{zoomControl:false}).setView([43.552,10.315],13);
L.control.zoom({position:'bottomright'}).addTo(map);
L.control.scale({imperial:false,position:'bottomleft'}).addTo(map);
const pins=L.layerGroup().addTo(map);
const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'});
let tileFailure=false;
tiles.on('tileerror',()=>{tileFailure=true;$('map-note').textContent='Fondomappa non disponibile: i punti restano nelle coordinate corrette.';});
function configureTiles(){
 const enabled=mode==='online'&&navigator.onLine;
 if(enabled&&!map.hasLayer(tiles)){tileFailure=false;tiles.addTo(map);}
 if(!enabled&&map.hasLayer(tiles))map.removeLayer(tiles);
 $('map-note').textContent=enabled?'Fondomappa online · dati dei punti nell’archivio Fi-Card.':'Modalità locale: punti disponibili; strade e immagini della mappa richiedono Internet.';
 $('map').classList.toggle('plain-map',!enabled);
}
function render(){
 const rows=LC.stores(data,filter),all=LC.stores(data);$('count').textContent=String(rows.length);$('cached').textContent=Object.keys(data).length+'/4';
 pins.clearLayers();$('shops').replaceChildren();
 for(const row of rows){
  const b=LC.brands[row.slug],popup=document.createElement('div'),name=document.createElement('strong'),position=document.createElement('p');
  name.textContent=row.name||b.label;position.textContent=b.label+' · '+row.lat.toFixed(5)+', '+row.lon.toFixed(5);popup.append(name,position);
  const marker=L.marker([row.lat,row.lon],{icon:L.divIcon({className:'shop-pin',html:'<span style="--pin:'+b.color+'">'+b.initial+'</span>',iconSize:[40,44],iconAnchor:[20,42],popupAnchor:[0,-36]})}).bindPopup(popup).addTo(pins);
  const item=document.createElement('button');item.type='button';item.className='shop';
  const badge=document.createElement('span');badge.className='brand-badge';badge.style.background=b.color;badge.textContent=b.initial;
  const content=document.createElement('span'),title=document.createElement('strong'),meta=document.createElement('small');title.textContent=row.name||b.label;meta.textContent=b.label+' · '+row.osm_type+'/'+row.osm_id;content.append(title,meta);item.append(badge,content);
  item.onclick=()=>{map.setView([row.lat,row.lon],16);marker.openPopup();$('map').scrollIntoView({behavior:'smooth',block:'center'});};$('shops').append(item);
 }
 if(!rows.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='Nessun punto salvato per questa selezione. Connettiti e premi Aggiorna archivio.';$('shops').append(empty);}
 if(rows.length&&!fitted){map.fitBounds(rows.map(x=>[x.lat,x.lon]),{padding:[35,35],maxZoom:14});fitted=true;}
 for(const b of document.querySelectorAll('[data-brand]')){const slug=b.dataset.brand;b.setAttribute('aria-pressed',String(slug===filter));b.querySelector('i').textContent=slug==='all'?all.length:(data[slug]?.stores.length||0);}
 const dates=Object.values(data).map(d=>Date.parse(d.state?.fetched_at)).filter(Number.isFinite);
 $('saved-at').textContent=dates.length?'Dati importati: '+new Date(Math.min(...dates)).toLocaleString('it-IT'):'Nessun archivio locale ancora disponibile.';
 if(Object.values(data).some(LC.expired))$('saved-at').textContent+=' · cache scaduta, aggiornamento necessario';
}
function status(message,kind='ok'){$('status').textContent=message;$('status').dataset.kind=kind;}
async function load(){
 if(busy)return;busy=true;const current=++epoch;controller=new AbortController();const start=performance.now();$('refresh').disabled=true;status('Lettura dell’archivio…','loading');
 try{
  const result=await LC.refresh({storage,mode,online:navigator.onLine,signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});
  if(current!==epoch)return;data=result.data;render();$('latency').textContent=Math.round(performance.now()-start)+' ms';
  const total=LC.stores(data).length;
  if(result.errors.length)status((mode==='error'?'Errore simulato. ':'Server non disponibile per tutti i marchi. ')+(total?'I '+total+' punti già salvati restano visibili.':'Nessun dato salvato: serve un primo caricamento online.'),'warning');
  else status(result.source==='local'?'Lettura locale: '+total+' punti, nessuna richiesta al server.':'Archivio caricato: '+total+' punti.','ok');
  $('diagnostic').textContent=JSON.stringify({origine:result.source,modalità:mode,richieste_server:result.requests,marchi:Object.keys(data),punti:total,errori:result.errors,avvisi:result.warnings},null,2);
  if(result.warnings.length)status('Punti visibili, ma il salvataggio locale non è riuscito per tutti i marchi.','warning');
 }catch(e){if(current===epoch)status('Caricamento interrotto; i punti salvati restano visibili.','warning');}
 finally{if(current===epoch){busy=false;controller=null;$('refresh').disabled=false;}}
}
function switchMode(next){mode=next;++epoch;controller?.abort();busy=false;$('refresh').disabled=false;for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===mode));configureTiles();load();}
for(const b of document.querySelectorAll('[data-brand]'))b.onclick=()=>{filter=b.dataset.brand;render();};
for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>switchMode(b.dataset.mode);
$('refresh').onclick=load;$('reset-map').onclick=()=>{const rows=LC.stores(data,filter);if(rows.length)map.fitBounds(rows.map(x=>[x.lat,x.lon]),{padding:[35,35],maxZoom:14});else map.setView([43.552,10.315],13);};
window.addEventListener('online',()=>{configureTiles();if(mode==='online')load();});window.addEventListener('offline',()=>{configureTiles();if(mode==='online')switchMode('cache');});
configureTiles();render();if(!navigator.onLine)switchMode('cache');else load();
if('serviceWorker' in navigator){
 const entry=location.pathname;const vendor=new URL('../vendor/',location.href).pathname;
 navigator.serviceWorker.register('./livorno-sw.js?entry='+encodeURIComponent(entry)+'&vendor='+encodeURIComponent(vendor)).then(async registration=>{
  const worker=registration.installing||registration.waiting||registration.active;
  if(worker&&worker.state!=='activated')await new Promise((resolve,reject)=>{if(worker.state==='redundant')return reject(Error('Offline installation failed'));worker.addEventListener('statechange',()=>{if(worker.state==='activated')resolve();if(worker.state==='redundant')reject(Error('Offline installation failed'));});});
  $('shell').textContent='Pagina pronta per la riapertura offline su questo browser.';
 }).catch(()=>{$('shell').textContent='Riapertura offline della pagina non disponibile su questo browser. I dati restano salvati.';});
}else $('shell').textContent='Questo browser non supporta la riapertura offline della pagina.';
