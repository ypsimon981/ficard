/* Fi-Card runtime v0.9.147 */
(function(root){
'use strict';
const VERSION='0.9.147';
const LANGUAGE_KEY='ficard.language.v2';
const LEGACY_LANGUAGE_KEY='ficard.language.v1';
const RETURN_VIEW_KEY='ficard.language.returnView';
const FALLBACK_LANG='en';
const AUTO_LABELS={it:'Automatico',en:'Automatic',fr:'Automatique',es:'Automático',pt:'Automático',nl:'Automatisch',de:'Automatisch'};
function supportedLanguages(){return root.FiCardI18n?.supported?.length?root.FiCardI18n.supported:['it','en','fr','es','pt','nl','de'];}
function baseLanguage(code){return String(code||'').trim().toLowerCase().replace('_','-').split('-')[0];}
function normaliseLanguage(code){const base=baseLanguage(code),supported=supportedLanguages();return supported.includes(base)?base:FALLBACK_LANG;}
function detectedDeviceLanguage(){const supported=supportedLanguages();const languages=(root.navigator?.languages?.length?root.navigator.languages:[root.navigator?.language]).filter(Boolean);for(const code of languages){const base=baseLanguage(code);if(supported.includes(base))return base;}return FALLBACK_LANG;}
function savedManualLanguage(){try{const value=root.localStorage.getItem(LANGUAGE_KEY)||root.localStorage.getItem(LEGACY_LANGUAGE_KEY)||'';return value?normaliseLanguage(value):'';}catch{return '';}}
function automaticOptionLabel(){const current=root.FiCardI18n?.language?.()||detectedDeviceLanguage();const auto=AUTO_LABELS[current]||AUTO_LABELS.en;const languageName=root.FiCardI18n?.languageNames?.[current]||current.toUpperCase();return auto+' ('+languageName+')';}
function enhanceLanguageControl(){const select=root.document?.getElementById('ficardLanguageSelect');if(!select)return false;let option=select.querySelector('option[value="auto"]');if(!option){option=root.document.createElement('option');option.value='auto';select.insertBefore(option,select.firstChild);}option.textContent=automaticOptionLabel();const manual=savedManualLanguage();select.value=manual||'auto';return true;}
function changeLanguage(event){const select=event.target;if(!select||select.id!=='ficardLanguageSelect')return;const choice=String(select.value||'auto');try{if(choice==='auto'){root.localStorage.removeItem(LANGUAGE_KEY);root.localStorage.removeItem(LEGACY_LANGUAGE_KEY);}else{root.localStorage.setItem(LANGUAGE_KEY,normaliseLanguage(choice));root.localStorage.removeItem(LEGACY_LANGUAGE_KEY);}root.sessionStorage.setItem(RETURN_VIEW_KEY,'profile');}catch{}root.location.reload();}
function installAutomaticLanguage(){if(root.__ficardAutomaticLanguageInstalled)return;root.__ficardAutomaticLanguageInstalled=true;root.document?.addEventListener('change',changeLanguage,true);let attempts=0;const timer=root.setInterval(()=>{attempts++;if(enhanceLanguageControl()||attempts>80)root.clearInterval(timer);},50);root.addEventListener?.('ficard:languagechange',()=>root.setTimeout(enhanceLanguageControl,0));}
function forceVersion(){const release=root.document?.querySelector('.release');if(!release)return false;const next=release.textContent.replace(/v\d+\.\d+\.\d+/,'v'+VERSION);if(release.textContent!==next)release.textContent=next;return true;}
function installVersionSync(){let attempts=0;const timer=root.setInterval(()=>{attempts++;if(forceVersion()||attempts>80)root.clearInterval(timer);},50);const observer=new MutationObserver(()=>forceVersion());const attach=()=>{const release=root.document?.querySelector('.release');if(release)observer.observe(release,{childList:true,characterData:true,subtree:true});else root.setTimeout(attach,100);};attach();}
function init(){installAutomaticLanguage();installVersionSync();}
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof window==='undefined'?globalThis:window);
