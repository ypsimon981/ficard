const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const locales=require('./locale-fixture.cjs'),read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8'),languages=['it','en','fr','es','pt','nl','de'];
function setup(language='en',body){
 const events={},callbacks=[];let selected=language;
 const root={document:{readyState:'loading',body,documentElement:{},addEventListener:(name,fn)=>events[name]=fn},navigator:{languages:['en-GB']},localStorage:{getItem:()=>selected},FiCardI18n:{language:()=>selected},addEventListener:(name,fn)=>events[name]=fn,MutationObserver:class{constructor(fn){callbacks.push(fn)}observe(){}},confirm:()=>true};
 const context={window:root};vm.createContext(context);vm.runInContext(locales+read('scandixit-i18n.js'),context);
 return {root,api:root.ScanDixitI18n,events,callbacks,select:language=>selected=language};
}
function element(text='',skip=false){
 const el={nodeType:1,children:[],childNodes:[],attributes:{},parentElement:null,hasAttribute(name){return name in this.attributes},getAttribute(name){return this.attributes[name]},setAttribute(name,value){this.attributes[name]=value},matches(selector){return skip&&selector.includes('[data-i18n-skip]')},closest(selector){return this.matches(selector)?this:this.parentElement?.closest(selector)}};
 if(text)el.childNodes.push({nodeType:3,nodeValue:text,parentElement:el});
 el.append=child=>{child.parentElement=el;el.children.push(child);el.childNodes.push(child)};
 return el;
}
test('all seven language files have complete interface, ScanDixit, sharing and privacy messages',()=>{
 const c={};vm.runInNewContext(locales,c);const all=c.FiCardLocales;
 for(const lang of languages){assert.deepEqual(Object.keys(all[lang].messages).sort(),Object.keys(all.it.messages).sort());assert.deepEqual(Object.keys(all[lang].scan).sort(),Object.keys(all.it.scan).sort());for(const text of Object.values(all[lang].messages))assert.equal(typeof text,'string');assert.equal(all[lang].analytics.length,5);assert.equal(all[lang].sharing.items.length,3);}
});
test('ScanDixit selector, shelf, actions, errors and counted imports translate in every foreign language',()=>{
 for(const lang of languages.slice(1)){
  const {api}=setup(lang);
  for(const text of ['▦ Codice a barre','▤ Etichetta / OCR','Prodotti salvati','Condividi','Rimuovi','Backup dei prodotti','Salva per dopo','Codice letto dal lettore FiCard.','Ingredienti','Catalogo non raggiungibile','Backup non valido'])assert.notEqual(api.t(text),text,lang+': '+text);
  assert.notEqual(api.t('{n} prodotti aggiunti; quelli già presenti sono stati ignorati',{n:5}),'5 prodotti aggiunti; quelli già presenti sono stati ignorati');
  assert.doesNotMatch(api.t('Conferma {code}',{code:'0408630088892'}),/\{code\}/);assert.match(api.t('Conferma {code}',{code:'0408630088892'}),/0408630088892/);
 }
});
test('live text updates and language changes restore Italian while preserving product names and ingredients',()=>{
 const body=element(),tab=element('▦  Codice a barre'),shelf=element('Prodotti salvati '),action=element('Condividi'),product=element('Prodotti salvati',true),ingredients=element('Aqua, profumo',true);
 for(const node of [tab,shelf,action,product,ingredients])body.append(node);
 const {events,callbacks,select,root}=setup('en',body);events.DOMContentLoaded();
 assert.equal(tab.childNodes[0].nodeValue,'▦  Barcode');assert.equal(shelf.childNodes[0].nodeValue,'Saved products ');assert.equal(action.childNodes[0].nodeValue,'Share');
 action.childNodes[0].nodeValue='Rimuovi';callbacks[0]([{type:'characterData',target:action.childNodes[0]}]);assert.equal(action.childNodes[0].nodeValue,'Remove');
 select('fr');events['ficard:languagechange']();assert.equal(shelf.childNodes[0].nodeValue,'Produits enregistrés ');
 select('it');events['ficard:languagechange']();assert.equal(tab.childNodes[0].nodeValue,'▦  Codice a barre');assert.equal(action.childNodes[0].nodeValue,'Rimuovi');assert.equal(root.document.documentElement.lang,'it');
 assert.equal(product.childNodes[0].nodeValue,'Prodotti salvati');assert.equal(ingredients.childNodes[0].nodeValue,'Aqua, profumo');
});
test('card backup, image progress and duplicate messages translate without altering numbers or names',()=>{
 for(const lang of languages.slice(1)){
  const root={document:{readyState:'loading',addEventListener(){}},localStorage:{getItem:()=>lang},addEventListener(){}};
  vm.runInNewContext(locales+read('ficard-i18n.js'),{window:root});
  for(const value of ['5 carte nel backup. Hai 3 carte su questo dispositivo.','2 carte aggiunte; duplicati ignorati','Lettura immagine 1 di 4…','Sostituire le 3 carte attuali con le 5 carte del backup?','Hai già una carta con questo contenuto (“Simone”). Vuoi salvarne comunque un’altra?']){const translated=root.FiCardI18n.translateText(value);assert.notEqual(translated,value,lang+': '+value);if(value.includes('Simone'))assert.match(translated,/Simone/);}
 }
});
test('language assets load before consumers and are included in offline web, native and page-app builds',()=>{
 for(const html of [read('index.html'),read('scandixit.html')])for(const lang of languages)assert.ok(html.indexOf('locales/'+lang+'.js')<html.indexOf('ficard-theme.js'));
 for(const lang of languages)assert.match(read('sw.js'),new RegExp('locales/'+lang+'\\.js'));
 assert.match(read('scripts/build-native.cjs'),/'locales'/);assert.match(read('scripts/build-scandixit-site.cjs'),/assets.push\('locales\/\'/);
});
