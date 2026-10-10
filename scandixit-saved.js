/* Local ScanDixit shelf, isolated from loyalty-card backups. */
(function(root){
'use strict';
const KEY='scandixit.products.v1',TYPE='scandixit-products',LIMIT=300;
const FIELDS=['product_name','product_name_en','generic_name','brands','quantity','product_type','categories','ingredients_text','allergens','origins','countries','labels','packaging','code','image_front_small_url','image_front_url'];
function cleanProduct(p){const result={};if(!p||typeof p!=='object')return result;for(const key of FIELDS)if(typeof p[key]==='string')result[key]=p[key].slice(0,10000);if(Number.isFinite(Number(p.last_modified_t)))result.last_modified_t=Number(p.last_modified_t);for(const key of ['image_front_small_url','image_front_url'])if(result[key]&&!/^https:\/\/[a-z0-9.-]+\//i.test(result[key]))delete result[key];return result}
function clean(item){
 if(!item||typeof item!=='object')throw Error('Prodotto non valido');
 const kind=item.kind==='model'?'model':'barcode',code=String(item.code||'').trim();
 if(!code||code.length>250||(kind==='barcode'&&!root.FiCardReader.validGTIN(code)))throw Error('Codice prodotto non valido');
 const host=['world.openfoodfacts.org','world.openbeautyfacts.org','world.openproductsfacts.org','world.openpetfoodfacts.org'].includes(item.host)?item.host:'';
 return {kind,code,format:kind==='barcode'?'':String(item.format||'').slice(0,30),savedAt:Number.isFinite(item.savedAt)?item.savedAt:Date.now(),product:cleanProduct(item.product),host};
}
function identity(item){return item.kind+':'+item.code.toLocaleLowerCase('it')}
function makeStore(storage){
 let items=[];try{const parsed=JSON.parse(storage.getItem(KEY)||'[]');if(Array.isArray(parsed))items=parsed.slice(0,LIMIT).map(clean)}catch{}
 function write(next){storage.setItem(KEY,JSON.stringify(next));items=next}
 return {list:()=>items.slice(),get:(item)=>items.find(x=>identity(x)===identity(item)),save(item){item=clean(item);const prev=items.find(x=>identity(x)===identity(item));if(!prev&&items.length>=LIMIT)throw Error('Lista piena: esporta o rimuovi alcuni prodotti');item.savedAt=prev?.savedAt||item.savedAt;if(!Object.keys(item.product).length&&prev)item.product=prev.product;write([item,...items.filter(x=>identity(x)!==identity(item))]);return item},remove(item){write(items.filter(x=>identity(x)!==identity(item)))},backup(){return {type:TYPE,version:1,exportedAt:new Date().toISOString(),products:items.slice()}},import(data){if(!data||data.type!==TYPE||data.version!==1||!Array.isArray(data.products)||data.products.length>LIMIT)throw Error('Non è un backup prodotti ScanDixit valido');const incoming=data.products.map(clean),known=new Set(items.map(identity)),added=[];for(const item of incoming)if(!known.has(identity(item))){known.add(identity(item));added.push(item)}if(items.length+added.length>LIMIT)throw Error('Troppi prodotti: massimo '+LIMIT);write([...added,...items]);return added.length}};
}
const api={makeStore,cleanProduct,clean,identity,KEY};
if(typeof module!=='undefined')module.exports=api;
if(!root.document)return;
let store,current=null;try{store=makeStore(root.localStorage)}catch{store=makeStore({getItem:()=>null,setItem(){throw Error('Salvataggio locale non disponibile')}})}
const $=id=>root.document.getElementById(id);
function notify(message){if(typeof root.toast==='function')root.toast(message)}
function begin(item){try{current=clean({kind:item.source==='ocr'?'model':'barcode',code:item.productCode||item.code,format:item.format});current=store.get(current)||current}catch{current=null}sync()}
function capture(product,host,code){if(!current||current.code!==code)return;current.product=cleanProduct(product);current.host=host;if(store.get(current)){try{store.save(current);render()}catch{}}sync()}
function snapshot(code){return store.get({kind:'barcode',code})}
function sync(){const button=$('saveProduct');if(!button)return;button.disabled=!current;button.textContent=current&&store.get(current)?'Prodotto salvato ✓':'Salva per dopo';$('shareProduct').disabled=!current||current.kind!=='barcode';const open=$('standaloneOpenApp');if(open){open.hidden=!current||current.kind!=='barcode';if(!open.hidden)open.href='ficard://scandixit?code='+encodeURIComponent(current.code)}}
function filename(){return 'ScanDixit-prodotti-'+new Date().toISOString().slice(0,10)+'.json'}
function nativeBridge(){try{return root.FiCardNative||root.parent?.FiCardNative}catch{return null}}
function backupFile(){return new File([JSON.stringify(store.backup(),null,2)],filename(),{type:'application/json'})}
async function download(file){if(nativeBridge()?.saveBackup){await nativeBridge().saveBackup(file,file.name);return}const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function shareProduct(item=current){if(!item||item.kind!=='barcode')return;const url='https://fi-card.app/scandixit/?code='+encodeURIComponent(item.code),title=item.product.product_name||'Prodotto ScanDixit';try{if(nativeBridge()?.shareProductLink)await nativeBridge().shareProductLink(title,url);else if(root.navigator.share)await root.navigator.share({title,text:'Scopri questo prodotto con ScanDixit di Fi-Card',url});else if(root.navigator.clipboard?.writeText){await root.navigator.clipboard.writeText(url);notify('Link prodotto copiato')}else root.prompt('Copia il link del prodotto',url)}catch(e){if(e.name!=='AbortError')notify('Condivisione non disponibile')}}
function render(){
 const list=$('savedProductsList');if(!list)return;list.replaceChildren();const items=store.list();$('savedProductsCount').textContent=String(items.length);$('savedProductsEmpty').hidden=!!items.length;
 for(const item of items){const row=document.createElement('article');row.className='savedProduct';const open=document.createElement('button');open.type='button';open.className='savedProductOpen';const imageUrl=item.product.image_front_small_url||item.product.image_front_url;if(imageUrl){const img=document.createElement('img');img.src=imageUrl;img.alt='';img.loading='lazy';img.onerror=()=>img.remove();open.append(img)}const text=document.createElement('span'),name=document.createElement('strong'),meta=document.createElement('small');name.textContent=item.product.product_name||item.product.product_name_en||item.code;meta.textContent=(item.product.brands?item.product.brands+' · ':'')+new Date(item.savedAt).toLocaleDateString('it-IT');text.append(name,meta);open.append(text);open.onclick=()=>root.showCode(item.code,item.kind==='model'?'ocr':'barcode',item.format);const actions=document.createElement('div');actions.className='savedProductActions';if(item.kind==='barcode'){const share=document.createElement('button');share.type='button';share.textContent='Condividi';share.onclick=()=>shareProduct(item);actions.append(share)}const remove=document.createElement('button');remove.type='button';remove.textContent='Rimuovi';remove.onclick=()=>{if(root.confirm('Rimuovere questo prodotto salvato?')){try{store.remove(item);render();sync()}catch{notify('Impossibile aggiornare la lista')}}};actions.append(remove);row.append(open,actions);list.append(row)}
}
function init(){
 $('saveProduct').onclick=()=>{if(!current)return;try{store.save(current);render();sync();notify('Prodotto salvato per dopo')}catch(e){notify(e.message||'Spazio sul dispositivo esaurito')}};
 $('shareProduct').onclick=()=>shareProduct();
 $('exportProducts').onclick=async()=>{try{await download(backupFile())}catch{notify('Esportazione non disponibile')}};
 $('shareProducts').onclick=async()=>{try{const file=backupFile();if(nativeBridge()?.saveFile)await nativeBridge().saveFile(file,file.name);else if(root.navigator.canShare?.({files:[file]})&&root.navigator.share)await root.navigator.share({title:'Prodotti salvati ScanDixit',files:[file]});else{await download(file);notify('Backup scaricato: puoi inviarlo come allegato')}}catch(e){if(e.name!=='AbortError')notify('Condivisione non disponibile')}};
 $('importProducts').onchange=async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{if(file.size>10000000)throw Error('Backup troppo grande');const count=store.import(JSON.parse(await file.text()));render();sync();notify(count+' prodotti aggiunti; quelli già presenti sono stati ignorati')}catch(e){notify(e.message||'Backup non valido')}};
 render();sync();const code=new URLSearchParams(root.location.search).get('code');if(code){if(root.FiCardReader.validGTIN(code))root.showCode(code,'barcode');else notify('Il link non contiene un codice prodotto valido')}
}
root.ScanDixitSaved={begin,capture,snapshot,render,shareProduct};
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof window==='undefined'?globalThis:window);
