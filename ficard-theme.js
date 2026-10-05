/* FiCard appearance preferences. Card colors and barcode contrast stay independent. */
(function(root){
'use strict';
const KEY='ficard.theme.v1';
const presets=[
 {id:'original',name:'Originale',note:'Viola e turchese, sfondo attuale',accent:'#5B3DF5',second:'#2DD4BF',bg:'#F8F9FC',gradient:'linear-gradient(105deg,#F0DEFF 0%,#EAF3FF 50%,#CFFFF8 100%)',soft:'#E4FAF7',softInk:'#107C73',line:'#E7EAF0'},
 {id:'white',name:'Bianco',note:'Superfici pulite, dettagli viola',accent:'#5B3DF5',second:'#2DD4BF',bg:'#F8F9FC',gradient:'linear-gradient(120deg,#FAFAFD,#F3F6FA)',soft:'#F0EDFF',softInk:'#5333CF',line:'#E7EAF0'},
 {id:'lagoon',name:'Laguna',note:'Petrolio e turchese',accent:'#087F80',second:'#5B3DF5',bg:'#F3FAF9',gradient:'linear-gradient(120deg,#F0FAF8,#E6F4F5)',soft:'#E2F5F1',softInk:'#086A69',line:'#D6E9E6'},
 {id:'blue',name:'Blu',note:'Blu profondo e azzurro',accent:'#2453A6',second:'#289EAA',bg:'#F4F7FC',gradient:'linear-gradient(120deg,#F3F6FD,#EAF2FA)',soft:'#EAF0FC',softInk:'#2453A6',line:'#DCE5F1'},
 {id:'sand',name:'Sabbia',note:'Avorio caldo e terracotta',accent:'#925332',second:'#377F79',bg:'#FAF7F1',gradient:'linear-gradient(120deg,#FCF9F3,#F2EADF)',soft:'#F5EBDD',softInk:'#874A2C',line:'#E9DFD1'},
 {id:'lavender',name:'Lavanda',note:'Viola morbido, toni più delicati',accent:'#7050A6',second:'#639A99',bg:'#FAF8FD',gradient:'linear-gradient(120deg,#F6F0FC,#F0F5F8)',soft:'#F0EAF7',softInk:'#64428F',line:'#E6DEEF'}
];
let current='white';
function valid(id){return presets.some(p=>p.id===id)?id:'white';}
function applyDocument(doc,p){if(!doc?.documentElement)return;const s=doc.documentElement.style;const vars={'--violet':p.accent,'--violet2':p.accent,'--teal':p.second,'--bg':p.bg,'--surface':'#FFFFFF','--text':'#1F2937','--muted':'#6B7280','--line':p.line,'--theme-page':p.gradient,'--theme-soft':p.soft,'--theme-soft-ink':p.softInk};for(const [k,v]of Object.entries(vars))s.setProperty(k,v);doc.documentElement.dataset.theme=p.id;const meta=doc.querySelector('meta[name="theme-color"]');if(meta)meta.content=p.accent;}
function apply(id,persist=false){current=valid(id);const p=presets.find(p=>p.id===current);applyDocument(root.document,p);if(persist)try{root.localStorage.setItem(KEY,current);}catch{}if(root.document){for(const frame of root.document.querySelectorAll('iframe')){try{if(frame.contentWindow?.FiCardTheme)frame.contentWindow.FiCardTheme.apply(current);else applyDocument(frame.contentDocument,p);}catch{}}root.document.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===current)));}return current;}
try{current=valid(root.localStorage.getItem(KEY));}catch{}
root.FiCardTheme={presets,apply,current:()=>current};
apply(current);
root.addEventListener?.('storage',e=>{if(e.key===KEY||e.key===null)apply(e.newValue);});
})(typeof window==='undefined'?globalThis:window);
