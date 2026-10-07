/* Fi-Card internationalization layer.
 * Keeps the current app architecture intact while centralising interface strings.
 * New UI should use FiCardI18n.t('key') instead of hard-coded visible text.
 */
(function(root){
'use strict';

const STORAGE_KEY='ficard.language.v1';
const SUPPORTED=['it','en'];

const messages={
  it:{
    'language.title':'Lingua',
    'language.subtitle':'Lingua dell’interfaccia',
    'language.autoNote':'La scelta resta salvata su questo dispositivo.',
    'theme.enableLight':'Attiva tema chiaro',
    'theme.enableDark':'Attiva tema scuro',
    'header.position':'Posizione',
    'home.quickCards':'Carte rapide',
    'home.orderedUsage':'Ordinate per utilizzo',
    'home.scanProduct':'Scansiona un prodotto con ScanDixit',
    'home.scanHint':'Individua gli allergeni indicati prima di acquistare del cibo.',
    'home.try':'Prova',
    'home.search':'Cerca una carta…',
    'filter.all':'Tutte',
    'filter.used':'Più usate',
    'filter.favorites':'Preferite',
    'filter.category':'Per categoria',
    'home.myCards':'Le mie carte',
    'nav.cards':'Card',
    'nav.map':'Mappa',
    'nav.add':'Aggiungi carta',
    'nav.settings':'Impostazioni',
    'map.title':'Negozi delle mie tessere',
    'map.myPosition':'La mia posizione',
    'map.needShop':'Di che negozio hai bisogno?',
    'map.allCategories':'Tutte le categorie',
    'map.reset':'Reset',
    'map.brandQuestion':'Hai un marchio in mente?',
    'map.allBrands':'Tutti i marchi',
    'map.onlyFavorites':'Solo ❤️',
    'map.searchHere':'Cerca in questa zona',
    'map.usePosition':'Usa la tua posizione o cerca nella zona della mappa.',
    'map.store':'📍 Punto vendita',
    'map.yourPosition':'◎ La tua posizione',
    'map.clusterHint':'Tocca un gruppo per vedere i negozi',
    'map.favoriteTitle':'Naviga verso uno dei tuoi negozi preferiti',
    'map.otherStores':'Altri negozi delle tue tessere',
    'settings.title':'Impostazioni',
    'settings.noAccount':'Nessun account, nessuna registrazione',
    'settings.noAccountText':'Non servono dati personali per gestire le tue carte.',
    'settings.offline':'Le tue carte, anche offline',
    'settings.offlineText':'Carte e negozi salvati restano sul telefono, pronti da consultare anche senza rete o se i server non rispondono.',
    'settings.locationOptional':'La posizione è facoltativa',
    'settings.locationOptionalText':'Serve a trovare i negozi vicini. Per cercare nuovi negozi e prodotti occorre internet.',
    'settings.localArchive':'Archivio locale',
    'settings.checking':'Controllo stato…',
    'settings.backupTitle':'I tuoi dati, la tua copia di sicurezza',
    'settings.backupHint':'Crea ogni tanto un backup e conservalo in File, iCloud o in un posto sicuro, soprattutto prima di cambiare telefono o cancellare i dati dell’app.',
    'settings.exportBackup':'Esporta backup carte',
    'settings.importBackup':'Ripristina o unisci un backup',
    'settings.backupInfo':'Puoi salvare il backup anche in iCloud Drive tramite File.',
    'settings.importScreenshots':'Importa carte da screenshot',
    'settings.clearData':'Cancella tutti i dati locali',
    'add.title':'Aggiungi una carta',
    'add.scanCard':'Scansiona carta',
    'add.camera':'Usa la fotocamera',
    'add.importImage':'Importa immagine',
    'add.photoScreenshot':'Foto o screenshot',
    'add.captureHint':'Acquisisci prima il codice. Subito dopo potrai completare marchio e dati della carta.',
    'add.manual':'Inserisci i dati manualmente',
    'add.complete':'Completa i dati',
    'add.completeHint':'Controlla ciò che Fi-Card ha acquisito e salva la carta.',
    'add.searchBrand':'Cerca marchio',
    'add.brandPlaceholder':'Es. Conad, IKEA, farmacia…',
    'add.brand':'Marchio',
    'add.category':'Categoria',
    'add.requiredHint':'Nome e contenuto sono obbligatori. Il formato viene riconosciuto automaticamente e puoi cambiarlo.',
    'add.name':'Nome negozio / carta *',
    'add.namePlaceholder':'Es. Esselunga',
    'add.code':'Numero / contenuto barcode *',
    'add.codePlaceholder':'Es. 1234567890123',
    'add.format':'Formato codice',
    'add.automatic':'Automatico',
    'add.color':'Colore',
    'add.save':'Salva carta',
    'add.localOnly':'La carta resta sul tuo telefono: non viene inviata ai server.',
    'detail.myCard':'La mia carta',
    'navigation.choose':'Scegli il navigatore',
    'common.close':'Chiudi',
    'location.linkStore':'Associa punto vendita',
    'location.pickerHint':'Sposta la mappa OpenStreetMap e tocca il punto esatto del negozio. Puoi anche trascinare il segnaposto.',
    'location.showSaved':'Mostra i punti già salvati',
    'location.tapMap':'Tocca sulla mappa per scegliere la posizione.',
    'location.useMine':'⌖ Usa la mia posizione',
    'location.savePoint':'Salva questo punto',
    'import.analyzing':'Analisi in corso…',
    'import.analyzingHint':'Fi-Card sta cercando il codice e riconoscendo il marchio. Può richiedere qualche secondo.',
    'import.images':'Importa immagini',
    'import.saveSelected':'Salva carte selezionate',
    'backup.restore':'Ripristina backup',
    'backup.merge':'Unisci alle mie carte',
    'backup.replace':'Sostituisci le mie carte',
    'backup.mergeHint':'Unisci conserva le carte esistenti. Sostituisci salva prima una copia di sicurezza scaricabile.',
    'store.addressUnavailable':'Indirizzo non disponibile',
    'store.manual':'Aggiunto a mano',
    'store.osm':'Da OpenStreetMap',
    'store.openCard':'Apri carta',
    'store.navigate':'Naviga',
    'store.removeFavorite':'Rimuovi negozio dai preferiti',
    'store.saveFavorite':'Salva negozio tra i preferiti',
    'store.unlink':'Dissocia punto vendita',
    'store.findAddress':'Trova indirizzo',
    'store.findingAddress':'Cerco indirizzo…',
    'store.favoriteStores':'Negozi preferiti',
    'store.otherNearby':'Altri negozi vicini',
    'store.findNearby':'Trova negozi vicini',
    'store.searching':'Ricerca in corso…',
    'store.cancelSearch':'Annulla ricerca',
    'store.searchCancelled':'Ricerca annullata.',
    'store.addCardFirst':'Aggiungi prima una tessera.',
    'store.cache':'Negozi dalla cache locale.',
    'category.supermarkets':'Supermercati',
    'category.sport':'Articoli sportivi',
    'category.clothing':'Abbigliamento e calzature',
    'category.pet':'Pet store',
    'category.housewares':'Casalinghi',
    'category.home':'Casa e bricolage',
    'category.beauty':'Beauty e cura persona',
    'category.pharmacy':'Farmacie e parafarmacie',
    'category.electronics':'Elettronica',
    'category.food':'Ristorazione',
    'category.fuel':'Carburanti',
    'category.other':'Altro',
    'aria.mapStores':'Mappa dei negozi delle tue tessere',
    'aria.resetFilters':'Azzera tutti i filtri dei negozi',
    'aria.onlyFavorites':'Solo negozi preferiti',
    'aria.favoriteStores':'Negozi preferiti',
    'aria.addCard':'Aggiungi una carta',
    'aria.settings':'Impostazioni',
    'aria.close':'Chiudi',
    'aria.refresh':'Aggiorna Fi-Card',
    'aria.install':'Installa',
    'aria.grid':'Mostra griglia 10 px'
  },
  en:{
    'language.title':'Language',
    'language.subtitle':'Interface language',
    'language.autoNote':'Your choice is saved on this device.',
    'theme.enableLight':'Enable light theme',
    'theme.enableDark':'Enable dark theme',
    'header.position':'Location',
    'home.quickCards':'Quick cards',
    'home.orderedUsage':'Sorted by usage',
    'home.scanProduct':'Scan a product with ScanDixit',
    'home.scanHint':'Check listed allergens before buying food.',
    'home.try':'Try',
    'home.search':'Search for a card…',
    'filter.all':'All',
    'filter.used':'Most used',
    'filter.favorites':'Favorites',
    'filter.category':'By category',
    'home.myCards':'My cards',
    'nav.cards':'Cards',
    'nav.map':'Map',
    'nav.add':'Add card',
    'nav.settings':'Settings',
    'map.title':'Stores for my cards',
    'map.myPosition':'My location',
    'map.needShop':'What kind of store do you need?',
    'map.allCategories':'All categories',
    'map.reset':'Reset',
    'map.brandQuestion':'Looking for a specific brand?',
    'map.allBrands':'All brands',
    'map.onlyFavorites':'Only ❤️',
    'map.searchHere':'Search this area',
    'map.usePosition':'Use your location or search the area shown on the map.',
    'map.store':'📍 Store',
    'map.yourPosition':'◎ Your location',
    'map.clusterHint':'Tap a group to view stores',
    'map.favoriteTitle':'Navigate to one of your favorite stores',
    'map.otherStores':'Other stores for your cards',
    'settings.title':'Settings',
    'settings.noAccount':'No account, no registration',
    'settings.noAccountText':'You do not need to provide personal details to manage your cards.',
    'settings.offline':'Your cards, even offline',
    'settings.offlineText':'Saved cards and stores stay on your phone and remain available without a connection or if servers are unavailable.',
    'settings.locationOptional':'Location is optional',
    'settings.locationOptionalText':'It is used to find nearby stores. An internet connection is required to search for new stores and products.',
    'settings.localArchive':'Local storage',
    'settings.checking':'Checking status…',
    'settings.backupTitle':'Your data, your backup',
    'settings.backupHint':'Create a backup occasionally and keep it in Files, iCloud or another safe place, especially before changing phones or deleting app data.',
    'settings.exportBackup':'Export card backup',
    'settings.importBackup':'Restore or merge a backup',
    'settings.backupInfo':'You can also save the backup to iCloud Drive through Files.',
    'settings.importScreenshots':'Import cards from screenshots',
    'settings.clearData':'Delete all local data',
    'add.title':'Add a card',
    'add.scanCard':'Scan card',
    'add.camera':'Use the camera',
    'add.importImage':'Import image',
    'add.photoScreenshot':'Photo or screenshot',
    'add.captureHint':'Capture the code first. Then you can complete the brand and card details.',
    'add.manual':'Enter details manually',
    'add.complete':'Complete the details',
    'add.completeHint':'Check what Fi-Card captured and save the card.',
    'add.searchBrand':'Search brand',
    'add.brandPlaceholder':'E.g. Conad, IKEA, pharmacy…',
    'add.brand':'Brand',
    'add.category':'Category',
    'add.requiredHint':'Name and code content are required. The format is detected automatically and can be changed.',
    'add.name':'Store / card name *',
    'add.namePlaceholder':'E.g. Esselunga',
    'add.code':'Barcode number / content *',
    'add.codePlaceholder':'E.g. 1234567890123',
    'add.format':'Code format',
    'add.automatic':'Automatic',
    'add.color':'Color',
    'add.save':'Save card',
    'add.localOnly':'The card stays on your phone and is not sent to our servers.',
    'detail.myCard':'My card',
    'navigation.choose':'Choose navigation app',
    'common.close':'Close',
    'location.linkStore':'Link store location',
    'location.pickerHint':'Move the OpenStreetMap map and tap the exact store location. You can also drag the marker.',
    'location.showSaved':'Show saved locations',
    'location.tapMap':'Tap the map to choose a location.',
    'location.useMine':'⌖ Use my location',
    'location.savePoint':'Save this location',
    'import.analyzing':'Analyzing…',
    'import.analyzingHint':'Fi-Card is looking for the code and identifying the brand. This may take a few seconds.',
    'import.images':'Import images',
    'import.saveSelected':'Save selected cards',
    'backup.restore':'Restore backup',
    'backup.merge':'Merge with my cards',
    'backup.replace':'Replace my cards',
    'backup.mergeHint':'Merge keeps your existing cards. Replace first saves a downloadable safety copy.',
    'store.addressUnavailable':'Address unavailable',
    'store.manual':'Added manually',
    'store.osm':'From OpenStreetMap',
    'store.openCard':'Open card',
    'store.navigate':'Navigate',
    'store.removeFavorite':'Remove store from favorites',
    'store.saveFavorite':'Save store to favorites',
    'store.unlink':'Unlink store location',
    'store.findAddress':'Find address',
    'store.findingAddress':'Finding address…',
    'store.favoriteStores':'Favorite stores',
    'store.otherNearby':'Other nearby stores',
    'store.findNearby':'Find nearby stores',
    'store.searching':'Searching…',
    'store.cancelSearch':'Cancel search',
    'store.searchCancelled':'Search cancelled.',
    'store.addCardFirst':'Add a card first.',
    'store.cache':'Stores loaded from local cache.',
    'category.supermarkets':'Supermarkets',
    'category.sport':'Sporting goods',
    'category.clothing':'Clothing and footwear',
    'category.pet':'Pet stores',
    'category.housewares':'Housewares',
    'category.home':'Home improvement',
    'category.beauty':'Beauty and personal care',
    'category.pharmacy':'Pharmacies and para-pharmacies',
    'category.electronics':'Electronics',
    'category.food':'Food and dining',
    'category.fuel':'Fuel',
    'category.other':'Other',
    'aria.mapStores':'Map of stores for your cards',
    'aria.resetFilters':'Clear all store filters',
    'aria.onlyFavorites':'Favorite stores only',
    'aria.favoriteStores':'Favorite stores',
    'aria.addCard':'Add a card',
    'aria.settings':'Settings',
    'aria.close':'Close',
    'aria.refresh':'Refresh Fi-Card',
    'aria.install':'Install',
    'aria.grid':'Show 10 px grid'
  }
};

const itToKey=new Map(Object.entries(messages.it).map(([key,value])=>[value,key]));
const textOriginal=new WeakMap();
const attrOriginal=new WeakMap();
let current=detectInitialLanguage();
let observer=null;
let applying=false;

function normalise(code){
  const value=String(code||'').toLowerCase().split('-')[0];
  return SUPPORTED.includes(value)?value:'it';
}
function detectInitialLanguage(){
  try{
    const saved=root.localStorage.getItem(STORAGE_KEY);
    if(saved)return normalise(saved);
  }catch{}
  const langs=(root.navigator?.languages&&root.navigator.languages.length?root.navigator.languages:[root.navigator?.language]).filter(Boolean);
  for(const lang of langs){const value=normalise(lang);if(value==='en'||String(lang).toLowerCase().startsWith('it'))return value;}
  return 'it';
}
function t(key,vars){
  let value=messages[current]?.[key]??messages.it[key]??key;
  if(vars&&typeof value==='string')for(const [name,replacement] of Object.entries(vars))value=value.replaceAll('{'+name+'}',String(replacement));
  return value;
}
function translateKnownItalian(value){
  if(current==='it')return value;
  const exact=itToKey.get(value);
  if(exact)return messages.en[exact]||value;
  return translateDynamic(value);
}
function translateDynamic(value){
  if(current!=='en'||typeof value!=='string')return value;
  let m;
  if((m=value.match(/^Posizione · (.+)$/)))return 'Location · '+translateRelativeTime(m[1]);
  if((m=value.match(/^(\d+) negozi · (\d+) preferiti · distanze in linea d’aria\. Dati © OpenStreetMap contributors\.$/)))return `${m[1]} stores · ${m[2]} favorites · straight-line distances. Data © OpenStreetMap contributors.`;
  if((m=value.match(/^Negozi aggiornati( e salvati sul dispositivo\.|\. Cache piena: risultati disponibili in questa sessione\.)$/)))return m[1].startsWith(' e')?'Stores updated and saved on this device.':'Stores updated. Cache full: results are available for this session.';
  if(value.startsWith('Mostro i negozi già disponibili. '))return 'Showing stores already available. '+translateKnownItalian(value.slice('Mostro i negozi già disponibili. '.length));
  if(value==='Nessun negozio preferito con questi filtri. Tocca il cuore su un negozio per aggiungerlo.')return 'No favorite stores match these filters. Tap the heart on a store to add it.';
  if(value==='Nessun altro negozio con questi filtri. Cerca nella zona o aggiungi un punto dalla tessera.')return 'No other stores match these filters. Search the area or add a location from the card.';
  if(value==='Nessun altro negozio trovato in questa zona.')return 'No other stores found in this area.';
  if(value==='Tocca il cuore su un negozio per salvarlo.')return 'Tap the heart on a store to save it.';
  if(value==='Cerco i negozi…')return 'Searching for stores…';
  if(value==='Indirizzo non disponibile. Riprova con una connessione attiva.')return 'Address unavailable. Try again with an active internet connection.';
  if(value==='Ricerca non disponibile.')return 'Search unavailable.';
  if((m=value.match(/^([0-9]+(?:[.,][0-9]+)?) km$/)))return m[1]+' km';
  if((m=value.match(/^([0-9]+) m$/)))return m[1]+' m';
  return value;
}
function translateRelativeTime(value){
  if(current!=='en')return value;
  return String(value)
    .replace(/^ora$/,'now')
    .replace(/^(\d+) min fa$/,'$1 min ago')
    .replace(/^(\d+) h fa$/,'$1 h ago');
}
function shouldSkipText(node){
  const el=node.parentElement;
  if(!el)return true;
  if(el.closest('script,style,noscript,svg,canvas'))return true;
  if(el.closest('.name,.brandMark,.detailLogo,.wName,.num,.previewCode,.coords,.locationBrandIcon'))return true;
  return false;
}
function translatedForOriginal(original){return current==='it'?original:translateKnownItalian(original);}
function applyTextNode(node){
  if(!node||node.nodeType!==3||shouldSkipText(node))return;
  const raw=node.nodeValue||'';
  if(!raw.trim())return;
  const leading=raw.match(/^\s*/)?.[0]||'';
  const trailing=raw.match(/\s*$/)?.[0]||'';
  const core=raw.slice(leading.length,raw.length-trailing.length);
  let original=textOriginal.get(node);
  if(original===undefined){original=core;textOriginal.set(node,original)}
  else{
    const expected=translatedForOriginal(original);
    if(core!==expected){original=core;textOriginal.set(node,original)}
  }
  const next=translatedForOriginal(original);
  if(next!==core)node.nodeValue=leading+next+trailing;
}
function attrState(el){let state=attrOriginal.get(el);if(!state){state={};attrOriginal.set(el,state)}return state;}
function applyAttribute(el,attr){
  if(!el?.hasAttribute?.(attr))return;
  const currentValue=el.getAttribute(attr)||'';
  const state=attrState(el);
  let original=state[attr];
  if(original===undefined){original=currentValue;state[attr]=original}
  else{
    const expected=translatedForOriginal(original);
    if(currentValue!==expected){original=currentValue;state[attr]=original}
  }
  const next=translatedForOriginal(original);
  if(next!==currentValue)el.setAttribute(attr,next);
}
function applyElement(el){
  if(!el||el.nodeType!==1)return;
  for(const attr of ['placeholder','title','aria-label'])applyAttribute(el,attr);
  for(const child of el.childNodes)if(child.nodeType===3)applyTextNode(child);
  for(const child of el.children)applyElement(child);
}
function renderLanguageControl(){
  const panel=root.document?.querySelector('#profileView .panel');
  if(!panel)return;
  let box=root.document.getElementById('ficardLanguageSetting');
  if(!box){
    box=root.document.createElement('div');
    box.id='ficardLanguageSetting';
    box.className='ficardLanguageSetting';
    box.innerHTML='<div class="ficardLanguageCopy"><b id="ficardLanguageTitle"></b><small id="ficardLanguageSubtitle"></small></div><select id="ficardLanguageSelect" class="field" aria-label="Lingua"><option value="it">Italiano</option><option value="en">English</option></select>';
    const anchor=panel.querySelector('.settingsFacts');
    if(anchor)panel.insertBefore(box,anchor);else panel.prepend(box);
    box.querySelector('select').addEventListener('change',e=>setLanguage(e.target.value,true));
  }
  const select=box.querySelector('select');if(select)select.value=current;
  const title=box.querySelector('#ficardLanguageTitle');if(title)title.textContent=t('language.title');
  const subtitle=box.querySelector('#ficardLanguageSubtitle');if(subtitle)subtitle.textContent=t('language.subtitle')+' · '+t('language.autoNote');
  if(select)select.setAttribute('aria-label',t('language.title'));
}
function installStyles(){
  if(root.document?.getElementById('ficardI18nStyle'))return;
  const style=root.document.createElement('style');style.id='ficardI18nStyle';
  style.textContent='.ficardLanguageSetting{display:grid;grid-template-columns:minmax(0,1fr) minmax(120px,170px);gap:12px;align-items:center;padding:14px 0 16px;margin:0 0 14px;border-bottom:1px solid var(--line)}.ficardLanguageCopy b{display:block;font-size:14px;color:var(--text)}.ficardLanguageCopy small{display:block;margin-top:3px;color:var(--muted);font-size:12px;line-height:1.35}.ficardLanguageSetting .field{margin:0;min-height:44px}@media(max-width:380px){.ficardLanguageSetting{grid-template-columns:1fr}.ficardLanguageSetting .field{max-width:none;width:100%}}';
  root.document.head?.appendChild(style);
}
function translateDocument(){
  if(!root.document?.documentElement)return;
  disconnectObserver();applying=true;
  try{
    root.document.documentElement.lang=current;
    applyElement(root.document.body);
    renderLanguageControl();
    updateThemeLabels();
  }finally{applying=false;connectObserver();}
}
function updateThemeLabels(){
  const btn=root.document?.getElementById('themeBtn');if(!btn)return;
  const dark=root.document.documentElement.dataset.theme==='dark';
  const label=dark?t('theme.enableLight'):t('theme.enableDark');
  btn.title=label;btn.setAttribute('aria-label',label);
}
function setLanguage(code,persist=true){
  const next=normalise(code);if(next===current){renderLanguageControl();return current;}
  current=next;
  if(persist)try{root.localStorage.setItem(STORAGE_KEY,current)}catch{}
  translateDocument();
  try{root.dispatchEvent(new CustomEvent('ficard:languagechange',{detail:{language:current}}))}catch{}
  setTimeout(translateDocument,0);
  return current;
}
function connectObserver(){
  if(observer||!root.document?.body)return;
  observer=new MutationObserver(mutations=>{
    if(applying)return;
    disconnectObserver();applying=true;
    try{
      for(const mutation of mutations){
        if(mutation.type==='attributes'){applyAttribute(mutation.target,mutation.attributeName);continue;}
        if(mutation.type==='characterData'){applyTextNode(mutation.target);continue;}
        if(mutation.type==='childList'){
          for(const node of mutation.addedNodes){
            if(node.nodeType===3)applyTextNode(node);
            else if(node.nodeType===1)applyElement(node);
          }
        }
      }
      renderLanguageControl();
    }finally{applying=false;connectObserver();}
  });
  observer.observe(root.document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});
}
function disconnectObserver(){if(observer){observer.disconnect();observer=null;}}
function patchDialogs(){
  if(root.__ficardI18nDialogsPatched)return;root.__ficardI18nDialogsPatched=true;
  const nativeAlert=root.alert?.bind(root),nativeConfirm=root.confirm?.bind(root),nativePrompt=root.prompt?.bind(root);
  if(nativeAlert)root.alert=message=>nativeAlert(translateKnownItalian(String(message)));
  if(nativeConfirm)root.confirm=message=>nativeConfirm(translateKnownItalian(String(message)));
  if(nativePrompt)root.prompt=(message,value)=>nativePrompt(translateKnownItalian(String(message)),value);
}
function init(){installStyles();patchDialogs();translateDocument();}

root.FiCardI18n={
  supported:[...SUPPORTED],
  messages,
  t,
  language:()=>current,
  setLanguage,
  refresh:translateDocument,
  translateText:value=>translateKnownItalian(String(value??''))
};

if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();
root.addEventListener?.('storage',event=>{if(event.key===STORAGE_KEY&&event.newValue)setLanguage(event.newValue,false)});
})(typeof window==='undefined'?globalThis:window);
