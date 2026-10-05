/* ScanDixit: barcode first, bounded local OCR fallback, explicit OCR confirmation. */
(function(root){
'use strict';
const reader=root.FiCardReader||(typeof require==='function'?require('./ficard-reader.js'):null);
const {validGTIN,expandUPCE,canvasFrom,bandCrop}=reader;
function normalizeBarcode(value,format=''){return reader.readBarcode(value,format)?.code||null;}
function ocrCodes(text){
 const found=new Set();
 // Never join separate lines, substitute letters, or invent a check digit.
 for(const line of String(text).split(/\r?\n/))for(const match of line.matchAll(/(?:^|[^\p{L}\p{N}])([0-9](?:[0-9 \t]*[0-9])?)(?![\p{L}\p{N}])/gu)){
  const code=match[1].replace(/[ \t]/g,'');if(validGTIN(code))found.add(code);
 }
 return [...found];
}
function consensus(maxGap=6000){let last='',count=0,time=0;return (code,now=Date.now())=>{count=code===last&&now-time<maxGap?count+1:1;last=code;time=now;return count>=2;};}
function initialZoom(caps){
 const min=Number(caps.min),max=Number(caps.max),step=Number(caps.step)||.1;
 const target=Math.min(max,Math.max(min,3));
 return Math.min(max,Math.max(min,min+Math.round((target-min)/step)*step));
}
const api={initialZoom,validGTIN,expandUPCE,normalizeBarcode,ocrCodes,consensus};
if(typeof module!=='undefined')module.exports=api;
root.ScanDixit=api;
if(typeof document==='undefined')return;
const $=id=>document.getElementById(id);
let camera=null,starting=null,epoch=0,live=false,photoBusy=false,timer,worker=null,loading=null,ocrBusy=false,finishing=false;
let barcodeVote=consensus(),ocrVote=consensus(30000),lastOcr=0,ocrUnavailable=false;
const status=msg=>{$('scanStatus').textContent=msg;};
function timeout(promise,ms){let t;return Promise.race([promise,new Promise((_,reject)=>{t=setTimeout(()=>reject(Error('Tempo scaduto')),ms);})]).finally(()=>clearTimeout(t));}
async function getWorker(){
 if(worker)return worker;if(loading)return loading;
 loading=(async()=>{
  if(!window.Tesseract)await new Promise((resolve,reject)=>{
   const s=document.createElement('script');const t=setTimeout(()=>{s.remove();reject(Error('Download OCR scaduto'));},20000);
   s.src='https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';s.onload=()=>{clearTimeout(t);resolve();};s.onerror=()=>{clearTimeout(t);s.remove();reject(Error('Download OCR fallito'));};document.head.append(s);
  });
  let expired=false;
  const pending=Tesseract.createWorker('eng',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0',langPath:'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int'});
  pending.then(w=>{if(expired)w.terminate();},()=>{});
  try{worker=await timeout(pending,45000);}catch(e){expired=true;throw e;}
  return worker;
 })();try{return await loading;}finally{loading=null;}
}
async function recognize(canvas){
 if(ocrBusy)return null;ocrBusy=true;
 try{const w=await getWorker();await w.setParameters({tessedit_pageseg_mode:'11',tessedit_char_whitelist:'',preserve_interword_spaces:'1'});return (await timeout(w.recognize(canvas,{rotateAuto:true}),20000)).data;}
 catch(e){const old=worker;worker=null;if(old)await old.terminate().catch(()=>{});throw e;}finally{ocrBusy=false;}
}
function resetCandidate(){$('ocrCandidates').replaceChildren();$('ocrConfirm').hidden=true;}
function offerCodes(codes){
 resetCandidate();$('ocrConfirm').hidden=false;
 for(const code of codes){const b=document.createElement('button');b.className='secondary';b.textContent='Conferma '+code;b.onclick=async()=>{await stop();resetCandidate();$('codeInput').value=code;showCode(code,'ocr-code');};$('ocrCandidates').append(b);}
}
async function accept(code,token,format=''){if(token!==epoch||finishing)return;finishing=true;await stop();$('codeInput').value=code;resetCandidate();showCode(code,'barcode',format);status(reader.readBarcode(code,format)?.productCode?'Codice prodotto letto e verificato.':'Codice letto · '+format+'.');finishing=false;}
let bridgeFrame=null,bridgeRequest='';
function closeFiCardReader(){if(bridgeFrame){bridgeFrame.remove();bridgeFrame=null;bridgeRequest='';document.body.style.overflow='';}}
function start(){
 if(photoBusy||bridgeFrame)return;
 $('codeResult').classList.remove('show');resetCandidate();
 bridgeRequest=crypto.randomUUID();bridgeFrame=document.createElement('iframe');
 bridgeFrame.title='Lettore FiCard';bridgeFrame.allow='camera';
 bridgeFrame.style.cssText='position:fixed;inset:0;width:100%;height:100dvh;border:0;z-index:1000;background:#F8F9FC';
 bridgeFrame.src='./?scanner=scandixit&request='+encodeURIComponent(bridgeRequest)+'&reader=1.1.0';
 document.body.style.overflow='hidden';document.body.append(bridgeFrame);
 status('Lettore FiCard aperto.');
}
window.addEventListener('message',event=>{
 if(!bridgeFrame||event.origin!==location.origin||event.source!==bridgeFrame.contentWindow||event.data?.request!==bridgeRequest)return;
 if(event.data.type==='ficard.scan.cancel'){closeFiCardReader();status('Fotocamera chiusa.');return;}
 if(event.data.type!=='ficard.scan.result')return;
 const item=reader.readBarcode(event.data.code,event.data.format);if(!item)return;
 closeFiCardReader();$('codeInput').value=item.code;showCode(item.code,'barcode',item.format);status('Codice letto dal lettore FiCard.');
});
async function stop(){
 closeFiCardReader();
 ++epoch;live=false;clearTimeout(timer);const pending=starting,current=camera;camera=null;
 if(pending)await pending.catch(()=>{});
 if(current){try{if(current.isScanning)await current.stop();}catch(e){}try{current.clear();}catch(e){}}
 $('scanFrame').classList.remove('show');$('startCamera').disabled=photoBusy;$('stopCamera').hidden=true;$('torch').hidden=true;$('zoomControl').hidden=true;
}
async function fromFile(file,label=false){
 if(!file||photoBusy)return;photoBusy=true;await stop();const token=epoch;$('codeResult').classList.remove('show');resetCandidate();$('cancelScan').hidden=false;$('barcodePhoto').disabled=$('labelPhoto').disabled=true;status('Analizzo la foto: prima le barre, poi le cifre…');$('ocrStatus').textContent='Analisi in corso…';
 const url=URL.createObjectURL(file);let decoder;
 try{const img=new Image();img.src=url;await img.decode();if(token!==epoch)return;const original=canvasFrom(img);decoder=reader.createDecoder('photoReader');
  try{const found=await reader.scanFile(decoder,file,()=>token===epoch);if(token!==epoch)return;
   if(found?.ambiguous){status('Più barcode nella foto: ritaglia il prodotto desiderato e riprova.');return;}
   if(found?.code){await accept(found.code,token,found.format);$('ocrStatus').textContent='Barcode letto nella foto.';return;}
  }catch(e){if(token!==epoch)return;}
  status('Barre non decodificate. Leggo le cifre e il testo…');
  let bestText='',bestConfidence=-1;const codes=new Set();
  for(const angle of [0,90,180,270]){
   if(token!==epoch)return;const rotated=canvasFrom(original,angle),band=bandCrop(rotated);const variants=band?[canvasFrom(rotated,0,band,false,1800),rotated]:[rotated];
   for(const c of variants){if(token!==epoch)return;while(ocrBusy){await new Promise(r=>setTimeout(r,100));if(token!==epoch)return;}const result=await recognize(c);if(token!==epoch)return;if(result&&result.confidence>bestConfidence){bestText=result.text.trim();bestConfidence=result.confidence;}ocrCodes(result?.text).forEach(code=>codes.add(code));}
   if(codes.size)break;
  }
  $('ocrText').value=bestText;
  if(codes.size){offerCodes([...codes]);status('Cifre recuperate con OCR. Verifica e conferma il codice.');$('ocrStatus').textContent='Codice possibile trovato: confermalo sotto lo scanner.';}
  else{status('Nessun codice valido trovato. Prova una foto più nitida o inserisci le cifre.');$('ocrStatus').textContent=bestText?'Testo letto: verifica marca e modello prima di cercare.':'Nessun testo leggibile: riprova con una foto più nitida.';if(label)setTab('ocr');}
 }catch(e){if(token===epoch){status('Lettura non riuscita: riprova con una foto JPEG/PNG o inserisci il codice.');$('ocrStatus').textContent='OCR non disponibile o immagine non leggibile. Puoi inserire il testo a mano.';}}
 finally{URL.revokeObjectURL(url);try{decoder?.clear();}catch(e){}photoBusy=false;$('startCamera').disabled=false;$('barcodePhoto').disabled=$('labelPhoto').disabled=false;$('cancelScan').hidden=true;}
}
$('startCamera').addEventListener('click',start);$('stopCamera').addEventListener('click',()=>{stop();resetCandidate();status('Fotocamera chiusa.');});
$('cancelScan').addEventListener('click',()=>{stop();resetCandidate();status('Analisi annullata.');});
for(const id of ['barcodePhoto','labelPhoto'])$(id).addEventListener('change',e=>{const f=e.target.files?.[0];e.target.value='';fromFile(f,id==='labelPhoto');});
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{stop();resetCandidate();}));
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
window.addEventListener('pagehide',()=>{stop();const old=worker;worker=null;if(old)old.terminate().catch(()=>{});});
})(typeof window==='undefined'?globalThis:window);

