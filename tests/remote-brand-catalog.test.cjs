const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const script=fs.readFileSync('ficard-catalog.js','utf8');
const row={brand_key:'nuovo',name:'Nuovo marchio',category:'supermercati',color:'#336699',logo_url:'https://fi-card.app/developer/api.php?action=public_logo&key=nuovo&revision=1',logo_scale:72,revision:1,status:'published'};
function fixture({values=new Map(),images=new Map(),online=true,fetch}={}){
 const handlers={},ctx={BRANDS:{conad:{name:'Conad',color:'#FFFF00'}},CATEGORIES:{supermercati:'Supermercati',altro:'Altro'},AbortController,setTimeout,clearTimeout,URL:class extends URL{static createObjectURL(){return 'blob:cached-logo'}},navigator:{onLine:online},localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},document:{readyState:'loading',addEventListener:(k,f)=>handlers[k]=f,getElementById:()=>null},addEventListener(){},renderAll(){},fetch:fetch||(async()=>{throw Error('offline')}),caches:{open:async()=>({match:async u=>images.get(u)?.clone(),put:async(u,r)=>images.set(u,r)})}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(script,ctx);return {ctx,api:ctx.FiCardCatalog,handlers,values,images};
}
test('new published brands appear without changing the bundled app and logos survive an offline restart',async()=>{
 const f=fixture({fetch:async u=>u.includes('public_catalog')?{ok:true,json:async()=>({version:'hash-1',brands:[row]})}:new Response('PNG',{headers:{'Content-Type':'image/png'}})});
 assert.equal(await f.api.sync(),true);assert.equal(f.ctx.BRANDS.nuovo.name,row.name);assert.equal(f.ctx.BRANDS.nuovo.logo,'blob:cached-logo');assert.equal(f.ctx.BRANDS.nuovo.logoScale,72);
 const offline=fixture({values:f.values,images:f.images,online:false});await offline.handlers.DOMContentLoaded();assert.equal(offline.ctx.BRANDS.nuovo.logo,'blob:cached-logo');assert.equal(await offline.api.sync(),false);
});
test('failed or malformed catalog responses retain the working cached brands',async()=>{
 const f=fixture();await f.api.applyRows([row]);f.ctx.fetch=async()=>({ok:true,json:async()=>({version:'bad',brands:[{...row,logo_url:'https://other.example/private'}]})});assert.equal(await f.api.sync(),false);assert.equal(f.ctx.BRANDS.nuovo.name,row.name);
});
test('drafts do not appear, and removing remote overrides restores bundled artwork',async()=>{
 const f=fixture();await f.api.applyRows([{...row,status:'draft'}]);assert.equal(f.ctx.BRANDS.nuovo,undefined);
 await f.api.applyRows([{...row,brand_key:'conad'}]);assert.equal(f.ctx.BRANDS.conad.color,row.color);await f.api.applyRows([]);assert.equal(f.ctx.BRANDS.conad.color,'#FFFF00');
});
