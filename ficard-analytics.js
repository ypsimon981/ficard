/* Fi-Card daily aggregate counters. No installation ID or individual event archive. */
(function(root){
'use strict';
const VERSION='0.9.205',PREFERENCE='ficard.analytics.aggregate.v1',LEGACY='ficard.analytics.consent.v1';
const PAGES=new Set(['home','map','scandixit','profile']);
let controllers=new Set(),recent=new Map(),lastOpen=0,hiddenAt=0,memoryChoice=null;
function enabled(){
 if(memoryChoice!==null)return memoryChoice;
 try{const value=root.localStorage.getItem(PREFERENCE);return value===null?root.localStorage.getItem(LEGACY)!=='no':value!=='no'}catch{return true}
}
function removeLegacyID(){try{root.localStorage.removeItem('ficard.analytics.install.v1')}catch{}}
function currentPage(){return root.document?.querySelector('.view.active')?.id?.replace(/View$/,'')||'home'}
function track(event,page=currentPage(),brandKey=''){
 try{
  if(!enabled()||root.navigator?.onLine===false||root.parent!==root)return Promise.resolve(false);
  if(!['app_open','page_view','card_added','promo_impression','promo_click','share_started','share_completed','backup_merged'].includes(event)||!PAGES.has(page))return Promise.resolve(false);
  const brands=typeof BRANDS==='object'?BRANDS:{};
  const promo=event.startsWith('promo_');
  if(promo&&!/^(banner|fourth|last|scandixit):tip[0-5]$/.test(brandKey))return Promise.resolve(false);
  const brand=promo?brandKey:event==='card_added'&&Object.hasOwn(brands,brandKey)?brandKey:null;
  const config=root.FICARD_ANALYTICS_CONFIG;
  if(!config?.key||!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(config.url))return Promise.resolve(false);
  const key=event+':'+page+':'+(promo?brandKey:''),now=Date.now();
  if(event!=='card_added'&&now-(recent.get(key)||0)<2000)return Promise.resolve(false);
  if(controllers.size>=40)return Promise.resolve(false);
  recent.set(key,now);
  const controller=new AbortController();controllers.add(controller);
  const timer=root.setTimeout(()=>controller.abort(),5000);
  const payload={p_event:event,p_page:page,p_brand:brand};
  return root.fetch(config.url+'/rest/v1/rpc/ficard_count_usage',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload),credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal}).then(r=>r.ok).catch(()=>false).finally(()=>{root.clearTimeout(timer);controllers.delete(controller)});
 }catch{return Promise.resolve(false)}
}
function opened(){if(Date.now()-lastOpen<180000)return;lastOpen=Date.now();track('app_open');track('page_view')}
function setConsent(value){
 controllers.forEach(c=>c.abort());controllers.clear();recent.clear();
 memoryChoice=!!value;
 try{root.localStorage.setItem(PREFERENCE,value?'yes':'no')}catch{}
 removeLegacyID();
 if(value){lastOpen=0;opened()}
 const check=root.document?.getElementById('analyticsConsent');if(check)check.checked=enabled();
}
const COPY=Object.fromEntries(Object.entries(root.FiCardLocales||{}).map(([lang,data])=>[lang,data.analytics]));
function render(){
 const box=root.document?.getElementById('launchSettings');if(!box)return;
 let language=root.FiCardI18n?.language?.();if(!language){try{language=root.localStorage.getItem('ficard.language.v2')||root.navigator?.language}catch{}}
 const text=COPY[String(language||'en').split('-')[0]]||COPY.en;box.setAttribute('aria-label',text[0]);
 box.innerHTML='<h3 style="font-size:16px">'+text[0]+'</h3><label style="display:flex;gap:10px;align-items:center;font-size:14px;color:var(--text)"><input id="analyticsConsent" type="checkbox" style="width:20px;height:20px;flex:none">'+text[1]+'</label><p class="hint">'+text[2]+'</p><div class="reviewActions"><a class="reviewAction reviewMail" href="./privacy.html" target="_blank" rel="noopener">'+text[3]+'</a><a class="reviewAction reviewMail" href="mailto:info@fi-card.app?subject=Supporto%20Fi-Card">'+text[4]+'</a></div>';
 const check=root.document.getElementById('analyticsConsent');check.checked=enabled();check.addEventListener('change',()=>setConsent(check.checked));
}
function init(){removeLegacyID();render();if(enabled())opened();root.document?.addEventListener('visibilitychange',()=>{if(root.document.hidden)hiddenAt=Date.now();else if(hiddenAt&&Date.now()-hiddenAt>=180000){hiddenAt=0;opened()}});root.addEventListener?.('storage',e=>{if(e.key===PREFERENCE){memoryChoice=null;if(!enabled()){controllers.forEach(c=>c.abort());controllers.clear();recent.clear()}render()}})}
root.FiCardAnalytics={track,setConsent,enabled};
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof window==='undefined'?globalThis:window);
