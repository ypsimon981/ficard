const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../ficard-stores-ui.js'),'utf8');
test('new brands queue discovery without awaiting network; edits do not restart it; offline defers to online',async()=>{
 let pending=null,signature='old',saved=0,searches=0;
 const result=Promise.resolve(),ctx={descriptors:()=>[signature],save:()=>{saved++;return result},setTimeout:fn=>(pending=fn,1),clearTimeout(){},busy:false,navigator:{onLine:true},currentPos:{lat:41.9,lng:12.4},matchCachedShops(){},search:async()=>{searches++},window:{addEventListener:(event,fn)=>{ctx.online=fn}},console};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('let discoveryTimer='),source.indexOf('function openMapForCard(')),ctx);
 assert.equal(ctx.save(),result);assert.equal(pending,null);
 signature='new';assert.equal(ctx.save(),result);assert.equal(searches,0);await pending();assert.equal(searches,1);
 pending=null;ctx.save();assert.equal(pending,null);assert.equal(saved,3);
 signature='import';ctx.navigator.onLine=false;ctx.save();await pending();assert.equal(searches,1);
 ctx.navigator.onLine=true;ctx.online();await pending();assert.equal(searches,2);
});
