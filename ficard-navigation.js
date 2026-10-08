/* Fi-Card navigation/runtime patch v0.9.180
 * Per-view scroll positions are stored before navigation and restored after the
 * destination view has actually become active.
 * GPS is refreshed after 3 minutes in background/standby.
 */
(function(root){
'use strict';

const VERSION='0.9.180';
const STANDBY_MS=3*60*1000;
const BG_KEY='ficard.nav.backgroundAt';

function activeView(){
  const el=root.document?.querySelector('.view.active');
  return el?.id?.endsWith('View')?el.id.slice(0,-4):'';
}

function installScrollIsolation(){
  // Scroll isolation now lives directly inside index.html go().
  // Keeping it in the core navigation path avoids races with iOS/WebKit
  // observers and click handlers.
  root.__ficardScrollIsolation=true;
  if('scrollRestoration' in root.history)root.history.scrollRestoration='manual';
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
