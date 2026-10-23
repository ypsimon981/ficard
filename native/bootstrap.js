import {Capacitor,registerPlugin} from '@capacitor/core';
import {Geolocation} from '@capacitor/geolocation';
import {Haptics} from '@capacitor/haptics';
import {Filesystem,Directory} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {App} from '@capacitor/app';
import {Browser} from '@capacitor/browser';

if(Capacitor.isNativePlatform()){
 const CardScreen=registerPlugin('CardScreen');
 const BackupFiles=registerPlugin('BackupFiles');
 window.FiCardNative={
  shareProductLink(title,url){return Share.share({title,text:window.FiCardI18n?.translateText('Scopri questo prodotto con ScanDixit di Fi-Card')||'Scopri questo prodotto con ScanDixit di Fi-Card',url});},
  async saveBackup(blob,name){
   await BackupFiles.saveBackup({data:await blob.text(),name});
  },
  setFullScreen(active){return CardScreen.setFullScreen({active});},
  async getPosition(){
   // getCurrentPosition requests permission AND resolves disabled device location.
   // requestPermissions first would reject with 0007 before Android can offer activation.
   try{
    const p=await Geolocation.getCurrentPosition({enableHighAccuracy:true,timeout:15000,maximumAge:30000});
    return {lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,timestamp:p.timestamp};
   }catch(error){
    const code=String(error?.code||'');
    const message=code==='OS-PLUG-GLOC-0003'?'Permesso di posizione negato. Abilitalo nelle impostazioni del telefono.':
     ['OS-PLUG-GLOC-0007','OS-PLUG-GLOC-0009','OS-PLUG-GLOC-0016','OS-PLUG-GLOC-0017'].includes(code)?'Posizione disattivata. Attiva la localizzazione e riprova La mia posizione.':
     code==='OS-PLUG-GLOC-0010'?'Tempo GPS scaduto. Riprova La mia posizione.':'Posizione non disponibile. Controlla che la localizzazione sia attiva.';
    throw Object.assign(new Error(window.FiCardI18n?.translateText(message)||message),{code:code==='OS-PLUG-GLOC-0003'?1:code==='OS-PLUG-GLOC-0010'?3:2});
   }
  },
  async saveFile(blob,name){
   const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});
   const filename=name.replace(/[^a-zA-Z0-9._-]/g,'_');
   const result=await Filesystem.writeFile({path:'ficard-share/'+filename,data,directory:Directory.Cache,recursive:true});
   await Share.share({title:'Fi-Card',files:[result.uri]});
  }
 };
 // Existing trusted-click handler detects this registered plugin.
 window.Capacitor=Capacitor;
 Capacitor.Plugins=Capacitor.Plugins||{};Capacitor.Plugins.Haptics=Haptics;
 document.addEventListener('click',event=>{
  const link=event.target?.closest?.('a[target="_blank"]');if(!link)return;
  const url=new URL(link.href,location.href);
  if(url.origin===location.origin&&url.pathname.endsWith('/privacy.html')){
   event.preventDefault();
   let modal=document.getElementById('nativePrivacyModal');
   if(!modal){modal=document.createElement('div');modal.id='nativePrivacyModal';modal.className='modal';modal.innerHTML='<div class="sheet"><div class="sheetHead"><h2>Fi-Card · Privacy</h2><button type="button" class="close" aria-label="Close">×</button></div><iframe title="Fi-Card Privacy" src="./privacy.html" style="width:100%;height:65vh;border:0;background:white"></iframe></div>';document.body.appendChild(modal);modal.querySelector('button').addEventListener('click',()=>modal.classList.remove('show'));}
   modal.classList.add('show');return;
  }
  if(url.origin!==location.origin&&/^https?:$/.test(url.protocol)){event.preventDefault();Browser.open({url:url.href}).catch(()=>{});}
 },true);
 if(window===window.top){
  const openProductUrl=({url}={})=>{try{const link=new URL(url);if(link.protocol!=='ficard:'||link.hostname!=='scandixit')return;const code=link.searchParams.get('code');if(!window.FiCardReader?.validGTIN(code))return;window.FiCardOpenProduct?.(code)}catch{}};
  App.addListener('appUrlOpen',openProductUrl);
  const launch=()=>App.getLaunchUrl().then(openProductUrl).catch(()=>{});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',launch,{once:true});else launch();
  App.addListener('backButton',()=>{
   const full=document.getElementById('fullBarcode');
   if(full?.classList.contains('show')){document.getElementById('closeFull')?.click();return;}
   const modal=[...document.querySelectorAll('.modal.show')].pop();
   if(modal){window.hideModal?.(modal.id);return;}
   if(!document.getElementById('homeView')?.classList.contains('active')){window.go?.('home');return;}
   App.exitApp();
  });
  App.addListener('appStateChange',({isActive})=>{if(isActive)window.syncCardScreen?.();});
 }
}
