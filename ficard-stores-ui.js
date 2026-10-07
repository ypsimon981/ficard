/* Discovered shops are cached locally; only explicit favourites enter card backups. */
(function(){
if(scannerBridge)return;
const S=FiCardStores;let results=[],searchCenter=null,controller=null,requestId=0,busy=false,status='',lastKey='',mapFramed=false;
let shopCache=S.readCache(localStorage),matchedCards='',mapSignature='',listSignature='';
function matchCachedShops(force=false){const ds=descriptors(),key=JSON.stringify(ds);if(force||key!==matchedCards){results=S.parse(shopCache,ds);matchedCards=key}}
const baseSmartCarousel=renderSmartCarousel;renderSmartCarousel=function(){matchCachedShops();baseSmartCarousel()};
function shopSignature(items,distances=true){const rows=items.map(x=>JSON.stringify([x.c.id,x.c.name,x.c.color,x.c.brandKey,x.l,x.favorite,x.saved,distances?Math.round(x.d):null]));return JSON.stringify(distances?rows:rows.sort())}

const savedFavorite=l=>l.favorite===true;
function descriptors(){return cards.map(c=>({id:c.id,names:S.names(c,BRANDS,inferredBrandKey(c))})).filter(d=>d.names.length)}
function savedAt(c,l){return (c.locations||[]).find(p=>(l.osmId&&p.osmId===l.osmId)||distanceM(p,l)<50)}
function shops(cardId=''){
 const items=[];for(const c of cards){if(cardId&&c.id!==cardId)continue;
 for(const l of c.locations||[])items.push({c,l,saved:true,favorite:savedFavorite(l)});
 for(const x of results.filter(x=>x.cardId===c.id)){if(!savedAt(c,x.point))items.push({c,l:x.point,saved:false,favorite:false})}
 }const origin=currentPos||searchCenter;return items.map(x=>({...x,d:origin?distanceM(origin,x.l):Infinity})).sort((a,b)=>a.d-b.d||a.c.name.localeCompare(b.c.name,'it'));
}
function storeBrand(c){const key=c.brandKey||inferredBrandKey(c);return {key:key||'custom:'+c.name.trim().toLocaleLowerCase('it'),name:BRANDS[key]?.name||c.name}}
function heartSvg(active){return '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="'+(active?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>'}
function filtered(){const category=document.getElementById('shopCategory').value,brand=document.getElementById('shopCard').value,fav=document.getElementById('shopFavorites').checked;return shops().filter(x=>(!category||categoryFor(x.c)===category)&&(!brand||storeBrand(x.c).key===brand)&&(!fav||x.favorite))}
function populate(){
 const category=document.getElementById('shopCategory');
 const categories=Object.entries(CATEGORIES).filter(([k])=>cards.some(c=>categoryFor(c)===k));
 if(!categories.some(([k])=>k===category.value))category.value='';
 const brands=[...new Map(cards.filter(c=>!category.value||categoryFor(c)===category.value).map(c=>{const b=storeBrand(c);return [b.key,b.name]})).entries()].sort((a,b)=>a[1].localeCompare(b[1],'it'));
 for(const [id,values] of [['shopCategory',categories],['shopCard',brands]]){
  const el=document.getElementById(id),value=el.value;
  el.innerHTML='<option value="">'+(id==='shopCategory'?'Tutte le categorie':'Tutti i marchi')+'</option>'+values.map(([k,n])=>'<option value="'+esc(k)+'">'+esc(n)+'</option>').join('');
  el.value=values.some(([k])=>k===value)?value:'';
 }
}
function navigate(x){document.getElementById('navigationDestination').textContent=(x.l.name||x.c.name)+' · '+distanceLabel(x.d);document.getElementById('navigationChoices').innerHTML=navigationLinks(x.l).map(n=>'<a href="'+esc(n.url)+'" target="_blank" rel="noopener noreferrer">↗ '+esc(n.name)+'</a>').join('');document.querySelectorAll('#navigationChoices a').forEach(a=>a.onclick=()=>hideModal('navigationModal'));showModal('navigationModal')}
function favorite(x){let l=savedAt(x.c,x.l);if(l)l.favorite=!savedFavorite(l);else{l={...x.l,source:'osm-favorite',favorite:true,createdAt:Date.now()};(x.c.locations||(x.c.locations=[])).push(l)}save();renderSmartCarousel();renderLocations();renderOverviewMap();renderDetail();}
function cardBarcodeSvg(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M6 8h5M6 12v5M9 12v5M12 12v5M16 10v7M19 10v7"/></svg>'}
async function findAddress(x){const address=await S.reverseAddress(x.l,localStorage);if(address&&cards.includes(x.c)&&(x.c.locations||[]).includes(x.l)){x.l.address=address;save();renderShopUpdates()}return address}
function shopAddressLabel(l){return l.address||[l.street,l.houseNumber].filter(Boolean).join(' ')||l.zone||l.suburb||l.neighbourhood||l.quarter||l.postcode||l.city||''}
function row(x){const el=document.createElement('div');el.className='promo locationResult'+(x.favorite?' favoriteStore':'');const visual=mapBrandVisual(x.c);el.innerHTML='<div class="locationBrandIcon" style="background:'+esc(visual.color)+'"><span>'+mapBrandInnerHtml(x.c)+'</span></div><div class="grow"><b>'+esc(x.l.name||x.c.name)+'</b><small class="shopAddress">'+esc(shopAddressLabel(x.l)||'Indirizzo non disponibile')+'</small><small class="shopDistance">'+esc(distanceLabel(x.d))+'</small><small class="shopOrigin">'+(x.saved&&isManualLocation(x.l)?'Aggiunto a mano':'Da OpenStreetMap')+'</small></div><div class="shopActions"><button type="button" class="chip" data-shop-open aria-label="Apri carta" title="Apri carta">'+cardBarcodeSvg()+'</button><button type="button" class="chip" data-shop-nav aria-label="Naviga">'+pinSvg()+'</button><button type="button" class="chip" data-shop-fav aria-label="'+(x.favorite?'Rimuovi negozio dai preferiti':'Salva negozio tra i preferiti')+'" aria-pressed="'+x.favorite+'">'+heartSvg(x.favorite)+'</button></div>';
 el.querySelector('[data-shop-open]').onclick=()=>openCard(x.c.id);el.querySelector('[data-shop-nav]').onclick=()=>navigate(x);el.querySelector('[data-shop-fav]').onclick=()=>favorite(x);
 if(x.saved&&isManualLocation(x.l)){const remove=document.createElement('button');remove.className='chip';remove.innerHTML=trashSvg();remove.setAttribute('aria-label','Dissocia punto vendita');remove.title='Dissocia punto vendita';remove.dataset.shopRemove='';remove.onclick=()=>{const i=x.c.locations.indexOf(x.l);if(i>=0){removeLocation(x.c.id,i);renderDetail()}};el.querySelector('.shopActions').append(remove)}
 if(x.saved&&isManualLocation(x.l)&&!x.l.address){const addressButton=document.createElement('button');addressButton.type='button';addressButton.className='shopAddressLookup';addressButton.textContent='Trova indirizzo';addressButton.onclick=async()=>{addressButton.disabled=true;addressButton.textContent='Cerco indirizzo…';const address=await findAddress(x);if(address){addressButton.replaceWith(Object.assign(document.createElement('small'),{textContent:address}))}else{addressButton.disabled=false;addressButton.textContent='Trova indirizzo';toast('Indirizzo non disponibile. Riprova con una connessione attiva.')}};el.querySelector('.grow').append(addressButton)}return el;}
function list(el,items,empty){el.replaceChildren();if(!items.length){const p=document.createElement('p');p.className='hint';p.textContent=empty;el.append(p)}else items.slice(0,100).forEach(x=>el.append(row(x)));}
renderLocations=function(){
 populate();if(!document.getElementById('mapView')?.classList.contains('active'))return;
 const items=filtered(),favorites=items.filter(x=>x.favorite),others=items.filter(x=>!x.favorite),signature=shopSignature(items);
 if(signature!==listSignature){listSignature=signature;
 list(document.getElementById('favoriteStoresList'),favorites,'Nessun negozio preferito con questi filtri. Tocca il cuore su un negozio per aggiungerlo.');
 const onlyFavorites=document.getElementById('shopFavorites').checked;
 document.getElementById('otherStoresTitle').hidden=onlyFavorites;
 document.getElementById('locationsList').hidden=onlyFavorites;
 list(document.getElementById('locationsList'),others,'Nessun altro negozio con questi filtri. Cerca nella zona o aggiungi un punto dalla tessera.');
 }
 document.getElementById('otherStoresTitle').hidden=document.getElementById('shopFavorites').checked;document.getElementById('locationsList').hidden=document.getElementById('shopFavorites').checked;
 document.getElementById('mapInfo').textContent=(busy?'Ricerca in corso… ':status?status+' ':'')+items.length+' negozi · '+favorites.length+' preferiti · distanze in linea d’aria. Dati © OpenStreetMap contributors.';
 document.getElementById('shopSearchHere').disabled=false;
 document.getElementById('shopSearchHere').textContent=busy?'Annulla ricerca':'Cerca in questa zona';
};
renderOverviewMap=function(){
 if(!document.getElementById('mapView')?.classList.contains('active'))return;
 const el=document.getElementById('overviewMap');if(!el||!window.L)return;
 if(!overviewMap){overviewMap=L.map(el,{zoomControl:true}).setView([42.2,12.5],6);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(overviewMap)}
 const items=filtered(),signature=shopSignature(items,false);
 if(!overviewLayer||signature!==mapSignature){
  mapSignature=signature;if(overviewLayer)overviewLayer.remove();
  overviewLayer=(L.markerClusterGroup?L.markerClusterGroup({maxClusterRadius:45,showCoverageOnHover:false,spiderfyDistanceMultiplier:1.8,chunkedLoading:true,chunkInterval:40,chunkDelay:20,
   iconCreateFunction:cluster=>L.divIcon({className:'storeCluster',html:'<div class="storeClusterBadge"><b>'+cluster.getChildCount()+'</b><small>negozi</small></div>',iconSize:[48,48],iconAnchor:[24,24]})
  }):L.layerGroup()).addTo(overviewMap);
  const markers=items.map(x=>{const icon=mapCardPinIcon(x.c);
   return L.marker([x.l.lat,x.l.lng],{icon}).bindPopup(()=>{const popup=document.createElement('div');const origin=currentPos||searchCenter;popup.append(row({...x,d:origin?distanceM(origin,x.l):Infinity}));return popup},{minWidth:245,maxWidth:300})});
  if(overviewLayer.addLayers)overviewLayer.addLayers(markers);else markers.forEach(m=>overviewLayer.addLayer(m));
 }
 if(currentPos){if(currentPosLayer)currentPosLayer.setLatLng([currentPos.lat,currentPos.lng]);else currentPosLayer=L.circleMarker([currentPos.lat,currentPos.lng],{radius:9,weight:3,fillOpacity:.6}).addTo(overviewMap).bindTooltip('La tua posizione')}
 setTimeout(()=>{overviewMap.invalidateSize();if(!mapFramed){if(currentPos){overviewMap.setView([currentPos.lat,currentPos.lng],13);mapFramed=true}else if(items.length){overviewMap.fitBounds(items.map(x=>[x.l.lat,x.l.lng]),{maxZoom:14,padding:[25,25]});mapFramed=true}}},80);
};
function renderShopUpdates(){renderSmartCarousel();renderLocations();renderOverviewMap();renderDetail()}
async function search(center,force=false,bounds=null){
 matchCachedShops();const ds=descriptors(),allNames=[...new Set(ds.flatMap(d=>d.names))].sort();if(!allNames.length){status='Aggiungi prima una tessera.';renderLocations();return}
 let query;try{query=S.query(center,allNames,3000,bounds)}catch(e){status=e.message;renderLocations();return}
 const area=bounds||S.boundsFor(center),needed=bounds||S.boundsFor(center,1000),key=area.map(n=>n.toFixed(5)).join(',');
 searchCenter={lat:center.lat,lng:center.lng};
 // Small GPS movements and card changes reuse the same stored geographic area.
 if(!force&&S.cacheCovers(shopCache,needed)){status='Negozi dalla cache locale.';renderShopUpdates();return}
 if(busy&&key===lastKey)return;
 controller?.abort();controller=new AbortController();const active=controller,id=++requestId;lastKey=key;busy=true;status='';renderShopUpdates();
 try{const data=await S.request(query,active.signal);if(id!==requestId)return;
  shopCache=S.mergeCache(shopCache,data,area);matchCachedShops(true);
  const stored=S.writeCache(localStorage,shopCache);status='Negozi aggiornati'+(stored?' e salvati sul dispositivo.':'. Cache piena: risultati disponibili in questa sessione.');
 }catch(e){if(id!==requestId)return;console.warn('FiCard negozi:',e);status='Mostro i negozi già disponibili. '+(e.message||'Ricerca non disponibile.');}
 finally{if(id===requestId){busy=false;renderShopUpdates()}}
}
function renderDetail(){if(!document.getElementById('detailModal')?.classList.contains('show'))return;const el=document.getElementById('cardNearbyStores');if(!el)return;const c=cards.find(c=>c.id===currentCardId);if(!c)return;const items=shops(c.id),favorites=items.filter(x=>x.favorite),nearby=items.filter(x=>!x.favorite);el.replaceChildren();for(const [title,rows] of [['Negozi preferiti',favorites],['Altri negozi vicini',nearby]]){const h=document.createElement('h3');h.textContent=title==='Negozi preferiti'?'♥ '+title:title;const section=document.createElement('section');if(title==='Negozi preferiti'){section.className='favoriteStoresSection';section.setAttribute('aria-label',title)}section.append(h);el.append(section);const box=document.createElement('div');list(box,rows,busy?'Cerco i negozi…':title==='Negozi preferiti'?'Tocca il cuore su un negozio per salvarlo.':'Nessun altro negozio trovato in questa zona.');section.append(box)}const button=document.createElement('button');button.className='secondary';button.textContent='Trova negozi vicini';button.onclick=async()=>{try{const p=currentPos||await getPosition();currentPos=p;await search(p,true)}catch(e){toast(e.message)}};el.append(button)}
const baseOpen=openCard;openCard=function(id,recordUse=true){baseOpen(id,recordUse);const c=cards.find(c=>c.id===id),mapButton=document.getElementById('cardMapBtn');if(c&&mapButton)mapButton.onclick=()=>openMapForCard(c);const section=document.querySelector('#detailContent .cardLocations');if(section){const actions=section.querySelector('.detailActions');section.replaceChildren(actions);const box=document.createElement('div');box.id='cardNearbyStores';section.append(box);renderDetail();if(currentPos&&!busy)search(currentPos)}};
smartShopCandidates=function(){return shops().map(x=>({c:x.c,l:x.l}))};
const baseNearest=nearestFor;nearestFor=function(c,pos){let n=baseNearest(c,pos);if(pos)for(const x of results.filter(x=>x.cardId===c.id)){const d=distanceM(pos,x.point);if(!n||d<n.d)n={...x.point,d}}return n};
function resetShopFilters(){document.getElementById('shopCategory').value='';document.getElementById('shopCard').value='';document.getElementById('shopFavorites').checked=false;renderLocations();renderOverviewMap()}
document.getElementById('shopReset').onclick=resetShopFilters;
for(const id of ['shopCategory','shopCard','shopFavorites'])document.getElementById(id).onchange=()=>{renderLocations();renderOverviewMap()};
document.getElementById('shopSearchHere').onclick=()=>{if(busy){requestId++;controller?.abort();busy=false;status='Ricerca annullata.';renderShopUpdates();return}if(!overviewMap)return;const p=overviewMap.getCenter(),b=overviewMap.getBounds();search({lat:p.lat,lng:p.lng},true,[b.getSouth(),b.getWest(),b.getNorth(),b.getEast()])};
document.getElementById('mapRefresh').onclick=async()=>{try{currentPos=await getPosition();mapFramed=true;renderAll();if(overviewMap)overviewMap.setView([currentPos.lat,currentPos.lng],13);await search(currentPos)}catch(e){status=e.message;renderLocations();toast(e.message)}};
const baseRefresh=refreshPosition;refreshPosition=async function(){await baseRefresh();if(currentPos)search(currentPos)};
const baseGo=go;go=function(v){baseGo(v);if(v==='map'){matchCachedShops();renderLocations();renderOverviewMap();if(currentPos&&!busy)search(currentPos);if(!currentPos&&!busy){status='Usa La mia posizione oppure sposta la mappa e cerca nella zona.';renderLocations()}}};
const baseAppendLocation=appendUniqueLocation;appendUniqueLocation=function(c,point){const added=baseAppendLocation(c,point);if(added&&isManualLocation(point))findAddress({c,l:point});return added};
matchCachedShops();S.writeCache(localStorage,shopCache);populate();renderLocations();
function openMapForCard(c){
 matchCachedShops();document.getElementById('shopCategory').value='';document.getElementById('shopFavorites').checked=false;populate();document.getElementById('shopCard').value=storeBrand(c).key;mapFramed=false;hideModal('detailModal');go('map');
}
})();

