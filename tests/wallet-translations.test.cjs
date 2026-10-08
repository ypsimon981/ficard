const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('wallet, duplicate warning and GPS relative times translate in every supported language',()=>{
 for(const lang of ['en','fr','es','pt','nl','de']){
  const root={localStorage:{getItem:()=>lang},navigator:{language:lang},document:{readyState:'loading',addEventListener(){}},addEventListener(){}};
  vm.runInNewContext(read('ficard-i18n.js'),{window:root});
  const api=root.FiCardI18n;
  for(const value of ['4 m da te','3,8 km da te','Non cercare la tua card, è lei che trova te.','Distanza non disponibile','Punto già associato a questa carta. Scegli un altro negozio.','Posizione · 17 s fa · ±7 m','Posizione · 2 min fa · ±7 m','Posizione · 1 gg fa · ±7 m']){
   assert.notEqual(api.translateText(value),value,lang+': '+value);
   assert.doesNotMatch(api.translateText(value),/da te| s fa| min fa| gg fa|Non cercare|già associato/);
  }
  if(lang==='en')assert.equal(api.translateText('3,8 km da te'),'3.8 km away');
  for(const key of Object.keys(api.messages.it))assert.ok(api.messages[lang][key],lang+': missing '+key);
 }
});
test('tips use the saved/device language before async i18n loads and rerender on ready',()=>{
 for(const lang of ['en','fr','es','pt','nl','de']){
  const items={'ficard.language.v2':lang},events={},banner={innerHTML:''};
  const root={localStorage:{getItem:k=>items[k]||null,setItem:(k,v)=>items[k]=v},sessionStorage:{getItem:()=>null,setItem(){}},navigator:{language:lang},document:{readyState:'loading',addEventListener(){},getElementById:()=>banner},addEventListener:(name,fn)=>events[name]=fn};
  vm.runInNewContext(read('ficard-content.js'),{window:root,Math});
  assert.doesNotMatch(root.FiCardContent.html('banner',true),/Consiglio|Scegli i preferiti|>Apri</);
  root.FiCardI18n={language:()=>lang};events['ficard:languagechange']();
  assert.doesNotMatch(banner.innerHTML,/Consiglio|Scegli i preferiti|>Apri</);
 }
 assert.match(read('ficard-i18n.js'),/dispatchEvent\(new root.CustomEvent\('ficard:languagechange'/);
});
