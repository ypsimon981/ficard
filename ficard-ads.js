/* Provider-neutral Capacitor placement bridge. No SDK or tracking loaded here. */
(function(root){
'use strict';
let provider=null,scheduled=false;
const mounted=new Map(),failed=new WeakSet();
function allowed(el){
 const config=root.FiCardAdsConfig,platform=root.Capacitor?.getPlatform?.();
 return !!(provider&&config?.enabled&&root.Capacitor?.isNativePlatform?.()&&
  config.units?.[platform]?.[el.dataset.adSlot]&&root.FiCardContent?.slotAllowsAd(el.dataset.adSlot)&&
  !root.document.hidden&&!root.document.querySelector?.('.modal.show')&&el.isConnected&&el.getClientRects().length);
}
function bounds(el){
 const r=el.getBoundingClientRect();
 const visible=allowed(el)&&r.bottom>0&&r.top<root.innerHeight&&r.right>0&&r.left<root.innerWidth;
 return {x:r.x,y:r.y,width:r.width,height:r.height,visible};
}
function dispose(el,entry){
 mounted.delete(el);entry.cancelled=true;el.classList.remove('nativeAdLoaded');
 try{Promise.resolve(entry.handle?.destroy?.()).catch(()=>{});}catch{}
}
async function mount(el){
 const entry={cancelled:false,handle:null};mounted.set(el,entry);
 const slot=el.dataset.adSlot,platform=root.Capacitor.getPlatform(),config=root.FiCardAdsConfig;
 try{
  // mount must resolve only after an actual ad loads; rejection retains the tip.
  const handle=await provider.mount({element:el,slot,format:el.dataset.adFormat,
   unitId:config.units[platform][slot],testMode:config.testMode!==false,
   getBounds:()=>bounds(el),isAllowed:()=>allowed(el)&&!entry.cancelled});
  if(!handle||typeof handle.destroy!=='function')throw Error('Missing ad lifecycle handle');
  entry.handle=handle;
  if(entry.cancelled||!allowed(el)){try{await handle.destroy();}catch{}if(!entry.cancelled)dispose(el,entry);return;}
  el.classList.add('nativeAdLoaded');schedule();
 }catch{failed.add(el);if(!entry.cancelled)dispose(el,entry);}
}
function sync(){
 scheduled=false;
 for(const [el,entry] of mounted){
  if(!allowed(el)){dispose(el,entry);continue;}
  try{Promise.resolve(entry.handle?.update?.(bounds(el))).catch(()=>{failed.add(el);dispose(el,entry);});}catch{failed.add(el);dispose(el,entry);}
 }
 for(const el of root.document.querySelectorAll('[data-ad-slot]')){
  if(allowed(el)&&bounds(el).visible&&!mounted.has(el)&&!failed.has(el))void mount(el);
 }
}
function schedule(){if(!scheduled){scheduled=true;root.requestAnimationFrame(sync);}}
root.FiCardAds={
 registerProvider(next){
  if(!next||typeof next.mount!=='function')throw Error('Ad provider must implement mount');
  for(const [el,entry] of mounted)dispose(el,entry);
  provider=next;schedule();
 },refresh:schedule,
 stop(){provider=null;for(const [el,entry] of mounted)dispose(el,entry);}
};
function start(){
 new root.MutationObserver(schedule).observe(root.document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 root.document.addEventListener('scroll',schedule,true);
 root.document.addEventListener('visibilitychange',schedule);
 for(const name of ['resize','offline','online','ficard:languagechange'])root.addEventListener(name,schedule);
 root.addEventListener('pagehide',()=>{for(const [el,entry] of mounted)dispose(el,entry);});
 schedule();
}
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
