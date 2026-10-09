/* Fi-Card v0.9.183 · Local daily cap, stable session content, offline tips. */
(function(root){
'use strict';
const DAILY='ficard.content.day.v1',SESSION='ficard.content.session.v1',IDLE=30*60*1000;
let count=3,last=0,choices={};
const COPY={
 it:['Consiglio','Pubblicità','Apri','Associa il negozio','Aggiungi il punto vendita alla tessera: sarà più facile trovarla quando sei vicino.','Salva un backup','Conserva una copia delle tue tessere dalle Impostazioni.','Prova ScanDixit','Scansiona un prodotto per cercare informazioni prima di acquistarlo.','Scegli i preferiti','Tocca la stella sulle tessere che vuoi trovare nel filtro Preferite.'],
 en:['Tip','Advertisement','Open','Link your store','Add a store location to your card to find it more easily nearby.','Save a backup','Keep a copy of your cards from Settings.','Try ScanDixit','Scan a product to look up information before buying.','Choose favourites','Tap the star on cards to find them in Favourites.'],
 fr:['Conseil','Publicité','Ouvrir','Associez le magasin','Ajoutez le magasin à votre carte pour la retrouver à proximité.','Sauvegardez vos cartes','Conservez une copie de vos cartes dans les paramètres.','Essayez ScanDixit','Scannez un produit pour chercher des informations avant de l’acheter.','Choisissez vos favoris','Touchez l’étoile pour retrouver une carte dans les favoris.'],
 es:['Consejo','Publicidad','Abrir','Asocia la tienda','Añade la ubicación a tu tarjeta para encontrarla cuando estés cerca.','Guarda una copia','Conserva una copia de tus tarjetas desde Ajustes.','Prueba ScanDixit','Escanea un producto para buscar información antes de comprarlo.','Elige favoritos','Toca la estrella para encontrar la tarjeta en Favoritas.'],
 pt:['Dica','Publicidade','Abrir','Associe a loja','Adicione a localização ao cartão para o encontrar quando estiver perto.','Guarde uma cópia','Guarde uma cópia dos cartões nas Definições.','Experimente ScanDixit','Leia um produto para procurar informações antes de comprar.','Escolha favoritos','Toque na estrela para encontrar o cartão nos Favoritos.'],
 nl:['Tip','Advertentie','Openen','Koppel je winkel','Voeg een winkellocatie toe om je kaart dichtbij makkelijk te vinden.','Bewaar een back-up','Bewaar een kopie van je kaarten via Instellingen.','Probeer ScanDixit','Scan een product voor informatie voordat je het koopt.','Kies favorieten','Tik op de ster om kaarten in Favorieten terug te vinden.'],
 de:['Tipp','Werbung','Öffnen','Geschäft verknüpfen','Füge den Standort hinzu, um deine Karte in der Nähe leichter zu finden.','Backup speichern','Speichere eine Kopie deiner Karten in den Einstellungen.','ScanDixit testen','Scanne ein Produkt für Informationen vor dem Kauf.','Favoriten wählen','Tippe auf den Stern, um Karten unter Favoriten zu finden.']
};
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function day(now){const d=new Date(now);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function session(now=Date.now()){
 try{
  const previous=JSON.parse(root.sessionStorage.getItem(SESSION)||'null');
  const today=day(now),same=previous&&previous.day===today&&now-previous.last<IDLE&&now>=previous.last;
  let daily=JSON.parse(root.localStorage.getItem(DAILY)||'null');
  if(!daily||daily.day!==today)daily={day:today,count:0};
  if(!same){daily.count=Math.min(999,(Number(daily.count)||0)+1);choices={};root.localStorage.setItem(DAILY,JSON.stringify(daily));}
  count=same?Math.max(Number(previous.count)||3,Number(daily.count)||0):daily.count;
  root.sessionStorage.setItem(SESSION,JSON.stringify({day:today,count,last:now}));
 }catch{count=3;}
 last=now;
}
function copy(){let lang=root.FiCardI18n?.language?.();if(!lang){try{lang=root.localStorage.getItem('ficard.language.v2')||root.localStorage.getItem('ficard.language.v1');}catch{}if(!lang){lang=(root.navigator?.languages||[root.navigator?.language]).map(x=>String(x||'').toLowerCase().split('-')[0]).find(x=>COPY[x]);}}return COPY[String(lang||'en').toLowerCase().split('-')[0]]||COPY.en;}
function adAvailable(){return root.navigator?.onLine!==false&&count<=2;}
function slotAllowsAd(slot){model(slot);return adAvailable()&&choices[slot].ad;}
function model(slot){
 const c=copy();let chosen=choices[slot];
 if(!chosen){chosen=choices[slot]={tip:Math.floor(Math.random()*4),ad:slot==='banner'||Math.random()<.5};}
 const candidates=Array.isArray(root.FiCardAdContent)?root.FiCardAdContent:[];
 const ad=adAvailable()&&chosen.ad?candidates.find(a=>a&&typeof a.title==='string'&&typeof a.url==='string'&&/^https:\/\//i.test(a.url)):null;
 if(ad)return {label:c[1],title:ad.title,text:ad.text||'',url:ad.url,advert:true};
 const i=chosen.tip;return {label:c[0],title:c[3+i*2],text:c[4+i*2],view:['map','profile','scandixit','profile'][i],advert:false};
}
function html(slot,banner=false){
 const m=model(slot),action=m.advert?'href="'+esc(m.url)+'" target="_blank" rel="noopener noreferrer"':'href="#'+m.view+'" data-content-view="'+m.view+'"';
 return '<a data-ad-slot="'+esc(slot)+'" data-ad-format="'+(banner?'banner':'native')+'" class="'+(banner?'contentBanner':'card advertisingCard contentTile')+'" '+action+' style="--card-color:#E4F8F3;--card-ink:#4324BC"><div class="advertisingContent"><span class="advertisingLabel">'+esc(m.label)+'</span><strong>'+esc(m.title)+'</strong><small>'+esc(m.text)+'</small></div>'+(banner?'<span class="badge">'+esc(copy()[2])+'</span>':'')+'</a>';
}
function render(){const banner=root.document?.getElementById('homeContentBanner');if(banner)banner.innerHTML=html('banner',true);root.renderCards?.();}
root.FiCardContent={html,model,session,adAvailable,slotAllowsAd};session();
root.document?.addEventListener('click',e=>{const link=e.target?.closest?.('[data-content-view]');if(!link)return;e.preventDefault();if(!link.classList.contains('nativeAdLoaded'))root.go?.(link.dataset.contentView);});
root.document?.addEventListener('visibilitychange',()=>{if(root.document.hidden){try{root.sessionStorage.setItem(SESSION,JSON.stringify({day:day(Date.now()),count,last:Date.now()}));}catch{}}else{session();render();}});
root.document?.addEventListener('pointerdown',()=>{if(Date.now()-last>60000){try{root.sessionStorage.setItem(SESSION,JSON.stringify({day:day(Date.now()),count,last:Date.now()}));}catch{}last=Date.now();}},{passive:true});
root.addEventListener?.('offline',render);root.addEventListener?.('online',render);root.addEventListener?.('ficard:languagechange',render);
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})(typeof window==='undefined'?globalThis:window);
