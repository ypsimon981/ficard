/* Shared language files, dynamic translations and preserved product data. */
(function(root){
'use strict';
const SUPPORTED=['it','en','fr','es','pt','nl','de'],STORE='ficard.language.v2';
const normalize=value=>String(value||'').replace(/\s+/g,' ').trim();
const dictionaries=Object.fromEntries(SUPPORTED.map(language=>{
 const locale=root.FiCardLocales?.[language],it=root.FiCardLocales?.it;
 if(!locale||!it)throw Error('ScanDixit language file missing: '+language);
 const map={};
 for(const [key,source]of Object.entries(it.messages))map[normalize(source)]=locale.messages[key];
 for(const [source,value]of Object.entries(locale.scan))map[normalize(source)]=value;
 return [language,map];
}));
const canonical=new Map();
for(const dictionary of Object.values(dictionaries))for(const [source,translated]of Object.entries(dictionary))if(!canonical.has(normalize(translated)))canonical.set(normalize(translated),source);
function language(){
 let selected=root.FiCardI18n?.language?.();
 if(!selected)try{selected=root.parent!==root?root.parent?.FiCardI18n?.language?.():''}catch{}
 if(!selected)try{selected=root.localStorage.getItem(STORE)||root.localStorage.getItem('ficard.language.v1')}catch{}
 const choices=selected?[selected]:(root.navigator?.languages||[root.navigator?.language]);
 for(const choice of choices){const lang=String(choice||'').toLowerCase().replace('_','-').split('-')[0];if(SUPPORTED.includes(lang))return lang;}
 return 'en';
}
function tr(source,vars){
 const key=normalize(source),original=dictionaries.it[key]!==undefined?key:canonical.get(key)||key;
 let text=dictionaries[language()][original]??String(source);
 if(vars)for(const [key,value]of Object.entries(vars))text=text.replaceAll('{'+key+'}',String(value));
 return text;
}
const originals=new WeakMap(),attributes=new WeakMap();let observer;
function skip(node){return !!node?.parentElement?.closest('script,style,noscript,svg,canvas,[data-i18n-skip],#resultCode,#ocrText,.savedProductOpen,.spec b,#sheetTitle,#sheetBrand,#sheetDescription');}
function textNode(node){
 if(node?.nodeType!==3||skip(node))return;
 const raw=node.nodeValue||'',old=originals.get(node),source=old&&raw===old.last?old.source:raw;
 const leading=source.match(/^\s*/)[0],trailing=source.match(/\s*$/)[0],core=source.trim();if(!core)return;
 const next=leading+tr(core)+trailing;originals.set(node,{source,last:next});if(raw!==next)node.nodeValue=next;
}
function attribute(el,name){
 if(!el.hasAttribute?.(name))return;const raw=el.getAttribute(name),saved=attributes.get(el)||{},old=saved[name],source=old&&raw===old.last?old.source:raw,next=tr(source);
 saved[name]={source,last:next};attributes.set(el,saved);if(raw!==next)el.setAttribute(name,next);
}
function element(el){
 if(el?.nodeType!==1||el.matches?.('script,style,noscript,svg,canvas,[data-i18n-skip]'))return;
 for(const name of ['placeholder','aria-label','title'])attribute(el,name);
 for(const child of el.childNodes||[])if(child.nodeType===3)textNode(child);
 for(const child of el.children||[])element(child);
}
function refresh(){if(root.document?.body){root.document.documentElement.lang=language();element(root.document.body)}}
function init(){
 refresh();
 if(root.MutationObserver&&root.document?.body){observer=new root.MutationObserver(changes=>{
  for(const change of changes){if(change.type==='characterData')textNode(change.target);else if(change.type==='attributes')attribute(change.target,change.attributeName);else for(const node of change.addedNodes||[])node.nodeType===3?textNode(node):element(node);}
 });observer.observe(root.document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});}
 for(const name of ['alert','confirm','prompt']){const original=root[name]?.bind(root);if(original)root[name]=(message,...args)=>original(tr(message),...args);}
}
root.ScanDixitI18n={t:tr,translateText:tr,language,refresh};
root.addEventListener?.('ficard:languagechange',()=>{refresh();root.ScanDixitSaved?.render();});
root.addEventListener?.('storage',event=>{if(event.key===STORE){refresh();root.ScanDixitSaved?.render();}});
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof window==='undefined'?globalThis:window);
