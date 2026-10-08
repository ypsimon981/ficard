import {Capacitor} from '@capacitor/core';
import {Geolocation} from '@capacitor/geolocation';
import {Haptics} from '@capacitor/haptics';
import {Filesystem,Directory} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {App} from '@capacitor/app';
import {Browser} from '@capacitor/browser';

if(Capacitor.isNativePlatform()){
 window.FiCardNative={
  async getPosition(){
   const permission=await Geolocation.requestPermissions({permissions:['location']});
   if(permission.location!=='granted'&&permission.coarseLocation!=='granted')throw Error('Permesso di posizione negato. Abilitalo nelle impostazioni del telefono.');
   const p=await Geolocation.getCurrentPosition({enableHighAccuracy:true,timeout:15000,maximumAge:30000});
   return {lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,timestamp:p.timestamp};
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
  App.addListener('backButton',()=>{
   const modal=[...document.querySelectorAll('.modal.show')].pop();
   if(modal){window.hideModal?.(modal.id);return;}
   if(!document.getElementById('homeView')?.classList.contains('active')){window.go?.('home');return;}
   App.exitApp();
  });
 }
}
