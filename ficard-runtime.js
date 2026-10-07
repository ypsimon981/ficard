/* Fi-Card runtime fixes v0.9.140
 * - Automatic language mode based on device language
 * - Independent scroll position for each bottom-navigation view
 * - Visible build version sync
 */
(function(root){
'use strict';

const VERSION='0.9.140';
const LANGUAGE_KEY='ficard.language.v2';
const LEGACY_LANGUAGE_KEY='ficard.language.v1';
const RETURN_VIEW_KEY='ficard.language.returnView';
const FALLBACK_LANG='en';
const AUTO_LABELS={
  it:'Automatico',
  en:'Automatic',
  fr:'Automatique',
  es:'Automático',
  pt:'Automático',
  nl:'Automatisch',
  de:'Automatisch'
};

function supportedLanguages(){
  return root.FiCardI18n?.supported?.length ? root.FiCardI18n.supported : ['it','en','fr','es','pt','nl','de'];
}
function baseLanguage(code){
  return String(code||'').trim().toLowerCase().replace('_','-').split('-')[0];
}
function normaliseLanguage(code){
  const base=baseLanguage(code),supported=supportedLanguages();
  return supported.includes(base)?base:FALLBACK_LANG;
}
function detectedDeviceLanguage(){
  const supported=supportedLanguages();
  const languages=(root.navigator?.languages?.length?root.navigator.languages:[root.navigator?.language]).filter(Boolean);
  for(const code of languages){
    const base=baseLanguage(code);
    if(supported.includes(base))return base;
  }
  return FALLBACK_LANG;
}
function savedManualLanguage(){
  try{
    const value=root.localStorage.getItem(LANGUAGE_KEY)||root.localStorage.getItem(LEGACY_LANGUAGE_KEY)||'';
    return value?normaliseLanguage(value):'';
  }catch{return '';}
}
function isAutomaticLanguage(){return !savedManualLanguage();}

function automaticOptionLabel(){
  const current=root.FiCardI18n?.language?.()||detectedDeviceLanguage();
  const auto=AUTO_LABELS[current]||AUTO_LABELS.en;
  const languageName=root.FiCardI18n?.languageNames?.[current]||current.toUpperCase();
  return auto+' ('+languageName+')';
}
function enhanceLanguageControl(){
  const select=root.document?.getElementById('ficardLanguageSelect');
  if(!select)return false;
  let option=select.querySelector('option[value="auto"]');
  if(!option){
    option=root.document.createElement('option');
    option.value='auto';
    select.insertBefore(option,select.firstChild);
  }
  option.textContent=automaticOptionLabel();
  select.value=isAutomaticLanguage()?'auto':savedManualLanguage();
  return true;
}
function changeLanguage(event){
  const select=event.target;
  if(!select||select.id!=='ficardLanguageSelect')return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const choice=String(select.value||'auto');
  try{
    if(choice==='auto'){
      root.localStorage.removeItem(LANGUAGE_KEY);
      root.localStorage.removeItem(LEGACY_LANGUAGE_KEY);
    }else{
      root.localStorage.setItem(LANGUAGE_KEY,normaliseLanguage(choice));
      root.localStorage.removeItem(LEGACY_LANGUAGE_KEY);
    }
    root.sessionStorage.setItem(RETURN_VIEW_KEY,'profile');
  }catch{}
  root.location.reload();
}
function installAutomaticLanguage(){
  if(root.__ficardAutomaticLanguageInstalled)return;
  root.__ficardAutomaticLanguageInstalled=true;
  root.document?.addEventListener('change',changeLanguage,true);
  let attempts=0;
  const timer=root.setInterval(()=>{
    attempts++;
    if(enhanceLanguageControl()||attempts>80)root.clearInterval(timer);
  },50);
  root.addEventListener?.('ficard:languagechange',()=>root.setTimeout(enhanceLanguageControl,0));
}

function activeViewName(){
  const active=root.document?.querySelector('.view.active');
  return active?.id?.endsWith('View')?active.id.slice(0,-4):'';
}
function installIndependentViewScroll(){
  if(root.__ficardIndependentScrollInstalled)return;
  if(typeof root.go!=='function'){
    root.setTimeout(installIndependentViewScroll,50);
    return;
  }
  root.__ficardIndependentScrollInstalled=true;
  if('scrollRestoration' in root.history)root.history.scrollRestoration='manual';
  const positions=Object.create(null);
  const originalGo=root.go;
  let switching=false;
  const first=activeViewName();
  if(first)positions[first]=root.scrollY||0;

  function restore(view){
    const y=Math.max(0,Number(positions[view])||0);
    const apply=()=>root.scrollTo({top:y,left:0,behavior:'auto'});
    root.requestAnimationFrame(()=>{
      apply();
      root.requestAnimationFrame(apply);
    });
    root.setTimeout(()=>{apply();switching=false;},120);
  }

  root.addEventListener('scroll',()=>{
    if(switching)return;
    const view=activeViewName();
    if(view)positions[view]=root.scrollY||0;
  },{passive:true});

  root.go=function(view){
    const current=activeViewName();
    if(current)positions[current]=root.scrollY||0;
    switching=true;
    const result=originalGo.apply(this,arguments);
    restore(view);
    return result;
  };
}

function forceVersion(){
  const release=root.document?.querySelector('.release');
  if(!release)return false;
  const next=release.textContent.replace(/v\d+\.\d+\.\d+/,'v'+VERSION);
  if(release.textContent!==next)release.textContent=next;
  return true;
}
function installVersionSync(){
  let attempts=0;
  const timer=root.setInterval(()=>{
    attempts++;
    if(forceVersion()||attempts>80)root.clearInterval(timer);
  },50);
  const observer=new MutationObserver(()=>forceVersion());
  const watch=()=>{
    const release=root.document?.querySelector('.release');
    if(release)observer.observe(release,{childList:true,characterData:true,subtree:true});
    else root.setTimeout(watch,100);
  };
  watch();
}

function init(){
  installAutomaticLanguage();
  installIndependentViewScroll();
  installVersionSync();
}

if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})(typeof window==='undefined'?globalThis:window);
