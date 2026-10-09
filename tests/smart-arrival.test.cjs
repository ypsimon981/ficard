const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),ui=fs.readFileSync(path.join(root,'ficard-stores-ui.js'),'utf8');
const section=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
test('GPS focus keeps all cards and enables the depth carousel',()=>{
 const c=fixture(),classes=new Set(),items=[0,1,2].map(i=>({offsetLeft:i*200,offsetWidth:250,style:{setProperty(k,v){this[k]=v}}}));
 const box={innerHTML:'',scrollLeft:0,classList:{add:k=>classes.add(k),contains:k=>classes.has(k),remove(...keys){keys.forEach(k=>classes.delete(k))},toggle(k,v){if(v)classes.add(k);else classes.delete(k)}},querySelectorAll:()=>items},label={};
 c.cards=[card('near','a'),card('far','b'),card('third','b')];c.cards.forEach((x,i)=>x.locations=[point(i?500+i*100:5)]);
 Object.assign(c,{document:{getElementById:id=>id==='smartCarousel'?box:label},brandFor:()=>({}),brandLogoHtml:()=>'',cardInk:()=>'',esc:String,bindCardInteractions(){},queueSmartDepth(){},refreshPosition(){}});
 vm.runInContext(section(html,'function nearbyCardCount()','let smartDepthFrame=')+section(html,'function smartMallPages(','function renderAll(){'),c);
 c.renderSmartCarousel();
 assert.equal((box.innerHTML.match(/data-card-open=/g)||[]).length,3);assert.ok(classes.has('proximityFocus'));assert.ok(classes.has('depthCarousel'));assert.match(label.textContent,/scorri/);
 assert.equal(items[0].style['--smart-scale'],'1');assert.equal(items[1].style['--smart-scale'],'0.85');
 box.scrollLeft=200;c.updateSmartDepth();assert.equal(items[1].style['--smart-scale'],'1');
 assert.equal(items[0].style['--smart-turn'],'10deg');assert.equal(items[2].style['--smart-turn'],'-10deg');
 assert.ok(classes.has('largeQuickCards'));assert.doesNotMatch(box.innerHTML,/class="name"/);assert.match(box.innerHTML,/aria-label="Apri near"/);
});
test('quick cards require precise GPS and show all located cards',()=>{
 for(const gps of [false,true]){
  const c=fixture(),classes=new Set(),items=[0,1,2].map(i=>({offsetLeft:i*200,offsetWidth:250,style:{setProperty(k,v){this[k]=v}}}));
  const box={innerHTML:'',scrollLeft:0,classList:{add:k=>classes.add(k),contains:k=>classes.has(k),remove(...keys){keys.forEach(k=>classes.delete(k))},toggle(k,v){if(v)classes.add(k);else classes.delete(k)}},querySelectorAll:()=>items},label={};
  c.cards=['a','b','c'].map(id=>({...card(id,'a'),locations:[point(60)]}));if(!gps)c.currentPos=null;
  Object.assign(c,{document:{getElementById:id=>id==='smartCarousel'?box:label},brandFor:()=>({}),brandLogoHtml:()=>'',cardInk:()=>'',esc:String,bindCardInteractions(){},queueSmartDepth(){},refreshPosition(){}});
  vm.runInContext(section(html,'function nearbyCardCount()','let smartDepthFrame=')+section(html,'function smartMallPages(','function renderAll(){'),c);c.renderSmartCarousel();
  assert.ok(classes.has('largeQuickCards'));assert.equal(classes.has('denseNearby'),gps);assert.equal((box.innerHTML.match(/data-card-open=/g)||[]).length,gps?3:0);assert.doesNotMatch(box.innerHTML,/class="name"/);
 }
});
function fixture(){const ctx={cards:[],results:[],currentPos:{lat:0,lng:0,accuracy:10},BRANDS:{a:{},b:{}},inferredBrandKey:c=>c.brandKey,S:{},searchCenter:null,savedFavorite:l=>l.favorite===true};vm.createContext(ctx);
vm.runInContext(section(html,'function cardAliasHtml(','function cardHtml('),ctx);
vm.runInContext(section(html,'function distanceM(','function smartCard()')+section(html,'function quickPositionReady()','function nearbyCardCount()'),ctx);
vm.runInContext(section(ui,'function savedAt(','function storeBrand(')+section(ui,'smartShopCandidates=function()','function resetShopFilters()'),ctx);return ctx}
const card=(id,key)=>({id,name:id,brandKey:key,locations:[]});const point=(meters,id)=>({lat:meters/6371000*180/Math.PI,lng:0,osmId:id});
test('OSM transient shops determine ordering even without saved locations',()=>{const c=fixture();c.cards=[card('a','a'),card('b','b')];c.results=[{cardId:'a',point:point(300,'node/1')},{cardId:'b',point:point(5,'node/2')}];assert.equal(c.smartOrder().ordered[0].id,'b');assert.equal(c.arrivalCard(c.smartOrder().ordered,c.currentPos).id,'b');assert.equal(c.cards[1].locations.length,0)});
test('multiple nearby physical shops suppress the message, even for one card',()=>{const c=fixture();c.cards=[card('a','a')];c.results=[{cardId:'a',point:point(5,'node/1')},{cardId:'a',point:point(6,'node/2')}];assert.equal(c.arrivalCard(c.cards,c.currentPos),null)});
test('multiple cards matching one OSM shop count as one shop',()=>{const c=fixture();c.cards=[card('a','a'),card('a2','a')];c.results=c.cards.map(x=>({cardId:x.id,point:point(5,'node/1')}));assert.equal(c.arrivalCard(c.cards,c.currentPos).id,'a')});
test('message requires strictly below 50 m and a GPS position',()=>{const c=fixture();c.cards=[card('a','a')];c.cards[0].locations=[point(50.01)];assert.equal(c.arrivalCard(c.cards,c.currentPos),null);c.cards[0].locations=[point(49.99)];assert.equal(c.arrivalCard(c.cards,c.currentPos).id,'a');assert.equal(c.arrivalCard(c.cards,null),null)});
