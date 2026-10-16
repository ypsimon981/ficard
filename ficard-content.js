/* Fi-Card v0.9.218 · Stage-aware local tips, session-stable choices, offline. */
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
/* Growth messages use only the local count of real saved cards. No card data leaves the device. */
let cardCount=0,cardCountKnown=false;
function setCardCount(value){
 const n=Math.max(0,Math.floor(Number(value)||0));
 const before=cardCountKnown?(cardCount===0?'empty':cardCount<4?'growing':'established'):'unknown';
 cardCount=n;cardCountKnown=true;
 const after=cardCount===0?'empty':cardCount<4?'growing':'established';
 if(before!==after){choices={};const banner=root.document?.getElementById('homeContentBanner');if(banner)banner.innerHTML=html('banner',true);}
}
function adAvailable(){return root.navigator?.onLine!==false&&count<=2;}
function slotAllowsAd(slot){model(slot);return adAvailable()&&choices[slot].ad;}
function currentLang(){
 let lang=root.FiCardI18n?.language?.();
 if(!lang){try{lang=root.localStorage.getItem('ficard.language.v2')||root.localStorage.getItem('ficard.language.v1');}catch{}}
 if(!lang)lang=(root.navigator?.languages||[root.navigator?.language]).map(x=>String(x||'').toLowerCase().split('-')[0]).find(x=>COPY[x]);
 return String(lang||'en').toLowerCase().split('-')[0];
}
function journeyCopy(){const lang=currentLang();return locales[lang]?.journey||locales.en?.journey||locales.it?.journey;}
function stage(){return !cardCountKnown||cardCount===0?'empty':cardCount<4?'growing':'established';}
function candidateGroups(slot){
 if(slot==='scandixit')return [{weight:1,items:[3,4,5].map(i=>'share'+(i-3))}];
 if(stage()==='empty')return [{weight:1,items:['add0','add1','add2']}];
 if(stage()==='growing')return [{weight:7,items:['add0','add1','add2']},{weight:3,items:['importFriend']}];
 return [{weight:5,items:['share0','share1','share2']},{weight:3,items:['map','backup','scandixit']},{weight:2,items:['refer0','refer1']}];
}
function pickTip(slot){
 const groups=candidateGroups(slot),other=new Set(Object.entries(choices).filter(([name,v])=>name!==slot&&v.stage===stage()).map(([,v])=>v.tip));
 const available=groups.map(g=>({...g,items:g.items.filter(id=>!other.has(id))})).filter(g=>g.items.length);
 const pool=available.length?available:groups;
 let weight=Math.random()*pool.reduce((sum,g)=>sum+g.weight,0),group=pool[pool.length-1];
 for(const g of pool){weight-=g.weight;if(weight<0){group=g;break}}
 return group.items[Math.floor(Math.random()*group.items.length)];
}
function model(slot){
 const c=copy(),st=stage();
 let chosen=choices[slot];
 if(!chosen||chosen.stage!==st){
  chosen=choices[slot]={tip:pickTip(slot),stage:st,ad:slot==='banner'||Math.random()<.5};
 }
 const candidates=Array.isArray(root.FiCardAdContent)?root.FiCardAdContent:[];
 const ad=adAvailable()&&chosen.ad?candidates.find(a=>a&&typeof a.title==='string'&&typeof a.url==='string'&&/^https:\/\//i.test(a.url)):null;
 if(ad)return {label:c[1],title:ad.title,text:ad.text||'',url:ad.url,advert:true};
 const id=chosen.tip,j=journeyCopy();
 if(id.startsWith('add')){const i=Number(id.slice(3));return {label:c[0],title:j.growth[i][0],text:j.growth[i][1],action:'add',advert:false};}
 if(id==='importFriend')return {label:c[0],title:j.importFriend[0],text:j.importFriend[1],action:'import',advert:false};
 if(id.startsWith('refer')){const i=Number(id.slice(5));return {label:c[0],title:j.referral[i][0],text:j.referral[i][1],action:'refer',advert:false};}
 if(id.startsWith('share')){const i=Number(id.slice(5)),s=sharingCopy(),item=s.items[i];return {label:c[0],title:item[0],text:s.promoSubtitles?.[i]||s.intro,action:'share',advert:false};}
 const i={map:0,backup:1,scandixit:2}[id]??0;
 return {label:c[0],title:c[3+i*2],text:c[4+i*2],action:id==='map'?'map':id==='backup'?'backup':'scandixit',advert:false};
}
function html(slot,banner=false){
 const m=model(slot),action=m.advert?'href="'+esc(m.url)+'" target="_blank" rel="noopener noreferrer"':'href="#'+esc(m.action)+'" data-content-action="'+esc(m.action)+'"'+(slot==='scandixit'&&m.action==='share'?' data-content-view="backup"':'');
 return '<a data-ad-slot="'+esc(slot)+'" data-promo-campaign="'+esc(choices[slot].tip)+'" data-ad-format="'+(banner&&slot!=='scandixit'?'banner':'native')+'" class="'+(banner?'contentBanner':'card advertisingCard contentTile')+'" '+action+' style="--card-color:#E4F8F3;--card-ink:#4324BC"><div class="advertisingContent"><span class="advertisingLabel">'+esc(m.label)+'</span><strong>'+esc(m.title)+'</strong><small>'+esc(m.text)+'</small></div>'+(banner?'<span class="badge">'+esc(copy()[2])+'</span>':'')+'</a>';
}
function renderSharing(){
 const panel=root.document?.getElementById('cardSharingMessages');if(!panel)return;
 const s=sharingCopy();
 panel.innerHTML='<h3>'+esc(s.intro)+'</h3>'+s.items.map(item=>'<details><summary>'+esc(item[0])+'</summary><p>'+esc(item[1])+'</p></details>').join('')+'<p class="sharingDisclaimer">'+esc(s.disclaimer)+'</p>';
}
function render(){const banner=root.document?.getElementById('homeContentBanner');if(banner)banner.innerHTML=html('banner',true);renderSharing();root.renderCards?.();}
root.FiCardContent={html,model,session,adAvailable,slotAllowsAd,setCardCount};session();
root.document?.addEventListener('click',async e=>{
 const link=e.target?.closest?.('[data-content-action]');if(!link||link.classList.contains('nativeAdLoaded'))return;
 e.preventDefault();
 const action=link.dataset.contentAction;
 if(action==='add'){root.document.getElementById('addFab')?.click();return;}
 if(action==='refer'){
  const url='https://fi-card.app/',j=journeyCopy();
  try{
   if(root.navigator?.share){await root.navigator.share({title:'Fi-Card',text:j.invite,url});return;}
   if(root.navigator?.clipboard?.writeText){await root.navigator.clipboard.writeText(url);root.toast?.(j.copied);return;}
   root.prompt?.(j.copyPrompt,url);
  }catch(err){if(err?.name!=='AbortError')root.prompt?.(j.copyPrompt,url);}
  return;
 }
 root.go?.(action==='map'?'map':action==='scandixit'?'scandixit':'backup');
 const id=action==='import'?'importData':action==='share'?'sharingCardsBox':action==='backup'?'backupInfo':null;
 if(id){
  const target=root.document.getElementById(id);
  for(let parent=target?.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
  target?.scrollIntoView?.({block:'center',behavior:'auto'});
 }
});
root.document?.addEventListener('visibilitychange',()=>{if(root.document.hidden){try{root.sessionStorage.setItem(SESSION,JSON.stringify({day:day(Date.now()),count,last:Date.now()}));}catch{}}else{session();render();}});
root.document?.addEventListener('pointerdown',()=>{if(Date.now()-last>60000){try{root.sessionStorage.setItem(SESSION,JSON.stringify({day:day(Date.now()),count,last:Date.now()}));}catch{}last=Date.now();}},{passive:true});
root.addEventListener?.('offline',render);root.addEventListener?.('online',render);root.addEventListener?.('ficard:languagechange',render);
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})(typeof window==='undefined'?globalThis:window);
