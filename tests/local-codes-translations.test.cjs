const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(require('node:path').join(__dirname,'..',f),'utf8');
const locales=require('./locale-fixture.cjs');
function setup(lang,saved){
 const callbacks={},events={},button={setAttribute(){}};
 const root={localStorage:{getItem:key=>key==='ficard.language.v2'?lang:key==='ficard.personal.receipt-lottery.v1'&&saved?JSON.stringify({code:'ABC12345'}):null},document:{readyState:'loading',addEventListener:(key,fn)=>{(callbacks[key]??=[]).push(fn)},getElementById:id=>id==='lotterySettingsAdd'?button:id==='lotteryModal'?{}:null},addEventListener:(key,fn)=>events[key]=fn};
 root.window=root;vm.createContext(root);vm.runInContext(locales+read('ficard-lottery.js'),root);
 return {root,button,events,init:()=>callbacks.DOMContentLoaded.forEach(fn=>fn())};
}
test('saved lottery label uses Italian before i18n is ready and refreshes in every language',()=>{
 for(const lang of ['it','en','fr','es','pt','nl','de']){
  const {root,button,events}=setup(lang,true);
  // The market or card code can save a code before the async language script loads.
  root.localStorage.setItem=()=>{};root.FiCardLottery.store('ABC12345','CODE128');
  assert.equal(button.textContent,'Mostra codice lotteria degli scontrini');
  vm.runInContext(read('ficard-i18n.js'),root);events['ficard:languagechange']();
  assert.equal(button.textContent,root.FiCardLocales[lang].messages['lottery.show']);
  assert.equal(root.FiCardI18n.translateText('Codici utili'),root.FiCardLocales[lang].messages['useful.title']);
  assert.equal(root.FiCardI18n.translateText('Aggiungi tessera sanitaria · In preparazione'),root.FiCardLocales[lang].messages['health.soon']);
 }
});
test('new local feature messages preserve variables and cover all languages',()=>{
 const root={};vm.runInNewContext(locales,root);
 const it=root.FiCardLocales.it.messages;
 for(const [lang,locale] of Object.entries(root.FiCardLocales))for(const [key,value] of Object.entries(it).filter(([key])=>/^(useful|health|market|lottery)\./.test(key))){
  assert.ok(locale.messages[key],lang+': '+key);
  assert.deepEqual((locale.messages[key].match(/\{\w+\}/g)||[]).sort(),(value.match(/\{\w+\}/g)||[]).sort(),lang+': '+key);
 }
});
test('market status updates stay translated after a location change',()=>{
 for(const lang of ['it','en','fr','es','pt','nl','de']){
  const {root}=setup(lang,false),status={};
  vm.runInContext(read('ficard-i18n.js'),root);
  root.document.getElementById=id=>id==='marketStatus'?status:null;
  vm.runInContext(read('ficard-markets.js'),root);
  root.FiCardMarkets.setPosition({lat:41.9,lng:12.5,accuracy:10,timestamp:Date.now()});
  const m=root.FiCardLocales[lang].messages;
  assert.equal(status.textContent,m['market.status'].replace('{country}',m['market.it']).replace('{source}',m['market.gps']));
 }
});
