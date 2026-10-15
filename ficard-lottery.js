/* Fi-Card 0.9.221 — personal receipt-lottery code; never included in card-set exports. */
(function(root){
'use strict';
const KEY='ficard.personal.receipt-lottery.v1';
const words={
 it:{title:'Lotteria degli scontrini',add:'Aggiungi lotteria degli scontrini',edit:'Modifica codice lotteria',hint:'Salva il tuo codice. Comparirà tra le prime carte e sotto ogni tessera fedeltà.',reminder:'Ricorda il codice lotteria',sub:'Se il negozio aderisce, mostralo prima del pagamento.',open:'Mostra codice',code:'Codice lotteria',format:'Formato',scan:'Scansiona codice',save:'Salva codice',remove:'Elimina codice',privacy:'Codice personale: non viene condiviso nei set di carte né nei backup JSON.',saved:'Codice salvato sul dispositivo',removed:'Codice eliminato',invalid:'Inserisci un codice valido',confirm:'Eliminare il codice lotteria salvato?',scanner:'Fotocamera non disponibile. Inserisci il codice manualmente.',health:'Tessera sanitaria',healthInfo:'In futuro potrai aggiungerla qui e richiamarla in farmacia. Funzione non ancora attiva.',healthSoon:'In preparazione',back:'Torna alla carta',close:'Chiudi'},
 en:{title:'Receipt lottery',add:'Add receipt lottery code',edit:'Edit lottery code',hint:'Save your code. It will appear at the top of your cards and beneath each loyalty card.',reminder:'Remember your lottery code',sub:'If the store participates, show it before paying.',open:'Show code',code:'Lottery code',format:'Format',scan:'Scan code',save:'Save code',remove:'Delete code',privacy:'Personal code: excluded from shared card sets and JSON backups.',saved:'Code saved on this device',removed:'Code deleted',invalid:'Enter a valid code',confirm:'Delete your saved lottery code?',scanner:'Camera unavailable. Enter the code manually.',health:'Health card',healthInfo:'In the future you can add it here and access it at pharmacies. Not yet available.',healthSoon:'Coming later',back:'Back to card',close:'Close'}
};
function t(k){let lang=root.FiCardI18n?.language?.()||'it';return (words[String(lang).split('-')[0]]||words.en)[k]||words.it[k]}
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function read(){try{const data=JSON.parse(root.localStorage.getItem(KEY)||'null');if(data&&typeof data.code==='string'&&data.code.length>0&&data.code.length<=4096)return {code:data.code,format:typeof data.format==='string'?data.format:'CODE128'};}catch{}return null}
function save(value){try{root.localStorage.setItem(KEY,JSON.stringify(value));return true}catch{return false}}
const LOGO='./logos-hq/lotteria-approved.png';
function tileHtml(){if(!read())return '';return '<div class="card cardItem walletDark lotteryTile" data-brand="lotteria" style="--card-color:#07549A;--card-ink:#FFFFFF"><button class="cardOpen" type="button" data-lottery-open aria-label="'+esc(t('open')+' · '+t('title'))+'"><span class="brandMark" aria-hidden="true"><img class="brandLogo" src="'+LOGO+'" alt=""></span><div class="name">'+esc(t('title'))+'</div></button></div>'}
function bannerHtml(){if(!read())return '';return '<button type="button" class="lotteryReminder" data-lottery-open aria-label="'+esc(t('open')+' · '+t('title'))+'"><img class="lotteryReminderLogo" src="'+LOGO+'" alt="Lotteria degli scontrini"><span class="lotteryReminderCopy"><strong>'+esc(t('reminder'))+'</strong><small>'+esc(t('sub'))+'</small></span><span class="lotteryReminderArrow" aria-hidden="true">›</span></button>'}
let scanner=null,scanning=false;
async function stop(){const d=scanner;scanner=null;scanning=false;const el=root.document.getElementById('lotteryReader');if(el)el.hidden=true;if(d){try{await d.stop()}catch{}try{await d.clear()}catch{}}}
function close(){
 stop();
 root.document.getElementById('lotteryModal')?.classList.remove('show','lotteryViewing');
 root.document.getElementById('detailModal')?.classList.remove('lotteryBehind');
}
function showEditor(){
 const modal=root.document.getElementById('lotteryModal');if(!modal)return;
 const c=read();root.document.getElementById('lotteryHeading').textContent=c?t('edit'):t('add');
 root.document.getElementById('lotteryEditor').hidden=false;
 root.document.getElementById('lotteryViewer').hidden=true;
 root.document.getElementById('lotteryCode').value=c?.code||'';
 root.document.getElementById('lotteryFormat').value=c?.format||'CODE128';
 root.document.getElementById('lotteryRemove').hidden=!c;
 modal.classList.remove('lotteryViewing');
 if(root.document.getElementById('detailModal')?.classList.contains('show'))root.document.getElementById('detailModal').classList.add('lotteryBehind');
 modal.classList.add('show');
}
function showCode(){
 const c=read();if(!c){showEditor();return}
 const modal=root.document.getElementById('lotteryModal');if(!modal)return;
 root.document.getElementById('lotteryHeading').textContent=t('title');
 root.document.getElementById('lotteryEditor').hidden=true;
 root.document.getElementById('lotteryViewer').hidden=false;
 root.document.getElementById('lotteryNum').textContent=c.code;
 root.drawBarcode?.('lotteryCanvas',c);
 modal.classList.add('lotteryViewing');
 if(root.document.getElementById('detailModal')?.classList.contains('show'))root.document.getElementById('detailModal').classList.add('lotteryBehind');
 modal.classList.add('show');
}
function refresh(){const button=root.document.getElementById('lotterySettingsAdd');if(button)button.textContent=read()?t('edit'):t('add');root.renderCards?.();}
function isLotteryCard(c){return !!c&&(String(c.brandKey||'').toLowerCase()==='lotteria'||/^lotteria\s+degli\s+scontrini$/i.test(String(c.name||'').trim()))}
function isDemo(c){return /^FICARD-DEMO-/i.test(String(c?.code||''))}
function store(code,format){const value=String(code||'').trim();if(!value||value.length>4096)return false;const ok=save({code:value,format:format||'CODE128'});if(ok)refresh();return ok}
function migrateLegacy(collection){
 if(!Array.isArray(collection))return [];
 const personal=collection.filter(c=>isLotteryCard(c)&&!isDemo(c));
 if(!personal.length||read())return [];
 // Migrate only when persistence succeeded; never silently delete an existing different code.
 const c=personal[0];if(!store(c.code,c.format))return [];
 return [c.id];
}
function init(){
 const d=root.document;if(!d.getElementById('lotteryModal'))return;
 d.getElementById('lotterySettingsAdd')?.addEventListener('click',showEditor);
 d.getElementById('lotteryAddFromCard')?.addEventListener('click',()=>{root.hideModal?.('addModal');showEditor()});
 d.addEventListener('click',e=>{if(e.target.closest('[data-lottery-open]')){e.preventDefault();showCode()}});
 d.getElementById('lotteryClose').onclick=close;
 d.getElementById('lotteryModal').addEventListener('click',e=>{if(e.target.id==='lotteryModal')close()});
 d.getElementById('lotteryEdit').onclick=showEditor;
 d.getElementById('lotterySave').onclick=()=>{
  const code=d.getElementById('lotteryCode').value.trim(),format=d.getElementById('lotteryFormat').value;
  if(!code||code.length>4096){root.toast?.(t('invalid'));return}
  if(!store(code,format)){root.toast?.('Salvataggio non riuscito');return}
  stop();root.toast?.(t('saved'));showCode();
 };
 d.getElementById('lotteryRemove').onclick=()=>{if(!root.confirm(t('confirm')))return;try{root.localStorage.removeItem(KEY)}catch{}close();refresh();root.toast?.(t('removed'))};
 d.getElementById('lotteryScan').onclick=async()=>{
  if(scanning)return;scanning=true;
  try{
   if(!root.Html5Qrcode||!root.FiCardReader)throw Error('scanner unavailable');
   d.getElementById('lotteryReader').hidden=false;
   scanner=root.FiCardReader.createDecoder('lotteryReader');
   await root.FiCardReader.startLive(scanner,(value,result)=>{
    d.getElementById('lotteryCode').value=value;
    const f=root.normalizeFormat?.(root.FiCardReader.formatName(result));
    if(['QR_CODE','CODE128','EAN13','EAN8','CODE39','DATA_MATRIX'].includes(f))d.getElementById('lotteryFormat').value=f;
    stop();
   });
  }catch{await stop();root.toast?.(t('scanner'))}
 };
 refresh();
}
root.FiCardLottery={read,tileHtml,bannerHtml,showEditor,showCode,store,isLotteryCard,isDemo,migrateLegacy,clear:()=>{try{root.localStorage.removeItem(KEY)}catch{}}};
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
