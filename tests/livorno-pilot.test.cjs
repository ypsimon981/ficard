const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'livorno.html'),'utf8').split('<script>')[1].split('</script>')[0];
function page(fetch){
 const elements={out:{textContent:''},brand:{value:'lidl'},server:{disabled:false},local:{disabled:false}};
 const storage=new Map();
 const ctx={document:{getElementById:id=>elements[id],querySelectorAll:()=>[elements.brand,elements.server,elements.local]},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},performance,Date,AbortSignal,fetch};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 return {ctx,elements,storage,run:local=>ctx.run(local)};
}
test('pilot reads only server; completed results are cached and usable offline',async()=>{
 let requests=0;
 const p=page(async url=>{requests++;assert.match(url,/\/ficard-livorno-read\?brand=lidl$/);return {ok:true,json:async()=>({source:'cache',complete:true,count:1,stores:[{osm_id:1}],state:{fetched_at:new Date().toISOString()}})};});
 await p.run(false);assert.equal(p.storage.size,1);assert.match(p.elements.out.textContent,/Archivio completo/);
 p.ctx.fetch=()=>{throw Error('offline');};await p.run(true);
 assert.equal(requests,1);assert.match(p.elements.out.textContent,/Cache locale disponibile/);
});
test('pending or failed refresh never replaces the previous completed local cache',async()=>{
 const p=page(async()=>({ok:true,json:async()=>({source:'in_progress',complete:false,count:0,stores:[]})}));
 p.storage.set('ficard:livorno-pilot:v2:lidl','old');await p.run(false);
 assert.equal(p.storage.get('ficard:livorno-pilot:v2:lidl'),'old');assert.match(p.elements.out.textContent,/Importazione in corso/);
 p.ctx.fetch=async()=>{throw Error('timeout');};await p.run(false);
 assert.equal(p.storage.get('ficard:livorno-pilot:v2:lidl'),'old');assert.equal(p.elements.server.disabled,false);assert.equal(p.elements.brand.disabled,false);
});
test('expired offline cache is labelled expired',async()=>{
 const p=page(()=>{throw Error('must not fetch');});p.storage.set('ficard:livorno-pilot:v2:lidl',JSON.stringify({state:{fetched_at:'2020-01-01T00:00:00Z'},stores:[]}));await p.run(true);assert.match(p.elements.out.textContent,/scaduta/);
});
