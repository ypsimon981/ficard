/* First-launch choices. All preferences stay on this device. */
(function(root){
'use strict';
const COMPLETE='ficard.onboarding.complete.v1',GPS='ficard.gps.enabled.v1';
const read=key=>{try{return root.localStorage.getItem(key)}catch{return null}};
const write=(key,value)=>{try{root.localStorage.setItem(key,value)}catch{}};
const embedded=root.parent!==root;
let waiting=!embedded&&read(COMPLETE)!=='yes',gps=read(GPS)!=='no',resolveReady;
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
 check.onchange=()=>{gps=check.checked;write(GPS,gps?'yes':'no');root.dispatchEvent(new CustomEvent('ficard:gpschange',{detail:{enabled:gps}}))};
 const residence=root.document.getElementById('marketResidence');
 if(residence){let help=root.document.getElementById('residenceHelp');if(!help){help=root.document.createElement('p');help.id='residenceHelp';help.className='hint';help.setAttribute('data-i18n-skip','');residence.after(help)}help.textContent=c.residenceHelp}
}
function show(){
 settings();if(!waiting)return;
 clearTimeout(root.ficardStartupTimer);
 const markets=root.FiCardMarkets.read();
 const aggregate=read('ficard.analytics.aggregate.v1');
 const state={language:language(),override:markets.override,residence:markets.residence,analytics:root.FiCardAnalytics?.enabled()??(aggregate!==null?aggregate!=='no':read('ficard.analytics.consent.v1')!=='no')};
 const screen=root.document.createElement('section');screen.id='firstLaunch';screen.className='firstLaunch';screen.setAttribute('data-i18n-skip','');
 screen.setAttribute('aria-labelledby','firstLaunchTitle');screen.setAttribute('role','dialog');screen.setAttribute('aria-modal','true');
 root.document.body.classList.add('isOnboarding');root.document.body.appendChild(screen);
 function render(){
  const c=copy(state.language),langs=root.FiCardI18n?.languageNames||{it:'Italiano',en:'English',fr:'Français',es:'Español',pt:'Português',nl:'Nederlands',de:'Deutsch'};
  const countries=[['IT',c.italy],['FR',c.france],['XX',c.other]];
  const options=(items,selected)=>items.map(([value,label])=>'<option value="'+value+'"'+(value===selected?' selected':'')+'>'+esc(label)+'</option>').join('');
  const field=(id,title,help,items,selected)=>'<div class="firstLaunchField"><label for="'+id+'">'+esc(title)+'</label><select id="'+id+'" class="field">'+options(items,selected)+'</select><p class="hint">'+esc(help)+'</p></div>';
  const check=(id,title,help,checked)=>'<div class="firstLaunchField"><label class="onboardingCheck"><input id="'+id+'" type="checkbox"'+(checked?' checked':'')+'><span>'+esc(title)+'</span></label><p class="hint">'+esc(help)+'</p></div>';
  screen.innerHTML='<form class="firstLaunchSheet"><div class="firstLaunchBrand" aria-label="Fi-Card">Fi-Card</div><h1 id="firstLaunchTitle">'+esc(c.title)+'</h1><p class="hint">'+esc(c.intro)+'</p>'+field('welcomeLanguage',c.language,c.languageHelp,Object.entries(langs),state.language)+field('welcomeMarket',c.market,c.marketHelp,[['auto',c.auto],...countries],state.override)+field('welcomeResidence',c.residence,c.residenceHelp,countries,state.residence)+'<div class="firstLaunchField"><strong>'+esc(c.gps)+'</strong><p class="hint">'+esc(c.gpsHelp)+'</p></div>'+check('welcomeAnalytics',c.analytics,c.analyticsHelp,state.analytics)+'<a href="./privacy.html" target="_blank" rel="noopener">'+esc(c.privacy)+'</a><button type="submit" class="primary">'+esc(c.continue)+'</button></form>';
  screen.querySelector('#welcomeLanguage').onchange=e=>{capture();state.language=e.target.value;render();screen.querySelector('#welcomeLanguage').focus()};
  screen.querySelector('form').onsubmit=e=>{
   e.preventDefault();capture();
   root.FiCardMarkets.setPreferences({override:state.override,residence:state.residence});
   write('ficard.analytics.aggregate.v1',state.analytics?'yes':'no');
   root.FiCardAnalytics?.setConsent(state.analytics,false);
   write(COMPLETE,'yes');
   // Language changes reload the canonical HTML, as in the existing settings selector.
   if(state.language!==language()){
    write('ficard.language.v2',state.language);
    try{root.sessionStorage.removeItem('ficard.language.returnView')}catch{}
    root.location.reload();return;
   }
   waiting=false;screen.remove();root.document.body.classList.remove('isOnboarding');settings();
   root.ficardStartupTimer=setTimeout(()=>root.finishFiCardStartup?.(),8000);
   resolveReady();
  };
 }
 function capture(){state.override=screen.querySelector('#welcomeMarket').value;state.residence=screen.querySelector('#welcomeResidence').value;state.analytics=screen.querySelector('#welcomeAnalytics').checked}
 render();screen.querySelector('#welcomeLanguage').focus();
}
root.FiCardOnboarding={ready,pending:()=>waiting,gpsEnabled:()=>gps,disabledMessage:()=>copy(language()).gpsDisabled};
root.addEventListener('ficard:languagechange',settings);
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',show,{once:true});else show();
})(window);
