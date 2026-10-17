/* Fi-Card aggregate statistics + cached public brand catalog. No user/install ID or individual event archive. */
(function(root){
'use strict';
const VERSION='0.9.211',PREFERENCE='ficard.analytics.aggregate.v1',LEGACY='ficard.analytics.consent.v1',INSTALL_SEEN='ficard.analytics.install-observed.v1';
const CATALOG_CACHE='ficard.catalog.cache.v1',CATALOG_VERSION='ficard.catalog.version.v1',CATALOG_CHECK_MS=15*60*1000;
const PAGES=new Set(['home','map','scandixit','profile']);
const EVENTS=new Set(['install_observed','analytics_disabled','analytics_enabled','app_open','page_view','card_added','card_open','favorite_toggled','fullscreen_open','scan_started','navigation_started','location_association_started','backup_created','card_share_started','promo_impression','promo_click','share_started','share_completed','backup_merged']);
const STARTUP_OUTCOMES=new Set(['found','no_card','gps_denied','gps_unavailable','timeout','empty','error']);
const STARTUP_BUCKETS=['lt1','1to2','2to3','3to5','over5'];
for(const outcome of STARTUP_OUTCOMES)EVENTS.add('startup_'+outcome);
for(const bucket of STARTUP_BUCKETS)EVENTS.add('arrival_time_'+bucket);
let startupReported=false,arrivalReported=false;
const BRAND_EVENTS=new Set(['card_added','card_open']);
let controllers=new Set(),recent=new Map(),lastOpen=0,hiddenAt=0,memoryChoice=null,detailObserver=null,installPending=false,lastCatalogCheck=0,catalogBusy=false;
function enabled(){if(memoryChoice!==null)return memoryChoice;try{const value=root.localStorage.getItem(PREFERENCE);return value===null?root.localStorage.getItem(LEGACY)!=='no':value!=='no'}catch{return true}}
function removeLegacyID(){try{root.localStorage.removeItem('ficard.analytics.install.v1')}catch{}}
function currentPage(){const page=root.document?.querySelector('.view.active')?.id?.replace(/View$/,'')||'home';return page==='backup'?'profile':page}
function config(){const c=root.FICARD_ANALYTICS_CONFIG;return c?.key&&/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(c.url)?c:null}
function market(){const explicit=String(root.FICARD_MARKET||'IT').toUpperCase();return /^[A-Z]{2}$/.test(explicit)?explicit:'IT'}
function localBrands(){try{return typeof BRANDS==='object'&&BRANDS?BRANDS:null}catch{return null}}
function knownBrand(key){const brands=localBrands();return key&&brands&&Object.hasOwn(brands,key)?key:null}
function apiFetch(path,options={}){const c=config();if(!c)return Promise.reject(new Error('catalog config'));return root.fetch(c.url+path,{...options,headers:{apikey:c.key,...(options.headers||{})},credentials:'omit',referrerPolicy:'no-referrer'})}
function validCatalogRow(r){return r&&typeof r.brand_key==='string'&&r.brand_key.length>0&&r.brand_key.length<=80&&['published','disabled'].includes(r.status)}
function applyCatalog(rows,refresh=false){
 const brands=localBrands();if(!brands||!Array.isArray(rows))return false;const m=market();let changed=false;
 for(const r of rows){
  if(!validCatalogRow(r))continue;const allowed=r.international===true||(Array.isArray(r.markets)&&r.markets.map(x=>String(x).toUpperCase()).includes(m));
  if(r.status==='disabled'||!allowed){if(Object.hasOwn(brands,r.brand_key)){delete brands[r.brand_key];changed=true}continue}
  if(!r.is_complete)continue;
  const b=brands[r.brand_key]||{};const patch={remoteCatalog:true};
  if(r.name)patch.name=String(r.name).slice(0,100);if(r.category)patch.category=r.category;if(r.color)patch.color=r.color;
  if(r.mark)patch.mark=String(r.mark).slice(0,80);else if(r.name)patch.mark=String(r.name).toUpperCase().slice(0,24);
  if(r.logo_url)patch.logo=r.logo_url;if(r.logo_bg)patch.logoBg=r.logo_bg;if(Number(r.logo_scale))patch.logoScale=Math.max(10,Math.min(100,Number(r.logo_scale)));
  if(r.domain)patch.domain=r.domain;if(r.logo_url||r.logo_scale)patch.studioRevision=Math.max(1,Number(r.revision)||1);
  brands[r.brand_key]=Object.assign({},b,patch);changed=true;
 }
 if(changed&&refresh)refreshCatalogUi();return changed;
}
function refreshCatalogUi(){
 try{const s=root.document?.getElementById('addBrand');if(s&&typeof catalogOptions==='function'){const v=s.value;s.innerHTML=catalogOptions(v);if(Object.hasOwn(localBrands()||{},v))s.value=v}if(typeof renderBrandResults==='function')renderBrandResults();if(typeof renderAll==='function')renderAll()}catch{}
 try{root.dispatchEvent(new CustomEvent('ficard:catalog-updated',{detail:{market:market()}}))}catch{}
}
function readCatalogCache(){try{const rows=JSON.parse(root.localStorage.getItem(CATALOG_CACHE)||'[]');return Array.isArray(rows)?rows:[]}catch{return []}}
function saveCatalogCache(rows,version){try{root.localStorage.setItem(CATALOG_CACHE,JSON.stringify(rows));root.localStorage.setItem(CATALOG_VERSION,String(version))}catch{}}
function applyCachedCatalog(){const rows=readCatalogCache();if(rows.length)applyCatalog(rows,false)}
async function syncCatalog(force=false){
 if(catalogBusy||root.navigator?.onLine===false||!config())return false;const now=Date.now();if(!force&&now-lastCatalogCheck<CATALOG_CHECK_MS)return false;lastCatalogCheck=now;catalogBusy=true;
 try{
  const state=await apiFetch('/rest/v1/ficard_catalog_state?select=version&singleton=eq.true',{cache:'no-store'});if(!state.ok)return false;const stateRows=await state.json();const version=Number(stateRows?.[0]?.version||0);const cached=Number(root.localStorage.getItem(CATALOG_VERSION)||0);
  if(version&&version===cached&&readCatalogCache().length)return true;
  const fields='brand_key,name,category,color,mark,logo_url,logo_bg,logo_scale,domain,international,markets,status,is_complete,revision,updated_at';
  const response=await apiFetch('/rest/v1/ficard_brand_catalog?select='+encodeURIComponent(fields)+'&order=brand_key.asc',{cache:'no-store'});if(!response.ok)return false;const rows=await response.json();if(!Array.isArray(rows))return false;
  saveCatalogCache(rows,version);applyCatalog(rows,true);return true;
 }catch{return false}finally{catalogBusy=false}
}
function sendCount(event,page=currentPage(),brandKey='',force=false){
 try{
  if(root.FiCardOnboarding?.pending()||(!force&&!enabled())||root.navigator?.onLine===false||root.parent!==root)return Promise.resolve(false);if(!EVENTS.has(event)||!PAGES.has(page))return Promise.resolve(false);
  const promo=event.startsWith('promo_');if(promo&&!/^(banner|fourth|last|scandixit):tip[0-5]$/.test(brandKey))return Promise.resolve(false);
  let brand=null;if(promo)brand=brandKey;else if(BRAND_EVENTS.has(event))brand=knownBrand(brandKey);else if(brandKey)return Promise.resolve(false);
  const c=config();if(!c)return Promise.resolve(false);const key=event+':'+page+':'+(brand||''),now=Date.now();const noDebounce=event==='card_added'||event==='install_observed'||event==='analytics_disabled'||event==='analytics_enabled';
  if(!noDebounce&&now-(recent.get(key)||0)<2000)return Promise.resolve(false);if(controllers.size>=40)return Promise.resolve(false);recent.set(key,now);
  const controller=new AbortController();controllers.add(controller);const timer=root.setTimeout(()=>controller.abort(),5000);const payload={p_event:event,p_page:page,p_brand:brand};
  return apiFetch('/rest/v1/rpc/ficard_count_usage',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload),signal:controller.signal}).then(r=>r.ok).catch(()=>false).finally(()=>{root.clearTimeout(timer);controllers.delete(controller)});
 }catch{return Promise.resolve(false)}
}
function track(event,page=currentPage(),brandKey=''){return sendCount(event,page,brandKey,false)}
function startupOutcome(outcome){
 if(startupReported||!STARTUP_OUTCOMES.has(outcome))return Promise.resolve(false);
 startupReported=true;
 return track('startup_'+outcome,'home');
}
function arrivalLatency(ms){
 if(arrivalReported||!Number.isFinite(ms)||ms<0||ms>30000)return Promise.resolve(false);
 arrivalReported=true;
 const bucket=ms<1000?'lt1':ms<2000?'1to2':ms<3000?'2to3':ms<=5000?'3to5':'over5';
 return track('arrival_time_'+bucket,'home');
}
async function observeInstallation(){if(installPending||!enabled())return;try{if(root.localStorage.getItem(INSTALL_SEEN)==='yes')return}catch{}installPending=true;const ok=await sendCount('install_observed','home','',false);if(ok)try{root.localStorage.setItem(INSTALL_SEEN,'yes')}catch{}installPending=false}
function opened(){if(Date.now()-lastOpen<180000)return;lastOpen=Date.now();observeInstallation();track('app_open');track('page_view');syncCatalog(false)}
function setConsent(value,reportChoice=false){const previous=enabled(),next=!!value;if(previous===next){const check=root.document?.getElementById('analyticsConsent');if(check)check.checked=next;return}controllers.forEach(c=>c.abort());controllers.clear();recent.clear();if(reportChoice&&previous&&!next)sendCount('analytics_disabled',currentPage(),'',true);memoryChoice=next;try{root.localStorage.setItem(PREFERENCE,next?'yes':'no')}catch{}removeLegacyID();if(next){if(reportChoice)sendCount('analytics_enabled',currentPage(),'',true);lastOpen=0;opened()}const check=root.document?.getElementById('analyticsConsent');if(check)check.checked=enabled()}
const COPY=Object.fromEntries(Object.entries(root.FiCardLocales||{}).map(([lang,data])=>[lang,data.analytics]));
function render(){const box=root.document?.getElementById('launchSettings');if(!box)return;let language=root.FiCardI18n?.language?.();if(!language){try{language=root.localStorage.getItem('ficard.language.v2')||root.navigator?.language}catch{}}const text=COPY[String(language||'en').split('-')[0]]||COPY.en;if(!text)return;box.setAttribute('aria-label',text[0]);box.innerHTML='<h3 style="font-size:16px">'+text[0]+'</h3><label style="display:flex;gap:10px;align-items:center;font-size:14px;color:var(--text)"><input id="analyticsConsent" type="checkbox" style="width:20px;height:20px;flex:none">'+text[1]+'</label><p class="hint">'+text[2]+'</p><div class="reviewActions"><a class="reviewAction reviewMail" href="./privacy.html" target="_blank" rel="noopener">'+text[3]+'</a><a class="reviewAction reviewMail" href="mailto:info@fi-card.app?subject=Supporto%20Fi-Card">'+text[4]+'</a></div>';const check=root.document.getElementById('analyticsConsent');check.checked=enabled();check.addEventListener('change',()=>setConsent(check.checked,true))}
function trackGenericUi(event){const target=event.target?.closest?.('button,a,input');if(!target)return;if(target.matches('[data-toggle-fav]'))track('favorite_toggled');else if(target.id==='fullBtn')track('fullscreen_open');else if(['scanBtn','imageScanBtn','importImagesProfile'].includes(target.id))track('scan_started');else if(target.matches('[data-navigate],[data-nav-loc]'))track('navigation_started');else if(['assocBtn','mapAssocBtn','pickerSave'].includes(target.id))track('location_association_started');else if(target.id==='exportData')track('backup_created','profile');else if(target.id==='shareBtn')track('card_share_started')}
function watchCardDetail(){const modal=root.document?.getElementById('detailModal');if(!modal||typeof MutationObserver==='undefined')return;detailObserver?.disconnect();detailObserver=new MutationObserver(()=>{if(!modal.classList.contains('show'))return;const key=modal.querySelector('.detailBrandHeader[data-brand]')?.dataset.brand||'';track('card_open',currentPage(),key)});detailObserver.observe(modal,{attributes:true,attributeFilter:['class']})}
function init(){removeLegacyID();applyCachedCatalog();render();watchCardDetail();syncCatalog(false);if(enabled())opened();root.document?.addEventListener('click',trackGenericUi,true);root.document?.addEventListener('visibilitychange',()=>{if(root.document.hidden)hiddenAt=Date.now();else{syncCatalog(false);if(hiddenAt&&Date.now()-hiddenAt>=180000){hiddenAt=0;opened()}}});root.addEventListener?.('online',()=>syncCatalog(true));root.addEventListener?.('storage',e=>{if(e.key===PREFERENCE){memoryChoice=null;if(!enabled()){controllers.forEach(c=>c.abort());controllers.clear();recent.clear()}render()}})}
root.FiCardAnalytics={track,setConsent,enabled,startupOutcome,arrivalLatency};root.FiCardCatalog={sync:()=>syncCatalog(true),market,version:()=>{try{return Number(root.localStorage.getItem(CATALOG_VERSION)||0)}catch{return 0}}};
function start(){if(root.FiCardOnboarding?.pending())root.FiCardOnboarding.ready.then(init);else init()}
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window==='undefined'?globalThis:window);
