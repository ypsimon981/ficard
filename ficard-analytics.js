/* Fi-Card aggregate statistics. No user ID, installation ID, card code, precise location or individual event archive. */
(function(root){
'use strict';
const VERSION='0.9.210',PREFERENCE='ficard.analytics.aggregate.v1',LEGACY='ficard.analytics.consent.v1',INSTALL_SEEN='ficard.analytics.install-observed.v1';
const PAGES=new Set(['home','map','scandixit','profile']);
const EVENTS=new Set(['install_observed','analytics_disabled','analytics_enabled','app_open','page_view','card_added','card_open','favorite_toggled','fullscreen_open','scan_started','navigation_started','location_association_started','backup_created','card_share_started','promo_impression','promo_click','share_started','share_completed','backup_merged']);
const BRAND_EVENTS=new Set(['card_added','card_open']);
let controllers=new Set(),recent=new Map(),lastOpen=0,hiddenAt=0,memoryChoice=null,detailObserver=null,installPending=false;
function enabled(){
 if(memoryChoice!==null)return memoryChoice;
 try{const value=root.localStorage.getItem(PREFERENCE);return value===null?root.localStorage.getItem(LEGACY)!=='no':value!=='no'}catch{return true}
}
function removeLegacyID(){try{root.localStorage.removeItem('ficard.analytics.install.v1')}catch{}}
function currentPage(){return root.document?.querySelector('.view.active')?.id?.replace(/View$/,'')||'home'}
function knownBrand(key){
 try{const brands=typeof BRANDS==='object'?BRANDS:{};return key&&Object.hasOwn(brands,key)?key:null}catch{return null}
}
function sendCount(event,page=currentPage(),brandKey='',force=false){
 try{
  if((!force&&!enabled())||root.navigator?.onLine===false||root.parent!==root)return Promise.resolve(false);
  if(!EVENTS.has(event)||!PAGES.has(page))return Promise.resolve(false);
  const promo=event.startsWith('promo_');
  if(promo&&!/^(banner|fourth|last|scandixit):tip[0-5]$/.test(brandKey))return Promise.resolve(false);
  let brand=null;
  if(promo)brand=brandKey;
  else if(BRAND_EVENTS.has(event))brand=knownBrand(brandKey);
  else if(brandKey)return Promise.resolve(false);
  const config=root.FICARD_ANALYTICS_CONFIG;
  if(!config?.key||!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(config.url))return Promise.resolve(false);
  const key=event+':'+page+':'+(brand||''),now=Date.now();
  const noDebounce=event==='card_added'||event==='install_observed'||event==='analytics_disabled'||event==='analytics_enabled';
  if(!noDebounce&&now-(recent.get(key)||0)<2000)return Promise.resolve(false);
  if(controllers.size>=40)return Promise.resolve(false);
  recent.set(key,now);
  const controller=new AbortController();controllers.add(controller);
  const timer=root.setTimeout(()=>controller.abort(),5000);
  const payload={p_event:event,p_page:page,p_brand:brand};
  return root.fetch(config.url+'/rest/v1/rpc/ficard_count_usage',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload),credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal}).then(r=>r.ok).catch(()=>false).finally(()=>{root.clearTimeout(timer);controllers.delete(controller)});
 }catch{return Promise.resolve(false)}
}
function track(event,page=currentPage(),brandKey=''){return sendCount(event,page,brandKey,false)}
async function observeInstallation(){
 if(installPending||!enabled())return;
 try{if(root.localStorage.getItem(INSTALL_SEEN)==='yes')return}catch{}
 installPending=true;
 const ok=await sendCount('install_observed','home','',false);
 if(ok)try{root.localStorage.setItem(INSTALL_SEEN,'yes')}catch{}
 installPending=false;
}
function opened(){if(Date.now()-lastOpen<180000)return;lastOpen=Date.now();observeInstallation();track('app_open');track('page_view')}
function setConsent(value,reportChoice=false){
 const previous=enabled(),next=!!value;
 if(previous===next){const check=root.document?.getElementById('analyticsConsent');if(check)check.checked=next;return}
 if(reportChoice&&previous&&!next)sendCount('analytics_disabled',currentPage(),'',true);
 controllers.forEach(c=>c.abort());controllers.clear();recent.clear();
 memoryChoice=next;
 try{root.localStorage.setItem(PREFERENCE,next?'yes':'no')}catch{}
 removeLegacyID();
 if(next){if(reportChoice)sendCount('analytics_enabled',currentPage(),'',true);lastOpen=0;opened()}
 const check=root.document?.getElementById('analyticsConsent');if(check)check.checked=enabled();
}
const COPY=Object.fromEntries(Object.entries(root.FiCardLocales||{}).map(([lang,data])=>[lang,data.analytics]));
function render(){
 const box=root.document?.getElementById('launchSettings');if(!box)return;
 let language=root.FiCardI18n?.language?.();if(!language){try{language=root.localStorage.getItem('ficard.language.v2')||root.navigator?.language}catch{}}
 const text=COPY[String(language||'en').split('-')[0]]||COPY.en;box.setAttribute('aria-label',text[0]);
 box.innerHTML='<h3 style="font-size:16px">'+text[0]+'</h3><label style="display:flex;gap:10px;align-items:center;font-size:14px;color:var(--text)"><input id="analyticsConsent" type="checkbox" style="width:20px;height:20px;flex:none">'+text[1]+'</label><p class="hint">'+text[2]+'</p><div class="reviewActions"><a class="reviewAction reviewMail" href="./privacy.html" target="_blank" rel="noopener">'+text[3]+'</a><a class="reviewAction reviewMail" href="mailto:info@fi-card.app?subject=Supporto%20Fi-Card">'+text[4]+'</a></div>';
 const check=root.document.getElementById('analyticsConsent');check.checked=enabled();check.addEventListener('change',()=>setConsent(check.checked,true));
}
function trackGenericUi(event){
 const target=event.target?.closest?.('button,a,input');if(!target)return;
 if(target.matches('[data-toggle-fav]'))track('favorite_toggled');
 else if(target.id==='fullBtn')track('fullscreen_open');
 else if(['scanBtn','imageScanBtn','importImagesProfile'].includes(target.id))track('scan_started');
 else if(target.matches('[data-navigate],[data-nav-loc]'))track('navigation_started');
 else if(['assocBtn','mapAssocBtn','pickerSave'].includes(target.id))track('location_association_started');
 else if(target.id==='exportData')track('backup_created','profile');
 else if(target.id==='shareBtn')track('card_share_started');
}
function watchCardDetail(){
 const modal=root.document?.getElementById('detailModal');if(!modal||typeof MutationObserver==='undefined')return;
 detailObserver?.disconnect();
 detailObserver=new MutationObserver(()=>{
  if(!modal.classList.contains('show'))return;
  const key=modal.querySelector('.detailBrandHeader[data-brand]')?.dataset.brand||'';
  track('card_open',currentPage(),key);
 });
 detailObserver.observe(modal,{attributes:true,attributeFilter:['class']});
}
function init(){
 removeLegacyID();render();watchCardDetail();if(enabled())opened();
 root.document?.addEventListener('click',trackGenericUi,true);
 root.document?.addEventListener('visibilitychange',()=>{if(root.document.hidden)hiddenAt=Date.now();else if(hiddenAt&&Date.now()-hiddenAt>=180000){hiddenAt=0;opened()}});
 root.addEventListener?.('storage',e=>{if(e.key===PREFERENCE){memoryChoice=null;if(!enabled()){controllers.forEach(c=>c.abort());controllers.clear();recent.clear()}render()}})
}
root.FiCardAnalytics={track,setConsent,enabled};
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof window==='undefined'?globalThis:window);
