function replaceOnce(html,from,to){if(!html.includes(from))throw Error('Native integration target changed: '+from.slice(0,70));return html.replace(from,to);}
function nativeHtml(html,name){
 html=replaceOnce(html,'<head>','<head>\n<script src="./native/ficard-native.js"></script>');
 html=html.replace('</head>','<style>.app{padding-top:max(env(safe-area-inset-top,0px),var(--safe-area-inset-top,0px))!important}.bottom{padding-bottom:calc(9px + max(env(safe-area-inset-bottom,0px),var(--safe-area-inset-bottom,0px)))!important}</style></head>');
 if(name!=='index.html')return html;
 html=replaceOnce(html,'if("serviceWorker" in navigator)navigator.serviceWorker.register','if(!window.FiCardNative&&"serviceWorker" in navigator)navigator.serviceWorker.register');
 html=replaceOnce(html,'if(positionRequest)return positionRequest;','if(positionRequest)return positionRequest;\n if(window.FiCardNative){positionRequest=window.FiCardNative.getPosition().finally(()=>{positionRequest=null});return positionRequest;}');
 html=replaceOnce(html,"function downloadBackup(data,filename='')","async function downloadBackup(data,filename='')");
 const start=html.indexOf('async function downloadBackup('),end=html.indexOf('\n',start);
 let backup=html.slice(start,end),download=backup.slice(backup.indexOf('const url='),backup.indexOf('localStorage.setItem'));
 backup=replaceOnce(backup,download,"if(window.FiCardNative){await window.FiCardNative.saveBackup(blob,filename||'fi-card-backup-'+new Date().toISOString().slice(0,10)+'.json');}else{"+download+'}');
 backup=replaceOnce(backup,"toast('Backup pronto da salvare in File')","toast(window.FiCardNative?'Backup salvato':'Backup pronto da salvare in File')");
 html=html.slice(0,start)+backup+html.slice(end);
 html=replaceOnce(html,'if(navigator.canShare?.({files:[file]})){await navigator.share({title:c.name','if(window.FiCardNative){await window.FiCardNative.saveFile(blob,file.name)}\n   else if(navigator.canShare?.({files:[file]})){await navigator.share({title:c.name');
 html=replaceOnce(html,"'Scopri FiCard: '+new URL('./',location.href).href","'Scopri FiCard: https://fi-card.app/'");
 // Stop a replacement restore if saving the safety backup is cancelled/fails.
 html=replaceOnce(html,'document.getElementById("replaceBackup").onclick=()=>','document.getElementById("replaceBackup").onclick=async()=>');
 html=replaceOnce(html,'downloadBackup(cards,"fi-card-prima-del-ripristino.json");','try{await downloadBackup(cards,"fi-card-prima-del-ripristino.json");}catch{toast("Backup non completato");return;}');
 html=replaceOnce(html,'document.getElementById("exportData").onclick=()=>downloadBackup(cards);','document.getElementById("exportData").onclick=()=>downloadBackup(cards).catch(()=>toast("Backup non completato"));');
 return html;
}
module.exports={nativeHtml};
