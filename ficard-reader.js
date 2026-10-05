/* One barcode reader for FiCard and ScanDixit. Keep camera and photo decoding here. */
(function(root){
'use strict';
const formatNames=['QR_CODE','AZTEC','CODABAR','CODE_39','CODE_93','CODE_128','DATA_MATRIX','MAXICODE','ITF','EAN_13','EAN_8','PDF_417','RSS_14','RSS_EXPANDED','UPC_A','UPC_E','UPC_EAN_EXTENSION'];
function formatName(result){
 const f=result?.result?.format??result?.format;
 if(typeof f==='string')return f.toUpperCase();if(f?.formatName)return f.formatName.toUpperCase();
 const n=typeof f==='number'?f:f?.format;return formatNames[n]||'';
}
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

function readBarcode(value,format=''){
 const raw=String(value??'');if(!raw||raw.length>4096)return null;
 const name=String(format).toUpperCase().replace(/[ -]/g,'_');
 const retail=/^(EAN_?13|EAN_?8|UPC_?A|UPC_?E)$/.test(name);
 const code=retail||!name?raw.replace(/\s/g,''):raw;
 const normalized=/^UPC_?E$/.test(name)&&code.length===8?expandUPCE(code):code;
 if(!normalized||((retail||!name)&&!validGTIN(normalized)))return null;
 return {code:normalized,format:name,productCode:(retail||!name)&&validGTIN(normalized)?normalized:null};
}
function options(){return {formatsToSupport:formatNames.map(k=>root.Html5QrcodeSupportedFormats[k]).filter(n=>n!==undefined),useBarCodeDetectorIfSupported:false,verbose:false};}
function createDecoder(id){return new root.Html5Qrcode(id,options());}
function liveConfig(){return {fps:18,qrbox:(w,h)=>({width:Math.max(1,Math.floor(w*.94)),height:Math.max(1,Math.floor(h*.62))})};}
async function startLive(decoder,onRead){
 const attempts=[null,{facingMode:{ideal:'environment'}},{width:{ideal:1280}}];
 for(let i=0;i<attempts.length;i++){
  try{return await decoder.start({facingMode:'environment'},{...liveConfig(),...(attempts[i]?{videoConstraints:attempts[i]}:{})},onRead,()=>{});}
  catch(error){
   const reason=String(error?.name||'')+' '+String(error?.message||error);
   if(i===attempts.length-1||!/NotReadable|Overconstrained|NotFound|TrackStart|AbortError|Could not start|Could not access|constraint/i.test(reason))throw error;
   try{await decoder.stop();}catch{}try{decoder.clear();}catch{}
  }
 }
}
async function setZoom(track,value){
 try{await track.applyConstraints({advanced:[{zoom:Number(value)}]});return track.getSettings().zoom??Number(value);}
 catch(e){await track.applyConstraints({zoom:Number(value)});return track.getSettings().zoom??Number(value);}
}
let nativePromise;
async function nativeDetector(){
 if(!nativePromise)nativePromise=(async()=>{try{if(!root.BarcodeDetector)return null;
 const supported=await root.BarcodeDetector.getSupportedFormats();
 const formats=['ean_13','ean_8','upc_a','upc_e','code_128','code_39','code_93','itf','codabar','qr_code','data_matrix','pdf417','aztec'].filter(f=>supported.includes(f));
 return formats.length?new root.BarcodeDetector({formats}):null;}catch(e){return null;}})();return nativePromise;
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
 const w=c.width,h=c.height,data=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data,rows=[];
 for(let y=0;y<h;y+=3){
  const values=[];for(let x=Math.floor(w*.08);x<w*.92;x+=2){const i=(y*w+x)*4;values.push((data[i]+data[i+1]+data[i+2])/3);}
  values.sort((a,b)=>a-b);const lo=values[Math.floor(values.length*.1)],hi=values[Math.floor(values.length*.9)];if(hi-lo<35)continue;
  const black=lo+(hi-lo)*.4,white=lo+(hi-lo)*.6,positions=[];let last=-1;
  for(let x=Math.floor(w*.08);x<w*.92;x++){const i=(y*w+x)*4,v=(data[i]+data[i+1]+data[i+2])/3,bit=v<black?0:v>white?1:-1;
   if(bit>=0){if(last>=0&&bit!==last)positions.push(x);last=bit;}
  }
  let start=0,best=[];for(let k=1;k<=positions.length;k++){if(k===positions.length||positions[k]-positions[k-1]>Math.max(16,w*.025)){const run=positions.slice(start,k);if(run.length>best.length)best=run;start=k;}}
  if(best.length>=35)rows.push({y,left:best[0],right:best.at(-1),score:best.length});
 }
 if(!rows.length)return null;
 const groups=[];let group=[];for(const row of rows){if(group.length&&row.y-group.at(-1).y>12){groups.push(group);group=[];}group.push(row);}groups.push(group);
 const quality=g=>g.reduce((sum,r)=>sum+r.score,0);
 const eligible=groups.filter(g=>g.at(-1).y-g[0].y>=9);if(!eligible.length)return null;
 const best=eligible.reduce((a,b)=>quality(a)>quality(b)?a:b),peak=best.reduce((a,b)=>a.score>b.score?a:b),top=best[0].y,bottom=best.at(-1).y;
 const pad=Math.max(12,(bottom-top)*.2),x=Math.max(0,peak.left-40),y=Math.max(0,top-pad);
 return {x,y,w:Math.min(w,peak.right+40)-x,h:Math.min(h,bottom+pad*2)-y};
}
async function decodeCanvas(c,decoder){
 const detector=await nativeDetector();if(detector){try{
  const results=await detector.detect(c),found=new Map();
  for(const r of results){const item=readBarcode(r.rawValue,r.format);if(item)found.set(item.code,item);}
  if(found.size>1)return {ambiguous:true};if(found.size){const item=[...found.values()][0];return {...item,result:{decodedText:item.code,result:{format:{formatName:item.format}}}};}
 }catch(e){}}
 const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)return null;
 try{const result=await decoder.scanFileV2(new File([blob],'scan.png',{type:'image/png'}),false),item=readBarcode(result.decodedText,formatName(result));return item?{...item,result}:null;}catch(e){return null;}
}
async function imageCandidates(file){
 const out=await barcodeScanCandidates(file);out.push(file);let bmp=null;
 try{
   bmp=await createImageBitmap(file);const specs=[[.05,.20,.90,.68],[.08,.28,.84,.48],[0,.18,1,.70]];
   for(let i=0;i<specs.length;i++){const [rx,ry,rw,rh]=specs[i],sx=Math.round(bmp.width*rx),sy=Math.round(bmp.height*ry),sw=Math.round(bmp.width*rw),sh=Math.round(bmp.height*rh),canvas=document.createElement("canvas"),maxW=1800,scale=Math.min(2,maxW/sw);canvas.width=Math.max(600,Math.round(sw*scale));canvas.height=Math.max(260,Math.round(sh*scale));const ctx=canvas.getContext("2d");ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.drawImage(bmp,sx,sy,sw,sh,0,0,canvas.width,canvas.height);const blob=await new Promise(r=>canvas.toBlob(r,"image/png",1));if(blob)out.push(new File([blob],"ficard-crop-"+i+".png",{type:"image/png"}))}
 }catch(e){}finally{try{bmp?.close()}catch(e){}}
 return out
}

let decoderSerial=0;
async function scanLiveCrop(video,pass,isCurrent=()=>true){
 // Each job owns its decoder: stopping/restarting cannot reuse an in-flight canvas.
 const full=canvasFrom(video,0,null,false,1600),band=bandCrop(full);
 const fraction=[.75,.5,.35][pass%3];
 const crop=band||{x:full.width*(1-fraction)/2,y:full.height*(1-fraction)/2,w:full.width*fraction,h:full.height*fraction};
 const host=document.createElement('div');host.id='live-crop-'+(++decoderSerial);host.setAttribute('aria-hidden','true');host.style.cssText='position:absolute;left:-10000px;width:1200px';document.body.append(host);
 let decoder;
 try{decoder=createDecoder(host.id);
  const c=canvasFrom(full,pass%2?90:0,crop,pass%3===2,1200);
  if(!isCurrent())return null;
  return await decodeCanvas(c,decoder);
 }catch(e){return null;}finally{try{decoder?.clear();}catch(e){}host.remove();}
}
async function scanFile(decoder,file,isCurrent=()=>true){
 const candidates=await imageCandidates(file);let last;
 for(const candidate of candidates){if(!isCurrent())throw Error('Analisi annullata');
  try{const result=await decoder.scanFileV2(candidate,false),item=readBarcode(result.decodedText,formatName(result));if(item)return {result,candidate,...item};}catch(e){last=e;}
 }
 const url=URL.createObjectURL(file);
 try{const img=new Image();img.src=url;await img.decode();
  for(const angle of [0,-3,3,-6,6,90,180,270,-12,12]){
   if(!isCurrent())throw Error('Analisi annullata');
   const rotated=canvasFrom(img,angle),band=bandCrop(rotated),variants=[rotated];
   if(band)variants.push(canvasFrom(rotated,0,band),canvasFrom(rotated,0,band,true));
   for(const c of variants){if(!isCurrent())throw Error('Analisi annullata');const found=await decodeCanvas(c,decoder);if(found?.ambiguous)return found;if(found?.code)return {...found,candidate:file};}
  }
 }finally{URL.revokeObjectURL(url);}
 throw last||Error('Codice non letto');
}
const api={formatNames,formatName,validGTIN,expandUPCE,readBarcode,options,createDecoder,liveConfig,startLive,setZoom,nativeDetector,canvasFrom,bandCrop,decodeCanvas,scanLiveCrop,scanFile};
root.FiCardReader=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
