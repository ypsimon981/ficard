/* Nearby shops stay transient; only explicit favourites enter card backups. */
(function(){
if(scannerBridge)return;
const S=FiCardStores,CACHE='ficard.nearby-shops.v3';let results=[],searchCenter=null,controller=null,requestId=0,busy=false,status='',lastKey='',mapFramed=false;
const savedFavorite=l=>l.favorite!==false;
function descriptors(){return cards.map(c=>({id:c.id,names:S.names(c,BRANDS,inferredBrandKey(c))})).filter(d=>d.names.length)}
function savedAt(c,l){return (c.locations||[]).find(p=>(l.osmId&&p.osmId===l.osmId)||distanceM(p,l)<50)}
function shops(cardId=''){
 const items=[];for(const c of cards){if(cardId&&c.id!==cardId)continue;
 for(const l of c.locations||[])items.push({c,l,saved:true,favorite:savedFavorite(l)});
 for(const x of results.filter(x=>x.cardId===c.id)){if(!savedAt(c,x.point))items.push({c,l:x.point,saved:false,favorite:false})}
 }const origin=currentPos||searchCenter;return items.map(x=>({...x,d:origin?distanceM(origin,x.l):Infinity})).sort((a,b)=>a.d-b.d||a.c.name.localeCompare(b.c.name,'it'));
}
function filtered(){const category=document.getElementById('shopCategory').value,card=document.getElementById('shopCard').value,fav=document.getElementById('shopFavorites').checked;return shops().filter(x=>(!category||categoryFor(x.c)===category)&&(!card||x.c.id===card)&&(!fav||x.favorite))}
function populate(){
 const category=document.getElementById('shopCategory');
 const categories=Object.entries(CATEGORIES).filter(([k])=>cards.some(c=>categoryFor(c)===k));
 if(!categories.some(([k])=>k===category.value))category.value='';
 for(const [id,values] of [['shopCategory',categories],['shopCard',cards.filter(c=>!category.value||categoryFor(c)===category.value).map(c=>[c.id,c.name])]]){
  const el=document.getElementById(id),value=el.value;
  el.innerHTML='<option value="">'+(id==='shopCategory'?'Tutte le categorie':'Tutte le tessere')+'</option>'+values.map(([k,n])=>'<option value="'+esc(k)+'">'+esc(n)+'</option>').join('');
  el.value=values.some(([k])=>k===value)?value:'';
 }
}
function navigate(x){document.getElementById('navigationDestination').textContent=(x.l.name||x.c.name)+' · '+distanceLabel(x.d);document.getElementById('navigationChoices').innerHTML=navigationLinks(x.l).map(n=>'<a href="'+esc(n.url)+'" target="_blank" rel="noopener noreferrer">↗ '+esc(n.name)+'</a>').join('');document.querySelectorAll('#navigationChoices a').forEach(a=>a.onclick=()=>hideModal('navigationModal'));showModal('navigationModal')}
function favorite(x){let l=savedAt(x.c,x.l);if(l)l.favorite=!savedFavorite(l);else{l={...x.l,source:'osm-favorite',favorite:true,createdAt:Date.now()};(x.c.locations||(x.c.locations=[])).push(l)}save();renderSmartCarousel();renderLocations();renderOverviewMap();renderDetail();}
function row(x){const el=document.createElement('div');el.className='promo locationResult';const visual=mapBrandVisual(x.c);el.innerHTML='<div class="locationBrandIcon" style="background:'+esc(visual.color)+'"><span>'+mapBrandInnerHtml(x.c)+'</span></div><div class="grow"><b>'+esc(x.l.name||x.c.name)+'</b><small>'+esc(x.c.name+' · '+distanceLabel(x.d))+'</small>'+(x.l.address?'<small>'+esc(x.l.address)+'</small>':'')+'<small>'+ (x.saved?'Salvato sulla tessera':'Da OpenStreetMap')+'</small></div><div class="shopActions"><button type="button" class="chip" data-shop-open>Apri carta</button><button type="button" class="chip" data-shop-nav aria-label="Naviga">'+pinSvg()+'</button><button type="button" class="chip" data-shop-fav aria-label="'+(x.favorite?'Rimuovi negozio dai preferiti':'Salva negozio tra i preferiti')+'" aria-pressed="'+x.favorite+'">'+(x.favorite?'★':'☆')+'</button></div>';
 el.querySelector('[data-shop-open]').onclick=()=>openCard(x.c.id);el.querySelector('[data-shop-nav]').onclick=()=>navigate(x);el.querySelector('[data-shop-fav]').onclick=()=>favorite(x);
 if(x.saved){const remove=document.createElement('button');remove.className='chip';remove.textContent='Dissocia';remove.onclick=()=>{const i=x.c.locations.indexOf(x.l);if(i>=0){removeLocation(x.c.id,i);renderDetail()}};el.querySelector('.shopActions').append(remove)}return el;}
function list(el,items,empty){el.replaceChildren();if(!items.length){const p=document.createElement('p');p.className='hint';p.textContent=empty;el.append(p)}else items.slice(0,100).forEach(x=>el.append(row(x)));}
renderLocations=function(){populate();const items=filtered();list(document.getElementById('locationsList'),items,busy?'Cerco i negozi…':'Nessun negozio con questi filtri. Cerca nella zona o aggiungi un punto dalla tessera.');document.getElementById('mapInfo').textContent=(busy?'Ricerca in corso… ':status?status+' ':'')+items.length+' negozi ('+items.filter(x=>x.saved).length+' salvati, '+items.filter(x=>!x.saved).length+' da OSM) · distanze in linea d’aria. Dati © OpenStreetMap contributors.';document.getElementById('shopSearchHere').disabled=false;document.getElementById('shopSearchHere').textContent=busy?'Annulla ricerca':'Cerca in questa zona';};
renderOverviewMap=function(){
 const el=document.getElementById('overviewMap');if(!el||!window.L)return;
 if(!overviewMap){overviewMap=L.map(el,{zoomControl:true}).setView([42.2,12.5],6);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(overviewMap)}
 if(overviewLayer)overviewLayer.remove();if(currentPosLayer){currentPosLayer.remove();currentPosLayer=null}
 overviewLayer=(L.markerClusterGroup?L.markerClusterGroup({maxClusterRadius:45,showCoverageOnHover:false,spiderfyDistanceMultiplier:1.8,
 iconCreateFunction:cluster=>L.divIcon({className:'storeCluster',html:'<div class="storeClusterBadge"><b>'+cluster.getChildCount()+'</b><small>negozi</small></div>',iconSize:[48,48],iconAnchor:[24,24]})
 }):L.layerGroup()).addTo(overviewMap);
 const items=filtered();for(const x of items){const v=mapBrandVisual(x.c),icon=L.divIcon({className:'',html:'<div class="brandPin" style="background:'+esc(v.color)+'"><div class="brandPinInner">'+mapBrandInnerHtml(x.c)+'</div></div>',iconSize:[40,40],iconAnchor:[20,38]});const popup=document.createElement('div');popup.append(row(x));L.marker([x.l.lat,x.l.lng],{icon}).addTo(overviewLayer).bindPopup(popup,{minWidth:245,maxWidth:300})}
 if(currentPos)currentPosLayer=L.circleMarker([currentPos.lat,currentPos.lng],{radius:9,weight:3,fillOpacity:.6}).addTo(overviewMap).bindTooltip('La tua posizione');
 setTimeout(()=>{overviewMap.invalidateSize();if(!mapFramed){if(currentPos){overviewMap.setView([currentPos.lat,currentPos.lng],13);mapFramed=true}else if(items.length){overviewMap.fitBounds(items.map(x=>[x.l.lat,x.l.lng]),{maxZoom:14,padding:[25,25]});mapFramed=true}}},80);
 if(currentPos&&!busy&&!lastKey)search(currentPos);
};
async function search(center,force=false,bounds=null){
 const ds=descriptors(),allNames=[...new Set(ds.flatMap(d=>d.names))].sort();if(!allNames.length){status='Aggiungi prima una tessera.';renderLocations();return}
 let query;try{query=S.query(center,allNames,3000,bounds)}catch(e){status=e.message;renderLocations();return}
 const key=[bounds?bounds.map(n=>n.toFixed(5)).join(','):center.lat.toFixed(3)+','+center.lng.toFixed(3),allNames.join('|')].join('/');if(key===lastKey&&!force)return;lastKey=key;searchCenter={lat:center.lat,lng:center.lng};controller?.abort();controller=new AbortController();const active=controller,id=++requestId;busy=true;status='';
 let cache=[];try{cache=JSON.parse(localStorage.getItem(CACHE)||'[]');if(!Array.isArray(cache))cache=[];cache=cache.filter(x=>x&&typeof x.key==='string'&&Number.isFinite(x.at)&&Array.isArray(x.data?.elements))}catch{}
 const hit=cache.find(x=>x.key===key);if(hit){results=S.parse(hit.data,ds);status='Risultati salvati.';renderLocations();renderOverviewMap();renderDetail();renderSmartCarousel();if(!force&&Date.now()-hit.at<86400000){busy=false;renderLocations();return}}
 else results=[];renderLocations();renderDetail();renderOverviewMap();
 try{const data=await S.request(query,active.signal);if(id!==requestId)return;results=S.parse(data,descriptors());status='Ricerca completata '+(bounds?'nell’area visibile.':'nei dintorni (zona di circa 6 × 6 km).');try{localStorage.setItem(CACHE,JSON.stringify([{key,at:Date.now(),data},...cache.filter(x=>x.key!==key)].slice(0,6)))}catch{}}
 catch(e){if(id!==requestId)return;console.warn('FiCard negozi:',e);status=(hit?'Mostro i risultati salvati. ':'I negozi salvati restano visibili. ')+(e.message||'Ricerca non disponibile.');}
 finally{if(id===requestId){busy=false;renderLocations();renderOverviewMap();renderDetail();renderSmartCarousel()}}
}
function renderDetail(){const el=document.getElementById('cardNearbyStores');if(!el)return;const c=cards.find(c=>c.id===currentCardId);if(!c)return;const items=shops(c.id),favorites=items.filter(x=>x.favorite),nearby=items.filter(x=>!x.favorite);el.replaceChildren();for(const [title,rows] of [['Negozi preferiti',favorites],['Altri negozi vicini',nearby]]){const h=document.createElement('h3');h.textContent=title;el.append(h);const box=document.createElement('div');list(box,rows,busy?'Cerco i negozi…':title==='Negozi preferiti'?'Tocca ☆ su un negozio per salvarlo.':'Nessun altro negozio trovato in questa zona.');el.append(box)}const button=document.createElement('button');button.className='secondary';button.textContent='Trova negozi vicini';button.onclick=async()=>{try{const p=currentPos||await getPosition();currentPos=p;await search(p,true)}catch(e){toast(e.message)}};el.append(button)}
const baseOpen=openCard;openCard=function(id,recordUse=true){baseOpen(id,recordUse);const section=document.querySelector('#detailContent .cardLocations');if(section){const actions=section.querySelector('.detailActions');section.replaceChildren(actions);const box=document.createElement('div');box.id='cardNearbyStores';section.append(box);renderDetail();if(currentPos&&!lastKey&&!busy)search(currentPos)}};
const baseNearest=nearestFor;nearestFor=function(c,pos){let n=baseNearest(c,pos);if(pos)for(const x of results.filter(x=>x.cardId===c.id)){const d=distanceM(pos,x.point);if(!n||d<n.d)n={...x.point,d}}return n};
for(const id of ['shopCategory','shopCard','shopFavorites'])document.getElementById(id).onchange=()=>{renderLocations();renderOverviewMap()};
document.getElementById('shopSearchHere').onclick=()=>{if(busy){requestId++;controller?.abort();busy=false;status='Ricerca annullata.';renderLocations();renderDetail();return}if(!overviewMap)return;const p=overviewMap.getCenter(),b=overviewMap.getBounds();search({lat:p.lat,lng:p.lng},true,[b.getSouth(),b.getWest(),b.getNorth(),b.getEast()])};
document.getElementById('mapRefresh').onclick=async()=>{try{currentPos=await getPosition();mapFramed=true;renderAll();if(overviewMap)overviewMap.setView([currentPos.lat,currentPos.lng],13);await search(currentPos,true)}catch(e){status=e.message;renderLocations();toast(e.message)}};
const baseRefresh=refreshPosition;refreshPosition=async function(){await baseRefresh();if(currentPos)search(currentPos)};
const baseGo=go;go=function(v){baseGo(v);if(v==='map'){renderLocations();renderOverviewMap();if(!currentPos&&!busy){status='Usa La mia posizione oppure sposta la mappa e cerca nella zona.';renderLocations()}}};
populate();renderLocations();
})();
