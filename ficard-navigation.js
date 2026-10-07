/* Fi-Card navigation/runtime patch v0.9.144
 * Per-view scroll positions are stored before navigation and restored after the
 * destination view has actually become active.
 * GPS is refreshed after 3 minutes in background/standby.
 */
(function(root){
'use strict';

const VERSION='0.9.144';
const STANDBY_MS=3*60*1000;
const BG_KEY='ficard.nav.backgroundAt';

function activeView(){
  const el=root.document?.querySelector('.view.active');
  return el?.id?.endsWith('View')?el.id.slice(0,-4):'';
}

function installScrollIsolation(){
  if(root.__ficardScrollIsolation)return;
  root.__ficardScrollIsolation=true;
  if('scrollRestoration' in root.history)root.history.scrollRestoration='manual';

  const yByView=Object.create(null);
  root.document?.querySelectorAll('.view[id$="View"]').forEach(el=>{yByView[el.id.slice(0,-4)]=0;});
  let current=activeView()||'home';
  yByView[current]=Math.max(0,root.scrollY||0);
  let restoringUntil=0;

  function save(view=current){
    if(!view || Date.now()<restoringUntil)return;
    yByView[view]=Math.max(0,root.scrollY||0);
  }

  function restore(view){
    if(!view)return;
    current=view;
    const y=Math.max(0,Number(yByView[view])||0);
    restoringUntil=Date.now()+350;
    const apply=()=>root.scrollTo(0,y);
    // Wait until display:none -> block and any synchronous rendering has settled.
    root.requestAnimationFrame(()=>{
      root.requestAnimationFrame(apply);
    });
    root.setTimeout(apply,60);
    root.setTimeout(apply,160);
    root.setTimeout(apply,300);
  }

  root.addEventListener('scroll',()=>save(),{passive:true});

  // Capture the outgoing page before index.html's onclick handler calls go().
  root.document?.addEventListener('pointerdown',event=>{
    const control=event.target?.closest?.('.nav[data-view],[data-go]');
    if(!control)return;
    save(activeView()||current);
  },true);

  // MutationObserver is the source of truth: it runs only after go() has
  // switched the active class, so we never restore the outgoing page by mistake.
  const observer=new MutationObserver(()=>{
    const next=activeView();
    if(next && next!==current)restore(next);
  });
  root.document?.querySelectorAll('.view').forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['class']}));

  // Programmatic changes that do not originate from a pointer are covered too.
  root.document?.addEventListener('click',event=>{
    const control=event.target?.closest?.('.nav[data-view],[data-go]');
    if(!control)return;
    const next=control.dataset.view||control.dataset.go;
    if(next && next!==current)root.setTimeout(()=>{
      const active=activeView();
      if(active===next && active!==current)restore(active);
    },0);
  },true);
}

let hiddenAt=0;
let lastRefresh=0;
function markHidden(){
  hiddenAt=Date.now();
  try{root.sessionStorage.setItem(BG_KEY,String(hiddenAt))}catch{}
}
function readHiddenAt(){
  if(hiddenAt)return hiddenAt;
  try{return Number(root.sessionStorage.getItem(BG_KEY)||0)||0}catch{return 0}
}
function clearHidden(){
  hiddenAt=0;
  try{root.sessionStorage.removeItem(BG_KEY)}catch{}
}
function alreadyHasPosition(){
  const el=root.document?.getElementById('positionAge');
  return !!el && el.dataset.age!=='none' && !String(el.textContent||'').includes('—');
}
async function resume(){
  const started=readHiddenAt();
  if(!started)return;
  const elapsed=Date.now()-started;
  clearHidden();
  if(elapsed<STANDBY_MS)return;
  if(Date.now()-lastRefresh<5000)return;
  if(!alreadyHasPosition())return;
  if(typeof root.refreshPosition!=='function')return;
  lastRefresh=Date.now();
  try{await root.refreshPosition()}catch{}
}
function installStandbyRefresh(){
  if(root.__ficardStandbyRefresh)return;
  root.__ficardStandbyRefresh=true;
  root.document?.addEventListener('visibilitychange',()=>{
    if(root.document.hidden)markHidden();
    else resume();
  });
  root.addEventListener?.('pagehide',markHidden);
  root.addEventListener?.('pageshow',resume);
  root.addEventListener?.('focus',()=>{if(!root.document?.hidden)resume()});
}

function forceVersion(){
  const release=root.document?.querySelector('.release');
  if(!release)return;
  release.textContent=release.textContent.replace(/v\d+\.\d+\.\d+/,'v'+VERSION);
}
function init(){
  installScrollIsolation();
  installStandbyRefresh();
  forceVersion();
  root.setTimeout(forceVersion,100);
  root.setTimeout(forceVersion,500);
}
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})(typeof window==='undefined'?globalThis:window);
