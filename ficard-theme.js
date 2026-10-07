/* FiCard appearance preferences. Card colors and barcode contrast stay independent. */
(function(root){
'use strict';
const KEY='ficard.theme.v1';
const presets=[
 {id:'white',name:'Chiaro',accent:'#5B3DF5',second:'#2DD4BF',bg:'#F8F9FC',surface:'#FFFFFF',text:'#1F2937',muted:'#6B7280',gradient:'#FFFFFF',soft:'#F0EDFF',softInk:'#5333CF',line:'#E7EAF0'},
 {id:'dark',name:'Scuro',accent:'#AD9AFF',second:'#2DD4BF',bg:'#17181C',surface:'#23252B',text:'#F2F3F5',muted:'#ABB1BE',gradient:'#17181C',soft:'#302B43',softInk:'#C6B7FF',line:'#3B3E48'}
];
let current='white';
function valid(id){return presets.some(p=>p.id===id)?id:'white';}
function themeLabel(id){
 const key=id==='dark'?'theme.enableLight':'theme.enableDark';
 if(root.FiCardI18n?.t)return root.FiCardI18n.t(key);
 return id==='dark'?'Attiva tema chiaro':'Attiva tema scuro';
}
function applyDocument(doc,p){if(!doc?.documentElement)return;const s=doc.documentElement.style;const vars={'--violet':p.accent,'--violet2':p.accent,'--teal':p.second,'--bg':p.bg,'--surface':p.surface,'--text':p.text,'--muted':p.muted,'--line':p.line,'--theme-page':p.gradient,'--theme-soft':p.soft,'--theme-soft-ink':p.softInk};for(const [k,v]of Object.entries(vars))s.setProperty(k,v);doc.documentElement.dataset.theme=p.id;doc.documentElement.style.colorScheme=p.id==='dark'?'dark':'light';const toggle=doc.getElementById('themeBtn');if(toggle){const label=themeLabel(p.id);toggle.title=label;toggle.setAttribute('aria-label',label);toggle.setAttribute('aria-pressed',String(p.id==='dark'));toggle.innerHTML=p.id==='dark'?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/></svg>';}const meta=doc.querySelector('meta[name="theme-color"]');if(meta)meta.content=p.bg;}
function apply(id,persist=false){current=valid(id);const p=presets.find(p=>p.id===current);applyDocument(root.document,p);if(persist)try{root.localStorage.setItem(KEY,current);}catch{}if(root.document){for(const frame of root.document.querySelectorAll('iframe')){try{if(frame.contentWindow?.FiCardTheme)frame.contentWindow.FiCardTheme.apply(current);else applyDocument(frame.contentDocument,p);}catch{}}root.document.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===current)));}root.FiCardI18n?.refresh?.();return current;}
function loadI18n(){
 if(!root.document||root.FiCardI18n||root.document.querySelector('script[data-ficard-i18n]'))return;
 const script=root.document.createElement('script');
 script.src='./ficard-i18n.js?v=2.0.4';
 script.dataset.ficardI18n='1';
 script.async=true;
 (root.document.head||root.document.documentElement).appendChild(script);
}
function loadRuntime(){
 if(!root.document||root.document.querySelector('script[data-ficard-runtime]'))return;
 const script=root.document.createElement('script');
 script.src='./ficard-runtime.js?v=0.9.150';
 script.dataset.ficardRuntime='1';
 script.async=true;
 (root.document.head||root.document.documentElement).appendChild(script);
}
function loadNavigation(){
 if(!root.document||root.document.querySelector('script[data-ficard-navigation]'))return;
 const script=root.document.createElement('script');
 script.src='./ficard-navigation.js?v=0.9.150';
 script.dataset.ficardNavigation='1';
 script.async=true;
 (root.document.head||root.document.documentElement).appendChild(script);
}
try{current=valid(root.localStorage.getItem(KEY));}catch{}
root.FiCardTheme={presets,apply,current:()=>current};
apply(current);
loadI18n();
loadRuntime();
loadNavigation();
root.document?.addEventListener('DOMContentLoaded',()=>apply(current),{once:true});
root.addEventListener?.('storage',e=>{if(e.key===KEY||e.key===null)apply(e.newValue);});
})(typeof window==='undefined'?globalThis:window);
