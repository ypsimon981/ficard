const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
test('duplicate warning covers 100m on the same card without deleting existing points',()=>{
 const source=html.slice(html.indexOf('const LOCATION_DUPLICATE_METERS='),html.indexOf('async function associateLocation('));
 const ctx={distanceM:(a,b)=>Math.abs(a.m-b.m),toast(){}};vm.createContext(ctx);vm.runInContext(source,ctx);
 const card={locations:[{m:0}]};
 for(const m of [0,25,50,99,100]){assert.ok(ctx.existingLocationNear(card,{m}));assert.equal(ctx.appendUniqueLocation(card,{m}),false);}
 assert.equal(card.locations.length,1);
 assert.equal(ctx.existingLocationNear({locations:[]},{m:0}),undefined);
 assert.equal(ctx.appendUniqueLocation(card,{m:101}),true);assert.equal(card.locations.length,2);
});
