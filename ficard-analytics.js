/* Fi-Card minimal, optional analytics. No card content or location is accepted. */
(function(root){
'use strict';
const VERSION='0.9.158',CONSENT='ficard.analytics.consent.v1',ID='ficard.analytics.install.v1';
const PAGES=new Set(['home','map','scandixit','profile']);
let controllers=new Set(),recent=new Map(),lastOpen=0,hiddenAt=0;
function enabled(){try{return root.localStorage.getItem(CONSENT)==='yes'}catch{return false}}
function installation(){try{let id=root.localStorage.getItem(ID);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id||'')){id=root.crypto.randomUUID();root.localStorage.setItem(ID,id)}return id}catch{return ''}}
function currentPage(){return root.document?.querySelector('.view.active')?.id?.replace(/View$/,'')||'home'}
function track(event,page=currentPage(),brandKey=''){
 try{
  if(!enabled()||root.navigator?.onLine===false||root.parent!==root)return Promise.resolve(false);
  if(!['app_open','page_view','card_added'].includes(event)||!PAGES.has(page))return Promise.resolve(false);
  const brands=typeof BRANDS==='object'?BRANDS:{};
  const brand=event==='card_added'&&Object.hasOwn(brands,brandKey)?brandKey:null;
  const config=root.FICARD_ANALYTICS_CONFIG,id=installation();
  if(!id||!config?.key||!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(config.url))return Promise.resolve(false);
  const key=event+':'+page,now=Date.now();
  if(event!=='card_added'&&now-(recent.get(key)||0)<2000)return Promise.resolve(false);
  if(controllers.size>=40)return Promise.resolve(false);
  recent.set(key,now);
  const controller=new AbortController();controllers.add(controller);
  const timer=root.setTimeout(()=>controller.abort(),5000);
  const payload={event_id:root.crypto.randomUUID(),installation_id:id,event,page,brand,app_version:VERSION};
  return root.fetch(config.url+'/rest/v1/ficard_usage_events',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload),credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal}).then(r=>r.ok).catch(()=>false).finally(()=>{root.clearTimeout(timer);controllers.delete(controller)});
 }catch{return Promise.resolve(false)}
}
function opened(){if(Date.now()-lastOpen<180000)return;lastOpen=Date.now();track('app_open');track('page_view')}
function setConsent(value){
 controllers.forEach(c=>c.abort());controllers.clear();recent.clear();
 try{root.localStorage.setItem(CONSENT,value?'yes':'no');if(!value)root.localStorage.removeItem(ID)}catch{}
 if(value){lastOpen=0;opened()}
 const check=root.document?.getElementById('analyticsConsent');if(check)check.checked=enabled();
}
const COPY={
 it:['Privacy e contatti','Condividi statistiche di utilizzo','Statistiche facoltative tramite Supabase: identificativo casuale dell’installazione, aperture, sezioni visitate, data e marchio delle nuove carte. Non inviamo barcode, numeri tessera, nomi personalizzati, foto o coordinate. Disattivando interrompi l’invio e rimuovi l’identificativo locale.','Informativa privacy','Contatta il supporto'],
 en:['Privacy and contact','Share usage statistics','Optional statistics through Supabase: random installation ID, app opens, sections visited, date and brand of newly added cards. We never send barcodes, card numbers, custom names, photos or coordinates. Turning this off stops sending data and removes the local ID.','Privacy policy','Contact support'],
 fr:['Confidentialité et contact','Partager les statistiques d’utilisation','Statistiques facultatives via Supabase : identifiant aléatoire, ouvertures, rubriques visitées, date et marque des nouvelles cartes. Aucun code-barres, numéro, nom personnalisé, photo ou coordonnée. Désactiver arrête les envois et supprime l’identifiant local.','Politique de confidentialité','Contacter le support'],
 es:['Privacidad y contacto','Compartir estadísticas de uso','Estadísticas opcionales mediante Supabase: ID aleatorio, aperturas, secciones visitadas, fecha y marca de las tarjetas nuevas. Sin códigos de barras, números, nombres personalizados, fotos ni coordenadas. Desactivar detiene los envíos y elimina el ID local.','Política de privacidad','Contactar con soporte'],
 pt:['Privacidade e contacto','Partilhar estatísticas de utilização','Estatísticas opcionais via Supabase: ID aleatório, aberturas, secções visitadas, data e marca de cartões novos. Sem códigos de barras, números, nomes personalizados, fotos ou coordenadas. Desativar interrompe o envio e remove o ID local.','Política de privacidade','Contactar o suporte'],
 nl:['Privacy en contact','Gebruiksstatistieken delen','Optionele statistieken via Supabase: willekeurige installatie-ID, appstarts, bezochte onderdelen, datum en merk van nieuwe kaarten. Geen barcodes, kaartnummers, eigen namen, foto’s of coördinaten. Uitschakelen stopt verzending en verwijdert de lokale ID.','Privacybeleid','Contact met ondersteuning'],
 de:['Datenschutz und Kontakt','Nutzungsstatistiken teilen','Optionale Statistiken über Supabase: zufällige Installations-ID, Appstarts, besuchte Bereiche, Datum und Marke neuer Karten. Keine Barcodes, Kartennummern, eigenen Namen, Fotos oder Koordinaten. Deaktivieren stoppt die Übertragung und entfernt die lokale ID.','Datenschutzerklärung','Support kontaktieren']
};
function render(){
 const box=root.document?.getElementById('launchSettings');if(!box)return;
 let language=root.FiCardI18n?.language?.();if(!language){try{language=root.localStorage.getItem('ficard.language.v2')||root.navigator?.language}catch{}}
 const text=COPY[String(language||'en').split('-')[0]]||COPY.en;box.setAttribute('aria-label',text[0]);
 box.innerHTML='<h3 style="font-size:16px">'+text[0]+'</h3><label style="display:flex;gap:10px;align-items:center;font-size:14px;color:var(--text)"><input id="analyticsConsent" type="checkbox" style="width:20px;height:20px;flex:none">'+text[1]+'</label><p class="hint">'+text[2]+'</p><div class="reviewActions"><a class="reviewAction reviewMail" href="./privacy.html" target="_blank" rel="noopener">'+text[3]+'</a><a class="reviewAction reviewMail" href="mailto:info@fi-card.app?subject=Supporto%20Fi-Card">'+text[4]+'</a></div>';
 const check=root.document.getElementById('analyticsConsent');check.checked=enabled();check.addEventListener('change',()=>setConsent(check.checked));
}
function init(){render();if(enabled())opened();root.document?.addEventListener('visibilitychange',()=>{if(root.document.hidden)hiddenAt=Date.now();else if(hiddenAt&&Date.now()-hiddenAt>=180000){hiddenAt=0;opened()}});root.addEventListener?.('storage',e=>{if(e.key===CONSENT){if(!enabled()){controllers.forEach(c=>c.abort());controllers.clear();recent.clear()}render()}})}
root.FiCardAnalytics={track,setConsent,enabled};
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof window==='undefined'?globalThis:window);
