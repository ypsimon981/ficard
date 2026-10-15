/* Fi-Card i18n v2.0
 * Reliable language switching: the selected language is persisted, then the
 * page reloads from the canonical Italian HTML before translations are applied.
 */
(function(root){
'use strict';

const STORAGE_KEY='ficard.language.v2';
const LEGACY_KEY='ficard.language.v1';
const RETURN_KEY='ficard.language.returnView';
const SUPPORTED=['it','en','fr','es','pt','nl','de'];
const LOCALES=root.FiCardLocales;
if(!LOCALES?.it||!LOCALES?.en)throw Error('Fi-Card language files were not loaded');
const table=key=>Object.fromEntries(SUPPORTED.map(lang=>[lang,LOCALES[lang][key]]));
const LANGUAGE_NAMES=table('name'),MESSAGES=table('messages'),EXACT=table('exact'),DYNAMIC=table('dynamic'),WALLET_COPY=table('wallet'),RELATIVE_COPY=table('relative'),LINKED_COPY=table('linked');
const IT_TO_KEY=new Map(Object.entries(MESSAGES.it).map(([key,value])=>[value,key]));
const TEMPLATES=Object.entries(MESSAGES.it).filter(([,value])=>/\{\w+\}/.test(value)).map(([key,value])=>{
 const names=[];
 const pattern=value.split(/(\{\w+\})/g).map(part=>{
  if(/^\{\w+\}$/.test(part)){names.push(part.slice(1,-1));return '([\\s\\S]+?)';}
  return part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 }).join('');
 return {key,names,pattern:new RegExp('^'+pattern+'$')};
});
let current=detectInitialLanguage();
let observer=null;
let applying=false;

function baseCode(code){
  const raw=String(code||'').trim().toLowerCase().replace('_','-');
  return raw.split('-')[0];
}
function normalise(code, fallback='en'){
  const b=baseCode(code);
  return SUPPORTED.includes(b)?b:fallback;
}
function detectInitialLanguage(){
  try{
    const saved=root.localStorage.getItem(STORAGE_KEY)||root.localStorage.getItem(LEGACY_KEY);
    if(saved){
      const lang=normalise(saved,'');
      if(lang)return lang;
    }
  }catch{}
  const langs=(root.navigator?.languages?.length?root.navigator.languages:[root.navigator?.language]).filter(Boolean);
  for(const code of langs){
    const b=baseCode(code);
    if(SUPPORTED.includes(b))return b;
  }
  return 'en';
}
function t(key,vars){
  let value=MESSAGES[current]?.[key] ?? MESSAGES.en?.[key] ?? MESSAGES.it?.[key] ?? key;
  if(vars&&typeof value==='string'){
    for(const [name,replacement] of Object.entries(vars))value=value.replaceAll('{'+name+'}',name==='error'?translateValue(String(replacement)):String(replacement));
  }
  return value;
}
function translateRelative(value){
  if(current==='it')return value;
  const d=DYNAMIC[current]||DYNAMIC.en;
  let s=String(value);
  let m=s.match(/^ora(.*)$/); if(m)return d.now+m[1];
  m=s.match(/^(\d+) s fa(.*)$/); if(m)return RELATIVE_COPY[current][0].replace('{n}',m[1])+m[2];
  m=s.match(/^(\d+) gg fa(.*)$/); if(m)return RELATIVE_COPY[current][1].replace('{n}',m[1])+m[2];
  m=s.match(/^(\d+) min fa(.*)$/); if(m)return d.minAgo.replace('{n}',m[1])+m[2];
  m=s.match(/^(\d+) h fa(.*)$/); if(m)return d.hourAgo.replace('{n}',m[1])+m[2];
  return s;
}
function translateDynamic(value){
  if(current==='it'||typeof value!=='string')return value;
  const d=DYNAMIC[current]||DYNAMIC.en;
  const summary=value.match(/^(.*?)(\d+ negozi · \d+ preferiti · distanze in linea d’aria\. Dati © OpenStreetMap contributors\.)$/);
  if(summary&&summary[1].trim())return translateValue(summary[1].trim())+' '+translateDynamic(summary[2]);
  let m=value.match(/^Posizione · (.+)$/);
  if(value==='Nessun punto ancora associato a questa carta. Tocca sulla mappa per aggiungerne uno.')return LINKED_COPY[current][1];
  const linked=value.match(/^(\d+) punti già associati a questa carta, indicati con il suo logo\. Il nuovo punto è trascinabile\.$/);
  if(linked)return LINKED_COPY[current][0].replace('{n}',linked[1]);
  if(m)return t('header.position')+' · '+translateRelative(m[1]);
  m=value.match(/^(\d+(?:[.,]\d+)?) (m|km) da te$/);
  if(m){const n=new Intl.NumberFormat(current,{maximumFractionDigits:m[1].includes(',')||m[1].includes('.')?1:0}).format(Number(m[1].replace(',','.')));return RELATIVE_COPY[current][2].replace('{n}',n).replace('{unit}',m[2]);}
  m=value.match(/^(\d+) negozi · (\d+) preferiti · distanze in linea d’aria\. Dati © OpenStreetMap contributors\.$/);
  if(m)return `${m[1]} ${d.stores} · ${m[2]} ${d.favorites} · ${d.distance}. ${d.data} © OpenStreetMap contributors.`;
  const exact=EXACT[current]?.[value];
  if(exact)return exact;
  const prefix='Mostro i negozi già disponibili. ';
  if(value.startsWith(prefix))return d.showing+translateValue(value.slice(prefix.length));
  return value;
}
function translateValue(value){
  if(current==='it'||typeof value!=='string')return value;
  const key=IT_TO_KEY.get(value);
  if(key)return MESSAGES[current]?.[key] ?? MESSAGES.en?.[key] ?? value;
  const dynamic=translateDynamic(value);
  if(dynamic!==value)return dynamic;
  for(const template of TEMPLATES){const match=value.match(template.pattern);if(match)return t(template.key,Object.fromEntries(template.names.map((name,i)=>[name,match[i+1]])));}
  return value;
}
function shouldSkip(node){
  const el=node?.parentElement;
  if(!el)return true;
  if(el.closest('script,style,noscript,svg,canvas,[data-i18n-skip]'))return true;
  if(el.closest('.cardAlias,.name,.brandMark,.detailLogo,.wName,.num,.previewCode,.coords,.locationBrandIcon'))return true;
  return false;
}
function translateTextNode(node){
  if(!node||node.nodeType!==3||shouldSkip(node))return;
  const raw=node.nodeValue||'';
  if(!raw.trim())return;
  const leading=raw.match(/^\s*/)?.[0]||'';
  const trailing=raw.match(/\s*$/)?.[0]||'';
  const core=raw.slice(leading.length,raw.length-trailing.length);
  const next=translateValue(core);
  if(next!==core)node.nodeValue=leading+next+trailing;
}
function translateAttribute(el,attr){
  if(!el?.hasAttribute?.(attr))return;
  const value=el.getAttribute(attr)||'';
  const next=translateValue(value);
  if(next!==value)el.setAttribute(attr,next);
}
function translateElement(el){
  if(!el||el.nodeType!==1)return;
  for(const attr of ['placeholder','title','aria-label'])translateAttribute(el,attr);
  for(const child of el.childNodes)if(child.nodeType===3)translateTextNode(child);
  for(const child of el.children)translateElement(child);
}
function updateThemeLabels(){
  const btn=root.document?.getElementById('themeBtn');
  if(!btn)return;
  const dark=root.document.documentElement.dataset.theme==='dark';
  const label=dark?t('theme.enableLight'):t('theme.enableDark');
  btn.title=label;btn.setAttribute('aria-label',label);
}
function installStyles(){
  if(root.document?.getElementById('ficardI18nStyle'))return;
  const style=root.document.createElement('style');
  style.id='ficardI18nStyle';
  style.textContent='.ficardLanguageSetting{display:grid;grid-template-columns:minmax(0,1fr) minmax(140px,180px);gap:12px;align-items:center;padding:14px 0 16px;margin:0 0 14px;border-bottom:1px solid var(--line)}.ficardLanguageCopy b{display:block;font-size:14px;color:var(--text)}.ficardLanguageCopy small{display:block;margin-top:3px;color:var(--muted);font-size:12px;line-height:1.35}.ficardLanguageSetting .field{margin:0;min-height:44px}@media(max-width:380px){.ficardLanguageSetting{grid-template-columns:1fr}.ficardLanguageSetting .field{max-width:none;width:100%}}';
  root.document.head?.appendChild(style);
}
function renderLanguageControl(){
  const panel=root.document?.querySelector('#marketSettingsBox')||root.document?.querySelector('#profileView .panel');
  if(!panel)return;
  let box=root.document.getElementById('ficardLanguageSetting');
  if(!box){
    box=root.document.createElement('div');
    box.id='ficardLanguageSetting';
    box.className='ficardLanguageSetting';
    box.innerHTML='<div class="ficardLanguageCopy"><b id="ficardLanguageTitle"></b><small id="ficardLanguageSubtitle"></small></div><select id="ficardLanguageSelect" class="field"></select>';
    const anchor=panel.querySelector('#marketCountryIntro')||panel.querySelector('.settingsFacts');
    if(anchor)panel.insertBefore(box,anchor); else panel.prepend(box);
    const select=box.querySelector('select');
    for(const lang of SUPPORTED){
      const option=root.document.createElement('option');
      option.value=lang;option.textContent=LANGUAGE_NAMES[lang];select.appendChild(option);
    }
    select.addEventListener('change',event=>setLanguage(event.target.value,true));
  }
  box.querySelector('#ficardLanguageTitle').textContent=t('language.title');
  box.querySelector('#ficardLanguageSubtitle').textContent=t('language.subtitle')+' · '+t('language.autoNote');
  const select=box.querySelector('select');select.value=current;select.setAttribute('aria-label',t('language.title'));
}
function translateDocument(){
  if(!root.document?.body)return;
  applying=true;
  try{
    root.document.documentElement.lang=current;
    if(current!=='it')translateElement(root.document.body);
    renderLanguageControl();
    updateThemeLabels();
  }finally{applying=false;}
}
function connectObserver(){
  if(observer||!root.document?.body||current==='it')return;
  observer=new MutationObserver(mutations=>{
    if(applying)return;
    applying=true;
    try{
      for(const mutation of mutations){
        if(mutation.type==='attributes')translateAttribute(mutation.target,mutation.attributeName);
        else if(mutation.type==='characterData')translateTextNode(mutation.target);
        else if(mutation.type==='childList'){
          for(const node of mutation.addedNodes){
            if(node.nodeType===3)translateTextNode(node);
            else if(node.nodeType===1)translateElement(node);
          }
        }
      }
    }finally{applying=false;}
  });
  observer.observe(root.document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});
}
function patchDialogs(){
  if(root.__ficardI18nDialogsPatched)return;
  root.__ficardI18nDialogsPatched=true;
  const a=root.alert?.bind(root),c=root.confirm?.bind(root),p=root.prompt?.bind(root);
  if(a)root.alert=message=>a(translateValue(String(message)));
  if(c)root.confirm=message=>c(translateValue(String(message)));
  if(p)root.prompt=(message,value)=>p(translateValue(String(message)),value);
}
function setLanguage(code,persist=true){
  const next=normalise(code);
  if(next===current)return current;
  if(persist){
    try{
      root.localStorage.setItem(STORAGE_KEY,next);
      root.localStorage.removeItem(LEGACY_KEY);
      root.sessionStorage.setItem(RETURN_KEY,'profile');
    }catch{}
  }
  root.location.reload();
  return next;
}
function restoreView(){
  let target='';
  try{target=root.sessionStorage.getItem(RETURN_KEY)||'';root.sessionStorage.removeItem(RETURN_KEY)}catch{}
  if(target==='profile')setTimeout(()=>root.document.querySelector('[data-view="profile"]')?.click(),80);
}
function init(){
  installStyles();
  patchDialogs();
  translateDocument();
  connectObserver();
  restoreView();
  if(root.dispatchEvent&&root.CustomEvent)root.dispatchEvent(new root.CustomEvent('ficard:languagechange',{detail:{language:current}}));
}
root.FiCardI18n={supported:[...SUPPORTED],languageNames:{...LANGUAGE_NAMES},messages:MESSAGES,t,language:()=>current,setLanguage,refresh:translateDocument,translateText:value=>translateValue(String(value??''))};
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
root.addEventListener?.('storage',event=>{if((event.key===STORAGE_KEY||event.key===LEGACY_KEY)&&event.newValue&&normalise(event.newValue)!==current)root.location.reload();});
})(typeof window==='undefined'?globalThis:window);
