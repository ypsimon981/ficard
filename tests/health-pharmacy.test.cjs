const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
function setup(){const ctx=vm.createContext({window:{},URLSearchParams,AbortController,setTimeout,clearTimeout});vm.runInContext(fs.readFileSync('ficard-stores.js','utf8'),ctx);require('./health-fixture.cjs')(ctx,html);return ctx}
const health={id:'health',kind:'health-it',name:'Tessera sanitaria'},other={id:'other',brandKey:'store',name:'Negozio'};
const node=(id,tags,meters=id*100)=>({id,type:'node',lat:meters/111320,lon:0,tags});
test('health card matches pharmacy category and legacy Italian names, excludes unrelated shops',()=>{
 const c=setup(),S=c.window.FiCardStores,ds=[{id:health.id,healthCard:true,names:['Farmacia']}];
 const data={elements:[node(1,{amenity:'pharmacy',name:'Comunale'}),node(2,{name:'Farmacia Centrale'}),node(3,{shop:'chemist',name:'Parafarmacia'}),node(4,{amenity:'fuel',name:'Farmacia'}),node(5,{shop:'supermarket',name:'Farmacia'}),node(6,{name:'Parafarmacia'}),node(7,{amenity:'pharmacy'})]};
 const cached=S.mergeCache(null,data);assert.equal(cached.elements.find(x=>x.id===1).tags.amenity,'pharmacy');assert.ok(cached.elements.find(x=>x.id===7));
 assert.deepEqual(Array.from(S.parse(cached,ds),x=>x.point.osmId),['node/1','node/2','node/7']);
});
test('health card is magnified only at one close pharmacy with precise GPS',()=>{
 const c=setup();c.distanceM=(p,l)=>l.m;c.inferredBrandKey=x=>x.brandKey||'';c.smartShopCandidates=()=>c.candidates;
 vm.runInContext(html.slice(html.indexOf('function arrivalCard('),html.indexOf('function nearbyCardCount(')),c);
 const pharmacy={m:10,osmId:'node/1'},shop={m:40,osmId:'node/2'};
 c.candidates=[{c:health,l:pharmacy}];assert.equal(c.arrivalCard([health],{accuracy:10}),health);
 assert.equal(c.arrivalCard([health],{accuracy:100}),null);assert.equal(c.arrivalCard([health],{}),null);
 c.candidates=[{c:health,l:{...pharmacy,m:35}}];assert.equal(c.arrivalCard([health],{accuracy:10}),null);
 c.candidates=[{c:health,l:pharmacy},{c:other,l:shop}];assert.equal(c.arrivalCard([health,other],{accuracy:10}),null);
 // A chain fidelity card at the same pharmacy must not displace the health card.
 c.candidates=[{c:health,l:pharmacy},{c:other,l:pharmacy}];assert.equal(c.arrivalCard([other,health],{accuracy:10}),health);
 c.candidates=[{c:other,l:pharmacy}];assert.equal(c.arrivalCard([other],{accuracy:10}),other);
});

test('ministerial pharmacies survive offline caching and match health card',()=>{
 const c=setup(),S=c.window.FiCardStores,point={type:'pharmacy-it',id:123,lat:41.91,lon:12.41,tags:{amenity:'pharmacy',name:'Comunale',source:'Ministero della Salute','ref:msal':'123','addr:street':'Via Roma, 1'}};
 const cache=S.mergeCache({pharmacyZones:[{bounds:[41.9,12.4,41.95,12.45],at:Date.now()}]},{elements:[point]});
 const found=S.parse(cache,[{id:'health',healthCard:true,names:['Farmacia']}]);assert.equal(found.length,1);assert.equal(found[0].point.osmId,'pharmacy-it/123');assert.equal(found[0].point.source,'ministero-salute');assert.equal(cache.elements[0].tags['ref:msal'],'123');assert.equal(cache.pharmacyZones.length,1);
});
