/* Fi-Card navigation/runtime patch
 * - independent scroll for each main view
 * - refresh GPS after 3 minutes in background/standby
 */
(function(root){
'use strict';

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
  let current=activeView()||'home';
  let restoring=false;
  yByView[current]=root.scrollY||0;

  const save=()=>{
    if(!restoring&&current)yByView[current]=Math.max(0,root.scrollY||0);
  };
  const restore=view=>{
    if(!view)return;
    current=view;
    const y=Math.max(0,Number(yByView[view])||0);
    restoring=true;
    const apply=()=>root.scrollTo(0,y);
    root.requestAnimationFrame(()=>{
      apply();
      root.requestAnimationFrame(apply);
    });
    root.setTimeout(()=>{apply();restoring=false;},180);
  };

  root.addEventListener('scroll',save,{passive:true});

  // Capture BEFORE the app's own onclick runs, so the outgoing page keeps its Y.
  root.document?.addEventListener('click',event=>{
    const control=event.target?.closest?.('[data-view],[data-go]');
    if(!control)return;
    const target=control.dataset.view||control.dataset.go;
    if(!target||target===current)return;
    save();
    root.setTimeout(()=>restore(target),0);
  },true);

  // Also handle programmatic changes of .view.active.
  const observer=new MutationObserver(()=>{
    const next=activeView();
    if(next&&next!==current){
      save();
      restore(next);
    }
  });
  root.document?.querySelectorAll('.view').forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['class']}));
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

function init(){
  installScrollIsolation();
  installStandbyRefresh();
}
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})(typeof window==='undefined'?globalThis:window);
