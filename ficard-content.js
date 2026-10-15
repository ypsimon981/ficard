/* Fi-Card v0.9.209 · Local daily cap, stable session content, offline tips. */
(function(root){
'use strict';
const DAILY='ficard.content.day.v1',SESSION='ficard.content.session.v1',IDLE=30*60*1000;
let count=3,last=0,choices={};
const locales=root.FiCardLocales||{};
const COPY=Object.fromEntries(Object.entries(locales).map(([lang,data])=>[lang,data.content]));
const SHARING=Object.fromEntries(Object.entries(locales).map(([lang,data])=>[lang,data.sharing]));
function sharingCopy(){return SHARING[Object.keys(COPY).find(lang=>COPY[lang]===copy())]||SHARING.en;}
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
 if(!chosen){chosen=choices[slot]={tip:slot==='scandixit'?3+Math.floor(Math.random()*3):Math.floor(Math.random()*6),ad:slot==='banner'||Math.random()<.5};}
 const candidates=Array.isArray(root.FiCardAdContent)?root.FiCardAdContent:[];
 const ad=adAvailable()&&chosen.ad?candidates.find(a=>a&&typeof a.title==='string'&&typeof a.url==='string'&&/^https:\/\//i.test(a.url)):null;
 if(ad)return {label:c[1],title:ad.title,text:ad.text||'',url:ad.url,advert:true};
 const i=chosen.tip;
 if(i>=3){const s=sharingCopy(),item=s.items[i-3];return {label:c[0],title:item[0],text:s.promoSubtitles?.[i-3]||s.intro,view:'profile',sharing:true,advert:false};}
 return {label:c[0],title:c[3+i*2],text:c[4+i*2],view:['map','profile','scandixit'][i],advert:false};
}
function html(slot,banner=false){
 const m=model(slot),action=m.advert?'href="'+esc(m.url)+'" target="_blank" rel="noopener noreferrer"':'href="#'+m.view+'" data-content-view="'+m.view+'"'+(m.sharing?' data-content-sharing="true"':'');
 return '<a data-ad-slot="'+esc(slot)+'" data-promo-campaign="tip'+choices[slot].tip+'" data-ad-format="'+(banner&&slot!=='scandixit'?'banner':'native')+'" class="'+(banner?'contentBanner':'card advertisingCard contentTile')+'" '+action+' style="--card-color:#E4F8F3;--card-ink:#4324BC"><div class="advertisingContent"><span class="advertisingLabel">'+esc(m.label)+'</span><strong>'+esc(m.title)+'</strong><small>'+esc(m.text)+'</small></div>'+(banner?'<span class="badge">'+esc(copy()[2])+'</span>':'')+'</a>';
}
function renderSharing(){
 const panel=root.document?.getElementById('cardSharingMessages');if(!panel)return;
 const s=sharingCopy();
 panel.innerHTML='<h3>'+esc(s.intro)+'</h3>'+s.items.map(item=>'<details><summary>'+esc(item[0])+'</summary><p>'+esc(item[1])+'</p></details>').join('')+'<p class="sharingDisclaimer">'+esc(s.disclaimer)+'</p>';
}
function render(){const banner=root.document?.getElementById('homeContentBanner');if(banner)banner.innerHTML=html('banner',true);renderSharing();root.renderCards?.();}
root.FiCardContent={html,model,session,adAvailable,slotAllowsAd};session();
root.document?.addEventListener('click',e=>{const link=e.target?.closest?.('[data-content-view]');if(!link)return;e.preventDefault();if(link.classList.contains('nativeAdLoaded'))return;root.go?.(link.dataset.contentView);if(link.dataset.contentSharing){const panel=root.document?.getElementById('cardSharingMessages');panel?.scrollIntoView?.({block:'center',behavior:'auto'});panel?.focus?.({preventScroll:true});}});
root.document?.addEventListener('visibilitychange',()=>{if(root.document.hidden){try{root.sessionStorage.setItem(SESSION,JSON.stringify({day:day(Date.now()),count,last:Date.now()}));}catch{}}else{session();render();}});
root.document?.addEventListener('pointerdown',()=>{if(Date.now()-last>60000){try{root.sessionStorage.setItem(SESSION,JSON.stringify({day:day(Date.now()),count,last:Date.now()}));}catch{}last=Date.now();}},{passive:true});
root.addEventListener?.('offline',render);root.addEventListener?.('online',render);root.addEventListener?.('ficard:languagechange',render);
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})(typeof window==='undefined'?globalThis:window);
