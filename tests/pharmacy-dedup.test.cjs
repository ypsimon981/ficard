const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const root={};vm.runInNewContext(fs.readFileSync('ficard-stores.js','utf8'),{window:root});const S=root.FiCardStores;
const osm={lat:41.9,lng:12.4,osmId:'node/12',source:'osm-discovered',name:'Farmacia Jungano Kim',address:'Via della Pisana 116'};
const ministry={lat:41.902,lng:12.4,osmId:'pharmacy-it/3',source:'ministero-salute',name:'FARMACIA JUNGANO SNC DELLA DR.SSA MARIA VITA JUNGANO & C.',address:'Via DELLA PISANA, 116 M/N/L L/E ROMA'};
test('national and OSM records tolerate address suffixes and coordinate offsets without merging other branches',()=>{
 assert.ok(S.sameStore(osm,ministry));assert.ok(S.sameStore(ministry,osm));
 assert.equal(S.sameStore(osm,{...ministry,address:'Via della Pisana, 118 ROMA',lat:41.9001}),false);
 assert.equal(S.sameStore(osm,{...ministry,address:'Via Roma 116'}),false);
 assert.equal(S.sameStore(osm,{...ministry,lat:41.91}),false);
 assert.equal(S.sameStore(osm,{...ministry,address:'',name:'Farmacia Centrale'}),false);
 assert.ok(S.sameStore(osm,{...ministry,lat:41.901,address:''}));
 assert.equal(S.sameStore({...osm,name:'Farmacia'}, {...ministry,lat:41.901,name:'Farmacia',address:''}),false);
 assert.ok(S.sameStore({...osm,address:'Via 20 Settembre 116'},{...ministry,address:'Via 20 Settembre, 116 ROMA'}));
});
test('parser chooses one OSM location in either input order and preserves distinct pharmacies',()=>{
 const element=p=>({type:p.source==='ministero-salute'?'pharmacy-it':'node',id:p.source==='ministero-salute'?3:12,lat:p.lat,lon:p.lng,tags:{amenity:'pharmacy',name:p.name,'addr:street':p.address}});
 for(const elements of [[element(osm),element(ministry)],[element(ministry),element(osm)]]){
  const rows=S.parse({elements},[{id:'health',healthCard:true,names:['Farmacia']}]);assert.equal(rows.length,1);assert.equal(rows[0].point.osmId,osm.osmId);assert.equal(rows[0].point.lat,osm.lat);
 }
});
test('a saved favourite matches the duplicate from the other archive without losing the saved point',()=>{
 const ui=fs.readFileSync('ficard-stores-ui.js','utf8'),card={id:'health',kind:'health-it',name:'Tessera sanitaria',locations:[{...ministry,favorite:true}]};
 const ctx=vm.createContext({S,isHealthCard:c=>c.kind==='health-it',distanceM:(a,b)=>Math.abs(a.lat-b.lat)*111320,allVisibleCards:()=>[card],results:[{cardId:card.id,point:osm}],savedFavorite:l=>l.favorite===true,storeBrand:()=>({key:'farmacia'}),currentPos:{lat:41.9,lng:12.4},searchCenter:null});
 vm.runInContext(ui.slice(ui.indexOf('function savedAt('),ui.indexOf('function storeBrand(')),ctx);
 assert.equal(ctx.savedAt(card,osm),card.locations[0]);const rows=ctx.shops();assert.equal(rows.length,1);assert.equal(rows[0].favorite,true);assert.equal(rows[0].l,card.locations[0]);assert.equal(card.locations.length,1);
});
