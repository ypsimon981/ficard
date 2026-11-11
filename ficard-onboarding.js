/* First-launch choices. All preferences stay on this device. */
(function(root){
'use strict';
const COMPLETE='ficard.onboarding.complete.v1',GPS='ficard.gps.enabled.v1';
const read=key=>{try{return root.localStorage.getItem(key)}catch{return null}};
const write=(key,value)=>{try{root.localStorage.setItem(key,value)}catch{}};
const embedded=root.parent!==root;
let waiting=!embedded&&read(COMPLETE)!=='yes',gps=read(GPS)==='yes'||(!waiting&&read(GPS)!=='no'),resolveReady;
let gpsIntroSeen=read('ficard.gps.intro.v1')==='yes';
function setGps(enabled){
 gps=enabled;write(GPS,gps?'yes':'no');
 const checkbox=root.document.getElementById('gpsEnabled');if(checkbox)checkbox.checked=gps;
 root.dispatchEvent(new CustomEvent('ficard:gpschange',{detail:{enabled:gps}}));
}
function claimGpsIntro(){
 if(gps||gpsIntroSeen)return false;
 gpsIntroSeen=true;write('ficard.gps.intro.v1','yes');return true;
}
const ready=new Promise(resolve=>{resolveReady=resolve;if(!waiting)resolve()});
const language=()=>{const lang=root.FiCardI18n?.language?.()||read('ficard.language.v2')||root.navigator.language?.split('-')[0]||'en';return root.FiCardLocales?.[lang]?lang:'en'};
const copy=lang=>root.FiCardLocales?.[lang]?.onboarding||root.FiCardLocales.en.onboarding;
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function settings(){
 const host=root.document.getElementById('marketSettingsBox');if(!host)return;
 let row=root.document.getElementById('gpsPreference');
 if(!row){row=root.document.createElement('div');row.id='gpsPreference';row.className='localeSetting';host.appendChild(row)}
 const c=copy(language());
 row.setAttribute('data-i18n-skip','');
 row.innerHTML='<label class="onboardingCheck"><input id="gpsEnabled" type="checkbox"><span>'+esc(c.gps)+'</span></label><p class="hint">'+esc(c.gpsHelp)+'</p>';
 const check=row.querySelector('input');check.checked=gps;
 check.onchange=()=>setGps(check.checked);
 const residence=root.document.getElementById('marketResidence');
 if(residence){let help=root.document.getElementById('residenceHelp');if(!help){help=root.document.createElement('p');help.id='residenceHelp';help.className='hint';help.setAttribute('data-i18n-skip','');residence.after(help)}help.textContent=c.residenceHelp}
}
const welcomeFeatures=[
 ['privacy','Senza account','Per usare Fi-Card non devi iscriverti né fornire dati personali.','No account needed','Use Fi-Card without signing up or providing personal information.','M12 22s7-3 7-11V6l-7-3-7 3v5c0 8 7 11 7 11Z M9 12l2 2 4-4'],
 ['cards','Le tue carte, sempre con te','Aggiungi le tue carte fedeltà e apri il codice quando ti serve.','Your cards, always with you','Add your loyalty cards and open their codes whenever you need them.','M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z M3 10h18 M7 14h4'],
 ['offline','Funziona anche offline','Le carte salvate restano consultabili anche senza connessione.','Works offline','Your saved cards are available even without a connection.','M3 3l18 18 M3 9a14 14 0 0 1 18 0 M6 13a10 10 0 0 1 12 0 M9 17a5 5 0 0 1 6 0 M12 21h.01'],
 ['backup','Cambi telefono? Porta le tue carte','Crea un backup e importalo sul nuovo dispositivo per ritrovare le tue carte in un attimo.','Switching phones? Bring your cards','Create a backup and import it on your new device to restore your cards.','M7 18H5a3 3 0 0 1 0-6 6 6 0 0 1 11-3 4.5 4.5 0 0 1 3 9h-2 M12 12v9 M9 18l3 3 3-3'],
 ['share','Condividi le carte che scegli','Seleziona le tessere e inviale a chi vuoi. Chi le riceve può importare solo quelle che gli mancano.','Share the cards you choose','Pick the cards you want to send. The recipient can import just the missing ones.','M8 12l8-5 M8 12l8 5 M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z M20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z M20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z'],
 ['gps','La carta pronta alla cassa','Più carte aggiungi, più Fi-Card ti aiuta. Se attivi la posizione, mette in evidenza la tessera del negozio in cui ti trovi.','Your card, ready at checkout','The more cards you add, the more Fi-Card can help. Enable location to see the card for the store you are visiting.','M12 22s7-7 7-13a7 7 0 1 0-14 0c0 6 7 13 7 13Z M15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'],
 ['lottery','La fortuna va aiutata','Aggiungi il codice della Lotteria degli scontrini e Fi-Card ti ricorderà di usarlo.','Remember your receipt lottery code','Add your Italian receipt lottery code and Fi-Card will remind you to use it.','M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4Z M12 8v2 M12 12v1 M12 15v1'],
 ['health','Tessera sanitaria pronta in farmacia','Inserisci il codice fiscale per aggiungerla. Con la posizione attiva, Fi-Card può metterla in evidenza vicino a una farmacia.','Health card ready at the pharmacy','Add your Italian health card using your tax code. With location enabled, Fi-Card can highlight it near a pharmacy.','M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z M8 9v6 M5 12h6 M14 10h4 M14 14h4']
];
function show(){
 settings();if(!waiting){if(!embedded)runWelcomeAction(true);return}
 clearTimeout(root.ficardStartupTimer);
 const markets=root.FiCardMarkets.read();
 const italian=()=>state.language==='it';
 const aggregate=read('ficard.analytics.aggregate.v1');
 const state={language:language(),override:markets.override,residence:markets.residence,analytics:root.FiCardAnalytics?.enabled()??(aggregate!==null?aggregate!=='no':read('ficard.analytics.consent.v1')!=='no')};
 const screen=root.document.createElement('section');screen.id='firstLaunch';screen.className='firstLaunch';screen.setAttribute('data-i18n-skip','');
 screen.setAttribute('aria-labelledby','firstLaunchTitle');screen.setAttribute('role','dialog');screen.setAttribute('aria-modal','true');
 root.document.body.classList.add('isOnboarding');root.document.body.appendChild(screen);
 function render(preferencesOpen=false){
  const c=copy(state.language),langs=root.FiCardI18n?.languageNames||{it:'Italiano',en:'English',fr:'Français',es:'Español',pt:'Português',nl:'Nederlands',de:'Deutsch'};
  const countries=[['IT',c.italy],['FR',c.france],['XX',c.other]];
  const options=(items,selected)=>items.map(([value,label])=>'<option value="'+value+'"'+(value===selected?' selected':'')+'>'+esc(label)+'</option>').join('');
  const field=(id,title,help,items,selected)=>'<div class="firstLaunchField"><label for="'+id+'">'+esc(title)+'</label><select id="'+id+'" class="field">'+options(items,selected)+'</select><p class="hint">'+esc(help)+'</p></div>';
  const check=(id,title,help,checked)=>'<div class="firstLaunchField"><label class="onboardingCheck"><input id="'+id+'" type="checkbox"'+(checked?' checked':'')+'><span>'+esc(title)+'</span></label><p class="hint">'+esc(help)+'</p></div>';
  const artwork='<div class="welcomeArt" aria-hidden="true"><div class="welcomeOrbit"></div>'+
   '<div class="welcomeCard welcomeCardBack"><img src="./logos-hq/ikea.svg" alt=""></div>'+
   '<div class="welcomeCard welcomeCardMiddle"><img src="./logos-hq/lidl.svg" alt=""></div>'+
   '<div class="welcomeCard welcomeCardFront"><img src="./logos-hq/conad.svg" alt=""></div></div>';
  const slides=[
   [italian()?'Benvenuti in Fi-Card':c.title,italian()?'Il tuo nuovo wallet di carte fedeltà e non solo.':c.intro,artwork],
   ...welcomeFeatures.map(([key,itTitle,itText,enTitle,enText,path])=>[
    italian()?itTitle:enTitle,italian()?itText:enText,
    '<div class="welcomeArt welcomeFeature welcomeFeature-'+key+'" aria-hidden="true"><div class="welcomeOrbit"></div><div class="welcomeSymbol"><svg viewBox="0 0 24 24"><path d="'+path+'"/></svg></div></div>'
   ])
  ];
  const panels=slides.map(([heading,intro,visual],index)=>
   '<section class="welcomeSlide">'+visual+'<h2'+(index===0?' id="firstLaunchTitle"':'')+'>'+esc(heading)+'</h2><p class="hint welcomeIntro">'+esc(intro)+'</p></section>'
  ).join('');
  const dots=slides.map(([heading],index)=>
   '<button type="button" aria-label="'+esc(heading)+'"'+(index===0?' aria-current="true"':'')+'></button>'
  ).join('');
  screen.innerHTML='<form class="firstLaunchSheet"><div class="firstLaunchBrand" aria-label="Fi-Card">Fi<span>-Card</span></div>'+
   '<div class="welcomeTrack" tabindex="0" aria-label="'+(italian()?'Scorri per scoprire Fi-Card':'Swipe to discover Fi-Card')+'">'+panels+'</div>'+
   '<div class="welcomeDots">'+dots+'</div>'+
   '<div class="welcomeActions"><button type="submit" value="add" class="primary">'+(italian()?'Aggiungi una carta':'Add a card')+'<span aria-hidden="true">→</span></button>'+
   '<button type="submit" value="import" class="secondary">'+(italian()?'Hai ricevuto delle carte? Importale':'Received cards? Import them')+'</button></div>'+
   '<details class="welcomePreferences"'+(preferencesOpen?' open':'')+'><summary>'+(italian()?'Lingua e preferenze':'Language and preferences')+'</summary>'+
   field('welcomeLanguage',c.language,c.languageHelp,Object.entries(langs),state.language)+
   field('welcomeMarket',c.market,c.marketHelp,[['auto',c.auto],...countries],state.override)+
   field('welcomeResidence',c.residence,c.residenceHelp,countries,state.residence)+
   '<div class="firstLaunchField"><strong>'+esc(c.gps)+'</strong><p class="hint">'+esc(c.gpsHelp)+'</p></div>'+
   check('welcomeAnalytics',c.analytics,c.analyticsHelp,state.analytics)+
   '<a href="./privacy.html" target="_blank" rel="noopener">'+esc(c.privacy)+'</a></details></form>';
  const track=screen.querySelector('.welcomeTrack');
  const dotsRow=screen.querySelector('.welcomeDots');
  if(track&&dotsRow){
   const buttons=[...dotsRow.querySelectorAll('button')];
   const current=()=>Math.max(0,Math.min(buttons.length-1,Math.round(track.scrollLeft/track.clientWidth)||0));
   const move=index=>track.scrollTo({
    left:Math.max(0,Math.min(buttons.length-1,index))*track.clientWidth,
    behavior:root.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'
   });
   buttons.forEach((button,index)=>button.onclick=()=>move(index));
   track.addEventListener('scroll',()=>{
    buttons.forEach((button,index)=>{
     if(index===current())button.setAttribute('aria-current','true');
     else button.removeAttribute('aria-current');
    });
   },{passive:true});
   track.addEventListener('keydown',e=>{
    if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
    e.preventDefault();move(current()+(e.key==='ArrowRight'?1:-1));
   });
  }
  screen.querySelector('#welcomeLanguage').onchange=e=>{capture();state.language=e.target.value;render(true);screen.querySelector('#welcomeLanguage').focus()};
  screen.querySelector('form').onsubmit=e=>{
   e.preventDefault();capture();
   root.FiCardMarkets.setPreferences({override:state.override,residence:state.residence});
   write('ficard.analytics.aggregate.v1',state.analytics?'yes':'no');
   root.FiCardAnalytics?.setConsent(state.analytics,false);
   write(COMPLETE,'yes');
   write(GPS,gps?'yes':'no');
   const action=e.submitter?.value;
   if(action==='add'||action==='import')write('ficard.onboarding.action',action);
   // Language changes reload the canonical HTML, as in the existing settings selector.
   if(state.language!==language()){
    write('ficard.language.v2',state.language);
    try{root.sessionStorage.removeItem('ficard.language.returnView')}catch{}
    root.location.reload();return;
   }
   waiting=false;screen.remove();root.document.body.classList.remove('isOnboarding');settings();
   root.ficardStartupTimer=setTimeout(()=>root.finishFiCardStartup?.(),8000);
   resolveReady();
   runWelcomeAction();
  };
 }
 function capture(){state.override=screen.querySelector('#welcomeMarket').value;state.residence=screen.querySelector('#welcomeResidence').value;state.analytics=screen.querySelector('#welcomeAnalytics').checked}
 render();screen.querySelector('[value=add]')?.focus({preventScroll:true});
}
function runWelcomeAction(afterReload=false){
 const action=read('ficard.onboarding.action');
 if(!action)return;
 write('ficard.onboarding.action','');
 if(action==='import'&&afterReload){root.go?.('backup');return}
 root.document.getElementById(action==='import'?'importData':'addFab')?.click();
}
root.FiCardOnboarding={ready,pending:()=>waiting,gpsEnabled:()=>gps,setGps,claimGpsIntro,disabledMessage:()=>copy(language()).gpsDisabled};
root.addEventListener('ficard:languagechange',settings);
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',show,{once:true});else show();
})(window);
