(function(root){
'use strict';
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const aliases={pam:['Pam','Panorama'],coop:['Coop','Ipercoop'],despar:['Despar','Eurospar','Interspar'],tigota:['Tigotà','Tigota'],acquaesapone:['Acqua & Sapone','Acqua e Sapone'],jdsports:['JD Sports'],idromarket:['Idromarket','Idro Market']};
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
async function request(q,signal){
 let last;for(const endpoint of ['https://overpass.private.coffee/api/interpreter','https://overpass-api.de/api/interpreter']){
 if(signal?.aborted)throw Error('Ricerca annullata');
 const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,30000);
 try{const r=await fetch(endpoint+'?'+new URLSearchParams({data:q}),{signal:controller.signal});if(!r.ok)throw Error('Servizio negozi: HTTP '+r.status);const data=await r.json();if(data.remark)throw Error('Ricerca incompleta. Riprova tra poco.');return data;}
 catch(e){last=e.name==='AbortError'&&!signal?.aborted?Error('Il server OpenStreetMap non risponde entro 30 secondi.'):e;if(signal?.aborted)throw e;}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
 }throw last;
}
root.FiCardStores={normalize,names,matches,query,parse,request};
})(window);
