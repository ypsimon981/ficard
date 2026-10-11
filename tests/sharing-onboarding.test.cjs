const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const html=read('index.html');
function ghostContext(){
 const saved={},ctx={localStorage:{getItem:k=>saved[k],setItem:(k,v)=>saved[k]=v,removeItem:k=>delete saved[k]},inferredBrandKey:c=>c.brandKey,esc:String,window:{},BRANDS:{conad:{name:'Conad',color:'#f00'},carrefour:{name:'Carrefour',color:'#fff'}},cardInk:()=> '#000',brandLogoHtml:b=>b.name,unifiedCardHtml:c=>'<real>'+c.id+'</real>',advertisingPreviewHtml:()=>'<ad/>'};
 vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('function onboardingGhostKeys('),html.indexOf('// Fit the translated arrival')),ctx);return ctx;
}
test('ghosts progressively disappear, avoid owned brands and stay gone after completing onboarding',()=>{
 const c=ghostContext(),cards=[];
 assert.deepEqual(Array.from(c.onboardingGhostKeys(cards)),['conad','carrefour','']);
 cards.push({id:'1',brandKey:'carrefour'});assert.deepEqual(Array.from(c.onboardingGhostKeys(cards)),['conad','']);
 cards.push({id:'2',brandKey:'conad'});assert.deepEqual(Array.from(c.onboardingGhostKeys(cards)),['']);
 cards.push({id:'3',brandKey:'other'});assert.equal(c.onboardingGhostKeys(cards).length,0);
 cards.pop();assert.equal(c.onboardingGhostKeys(cards).length,0);
 assert.equal(cards.length,2);assert.ok(cards.every(card=>card.id));
 cards.length=0;assert.equal(c.onboardingGhostKeys(cards).length,3);
});
test('fourth slot follows three visible cards at zero, one, two and three saved cards',()=>{
 for(let count=0;count<=3;count++){
  const c=ghostContext(),cards=Array.from({length:count},(_,i)=>({id:String(i),brandKey:'other'}));
  const result=c.mainCardTiles(cards,true,null,c.onboardingGhostKeys(cards));
  assert.equal((result.match(/data-ghost-add=/g)||[]).length,3-count);
  assert.equal((result.match(/<real>/g)||[]).length,count);
  assert.ok(result.endsWith('<ad/>'));assert.equal((result.match(/<ad\/>/g)||[]).length,1);
  assert.doesNotMatch(result,/data-card-open|barcode|data-card-id/);
 }
 const c=ghostContext();assert.equal(c.mainCardTiles([],false,null), '');
});
test('ghost actions use the existing add flow and are hidden from search/favourite/category results',()=>{
 assert.match(html,/!q&&\['used','all','name'\]\.includes\(active\)\?ghostKeys:\[\]/);
 assert.match(html,/querySelectorAll\('\[data-ghost-add\]'\).*getElementById\('addFab'\)\.click\(\)/);
 assert.match(read('ficard-polish.css'),/\.ghostFace\{[^}]*opacity:\.5/);
});
test('three sharing messages and always-visible disclaimer render in all seven languages',()=>{
 for(const lang of ['it','en','fr','es','pt','nl','de']){
  const events={},panel={innerHTML:''},banner={innerHTML:''};
  const root={FiCardI18n:{language:()=>lang},localStorage:{getItem:()=>null,setItem(){}},sessionStorage:{getItem:()=>null,setItem(){}},navigator:{onLine:false},document:{readyState:'loading',addEventListener:(n,fn)=>events[n]=fn,getElementById:id=>id==='cardSharingMessages'?panel:banner},addEventListener(){}};
  vm.runInNewContext(read('ficard-content.js'),{window:root,Math:Object.assign(Object.create(Math),{random:()=>.99})});
  events.DOMContentLoaded();
  assert.equal((panel.innerHTML.match(/<details>/g)||[]).length,3);
  assert.match(panel.innerHTML,/<\/details><p class="sharingDisclaimer">[^<]+<\/p>$/);
  assert.match(root.FiCardContent.html('banner'),/data-content-sharing="true"/);
  assert.equal(root.FiCardContent.model('banner').view,'profile');
  if(lang==='it'){assert.match(panel.innerHTML,/in pochi tocchi/);assert.match(panel.innerHTML,/solo dove consentito/);}
  else assert.doesNotMatch(panel.innerHTML,/in pochi tocchi|Ti manca una carta/);
 }
});
