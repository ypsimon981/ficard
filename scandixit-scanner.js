/* ScanDixit: barcode first, bounded local OCR fallback, explicit OCR confirmation. */
(function(root){
'use strict';
function validGTIN(code){
 if(!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)||/^(\d)\1+$/.test(code))return false;
 let sum=0;for(let i=code.length-2,weight=3;i>=0;i--,weight=4-weight)sum+=Number(code[i])*weight;
 return (10-sum%10)%10===Number(code.at(-1));
}
function expandUPCE(code){
 if(!/^[01]\d{7}$/.test(code))return null;
 const [n,a,b,c,d,e,f,k]=code;
 const body=Number(f)<=2?n+a+b+f+'0000'+c+d+e:f==='3'?n+a+b+c+'00000'+d+e:f==='4'?n+a+b+c+d+'00000'+e:n+a+b+c+d+e+'0000'+f;
 return validGTIN(body+k)?body+k:null;
}
function normalizeBarcode(value,format=''){
 const code=String(value||'').replace(/\s/g,'');
 if(/UPC[_ -]?E/i.test(format))return expandUPCE(code);
 return validGTIN(code)?code:null;
}
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
let camera=null,starting=null,epoch=0,live=false,photoBusy=false,timer,worker=null,loading=null,ocrBusy=false,nativePromise=null,finishing=false;
let cropPass=0,decoderSerial=0;
let barcodeVote=consensus(),ocrVote=consensus(30000),lastOcr=0,ocrUnavailable=false;
const status=msg=>{$('scanStatus').textContent=msg;};
const options=()=>({formatsToSupport:['EAN_13','EAN_8','UPC_A','UPC_E'].map(k=>Html5QrcodeSupportedFormats[k]),useBarCodeDetectorIfSupported:false,verbose:false});
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
async function nativeDetector(){
 if(!nativePromise)nativePromise=(async()=>{try{if(!window.BarcodeDetector)return null;const supported=await BarcodeDetector.getSupportedFormats();const formats=['ean_13','ean_8','upc_a','upc_e'].filter(f=>supported.includes(f));return formats.length?new BarcodeDetector({formats}):null;}catch(e){return null;}})();return nativePromise;
}
function canvasFrom(source,angle=0,crop=null,contrast=false,max=1800){
 const sw=source.videoWidth||source.naturalWidth||source.width,sh=source.videoHeight||source.naturalHeight||source.height;
 const r=crop||{x:0,y:0,w:sw,h:sh},rad=angle*Math.PI/180;
 const width=Math.ceil(Math.abs(r.w*Math.cos(rad))+Math.abs(r.h*Math.sin(rad))),height=Math.ceil(Math.abs(r.w*Math.sin(rad))+Math.abs(r.h*Math.cos(rad)));
 const scale=Math.min(2,max/Math.max(width,height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(width*scale));c.height=Math.max(1,Math.round(height*scale));
 const ctx=c.getContext('2d',{willReadFrequently:true});ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.translate(c.width/2,c.height/2);ctx.rotate(rad);ctx.drawImage(source,r.x,r.y,r.w,r.h,-r.w*scale/2,-r.h*scale/2,r.w*scale,r.h*scale);
 if(contrast){const p=ctx.getImageData(0,0,c.width,c.height);for(let i=0;i<p.data.length;i+=4){const v=(p.data[i]*.299+p.data[i+1]*.587+p.data[i+2]*.114-128)*1.65+128;p.data[i]=p.data[i+1]=p.data[i+2]=v;}ctx.putImageData(p,0,0);}return c;
}
function bandCrop(c){
 const w=c.width,h=c.height,ctx=c.getContext('2d',{willReadFrequently:true}),data=ctx.getImageData(0,0,w,h).data;
 let start=-1,best=null;
 for(let y=0;y<h;y+=3){let changes=0,last=-1,left=w,right=0;
  for(let x=0;x<w;x+=2){let i=(y*w+x)*4,v=(data[i]+data[i+1]+data[i+2])/3;const bit=v<100?0:v>190?1:-1;if(bit>=0){if(last>=0&&bit!==last){changes++;left=Math.min(left,x);right=x;}last=bit;}}
  if(changes>=35){if(!best||changes>best.score)best={score:changes,y,left,right};if(start<0)start=y;}
 }
 if(!best)return null;
 // Include quiet zones and the human-readable digits below the bars.
 return {x:Math.max(0,best.left-40),y:Math.max(0,best.y-h*.12),w:Math.min(w,best.right+40)-Math.max(0,best.left-40),h:Math.min(h,best.y+h*.25)-Math.max(0,best.y-h*.12)};
}
async function decodeCanvas(c,decoder){
 const detector=await nativeDetector();if(detector){try{const results=await detector.detect(c);const codes=[...new Set(results.map(r=>normalizeBarcode(r.rawValue,r.format)).filter(Boolean))];if(codes.length>1)return {ambiguous:true};if(codes.length)return {code:codes[0]};}catch(e){}}
 const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)return null;
 try{const result=await decoder.scanFileV2(new File([blob],'scan.png',{type:'image/png'}),false);const code=normalizeBarcode(result.decodedText,result.result?.format?.formatName);return code?{code}:null;}catch(e){return null;}
}
function resetCandidate(){$('ocrCandidates').replaceChildren();$('ocrConfirm').hidden=true;}
function offerCodes(codes){
 resetCandidate();$('ocrConfirm').hidden=false;
 for(const code of codes){const b=document.createElement('button');b.className='secondary';b.textContent='Conferma '+code;b.onclick=async()=>{await stop();resetCandidate();$('codeInput').value=code;showCode(code,'ocr-code');};$('ocrCandidates').append(b);}
}
async function accept(code,token){if(token!==epoch||finishing)return;finishing=true;await stop();$('codeInput').value=code;resetCandidate();showCode(code,'barcode');status('Codice letto e cifra di controllo verificata.');finishing=false;}
async function scanLiveCrop(video,token){
 // Each job owns its decoder: stopping/restarting cannot reuse an in-flight canvas.
 const pass=cropPass++,full=canvasFrom(video,0,null,false,1600),band=bandCrop(full);
 const fraction=[.75,.5,.35][pass%3];
 const crop=band||{x:full.width*(1-fraction)/2,y:full.height*(1-fraction)/2,w:full.width*fraction,h:full.height*fraction};
 const host=document.createElement('div');host.id='live-crop-'+(++decoderSerial);host.setAttribute('aria-hidden','true');host.style.cssText='position:absolute;left:-10000px;width:1200px';document.body.append(host);
 let decoder;
 try{decoder=new Html5Qrcode(host.id,options());
  const c=canvasFrom(full,pass%2?90:0,crop,pass%3===2,1200);
  if(token!==epoch)return null;
  return await decodeCanvas(c,decoder);
 }catch(e){return null;}finally{try{decoder?.clear();}catch(e){}host.remove();}
}
async function tick(token){
 if(!live||token!==epoch)return;
 try{const video=$('reader').querySelector('video');if(!video?.videoWidth)return;
  const detector=await nativeDetector();if(token!==epoch)return;
  if(detector){const results=await detector.detect(video);if(token!==epoch)return;const codes=[...new Set(results.map(r=>normalizeBarcode(r.rawValue,r.format)).filter(Boolean))];if(codes.length===1&&barcodeVote(codes[0]))return accept(codes[0],token);}
  const cropResult=await scanLiveCrop(video,token);if(token!==epoch)return;
  if(cropResult?.code&&barcodeVote(cropResult.code))return accept(cropResult.code,token);
  if(!ocrUnavailable&&!ocrBusy&&Date.now()-lastOcr>4500){lastOcr=Date.now();const c=canvasFrom(video,0,null,false,1400);const crop=bandCrop(c);status('Cerco il barcode e, in alternativa, le cifre stampate…');const result=await recognize(crop?canvasFrom(c,0,crop,false,1600):c);if(token!==epoch)return;
   const codes=ocrCodes(result?.text);if(codes.length===1&&ocrVote(codes[0])){offerCodes(codes);status('Cifre lette due volte: confrontale con la confezione e conferma.');}else if(codes.length>1){offerCodes(codes);status('Più codici possibili: scegli quello sotto le barre.');}
  }
 }catch(e){if(token===epoch){ocrUnavailable=true;status('OCR non disponibile. La lettura delle barre continua; puoi anche caricare una foto.');}}
 finally{if(live&&token===epoch)timer=setTimeout(()=>tick(token),650);}
}
async function start(){
 if(starting||live||photoBusy)return;if(!window.Html5Qrcode)return status('Lettore non disponibile. Ricarica la pagina.');
 const token=++epoch;$('codeResult').classList.remove('show');resetCandidate();barcodeVote=consensus();ocrVote=consensus(30000);ocrUnavailable=false;cropPass=0;lastOcr=Date.now();$('scanFrame').classList.add('show');$('startCamera').disabled=true;$('stopCamera').hidden=false;status('Apertura fotocamera…');
 camera=new Html5Qrcode('reader',options());const current=camera;
 starting=current.start({facingMode:'environment'},{fps:15,disableFlip:true,videoConstraints:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}}},(text,result)=>{if(token!==epoch)return;const code=normalizeBarcode(text,result?.result?.format?.formatName);if(code&&barcodeVote(code))accept(code,token);},()=>{});
 try{await starting;if(token!==epoch)return;live=true;status('Inquadra barre e cifre. Non serve centrare la linea.');const video=$('reader').querySelector('video'),track=video?.srcObject?.getVideoTracks()[0];const caps=track?.getCapabilities?.()||{};
  if(caps.focusMode?.includes('continuous'))await track.applyConstraints({advanced:[{focusMode:'continuous'}]}).catch(()=>{});
  if(token!==epoch)return;
  $('torch').hidden=!caps.torch;$('torch').onclick=async()=>{try{await track.applyConstraints({advanced:[{torch:!track.getSettings().torch}]});}catch(e){status('Torcia non disponibile.');}};
  $('zoomControl').hidden=!caps.zoom;if(caps.zoom){const z=$('zoom');z.min=caps.zoom.min;z.max=Math.max(caps.zoom.min,Math.min(caps.zoom.max,4));z.step=caps.zoom.step||.1;
   const targetZoom=initialZoom(caps.zoom);
   try{await track.applyConstraints({zoom:targetZoom});}
   catch(e){try{await track.applyConstraints({advanced:[{zoom:targetZoom}]});}catch(ignore){}}
   if(token!==epoch)return;
   z.value=track.getSettings().zoom??targetZoom;
   status('Camera pronta: zoom '+Number(z.value).toFixed(1)+'×. Inquadra il codice senza avvicinarti troppo.');
   z.oninput=()=>track.applyConstraints({advanced:[{zoom:Number(z.value)}]}).catch(()=>{});
  }
  timer=setTimeout(()=>tick(token),800);
 }catch(e){if(token===epoch){status('Fotocamera non disponibile: verifica il permesso oppure scegli una foto.');$('startCamera').disabled=false;$('stopCamera').hidden=true;$('scanFrame').classList.remove('show');}}
 finally{starting=null;}
}
async function stop(){
 ++epoch;live=false;clearTimeout(timer);const pending=starting,current=camera;camera=null;
 if(pending)await pending.catch(()=>{});
 if(current){try{if(current.isScanning)await current.stop();}catch(e){}try{current.clear();}catch(e){}}
 $('scanFrame').classList.remove('show');$('startCamera').disabled=photoBusy;$('stopCamera').hidden=true;$('torch').hidden=true;$('zoomControl').hidden=true;
}
async function fromFile(file,label=false){
 if(!file||photoBusy)return;photoBusy=true;await stop();const token=epoch;$('codeResult').classList.remove('show');resetCandidate();$('cancelScan').hidden=false;$('barcodePhoto').disabled=$('labelPhoto').disabled=true;status('Analizzo la foto: prima le barre, poi le cifre…');$('ocrStatus').textContent='Analisi in corso…';
 const url=URL.createObjectURL(file);let decoder;
 try{const img=new Image();img.src=url;await img.decode();if(token!==epoch)return;const original=canvasFrom(img);decoder=new Html5Qrcode('photoReader',options());
  for(const angle of [0,90,180,270,-12,12]){
   const rotated=canvasFrom(original,angle);const band=bandCrop(rotated);const variants=[rotated];if(band)variants.push(canvasFrom(rotated,0,band),canvasFrom(rotated,0,band,true));
   for(const c of variants){if(token!==epoch)return;const found=await decodeCanvas(c,decoder);if(token!==epoch)return;if(found?.ambiguous){status('Più barcode nella foto: ritaglia il prodotto desiderato e riprova.');return;}if(found?.code){await accept(found.code,token);$('ocrStatus').textContent='Barcode letto nella foto.';return;}}
  }
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
