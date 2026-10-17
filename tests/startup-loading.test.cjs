const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('async function startFiCard(){'),html.indexOf('\nif(scannerBridge){',html.indexOf('async function startFiCard(){')));
function setup(count=1){
 let resolveLoad,resolvePosition,shown=0,renders=0,positionCalls=0;
 const frames=[],timers=new Map(),load=new Promise(resolve=>resolveLoad=resolve),position=new Promise(resolve=>resolvePosition=resolve);
 const ctx={cards:Array(count).fill({}),document:{readyState:'complete',querySelector:()=>({setAttribute(){}})},load:()=>load,refreshPosition:()=>{positionCalls++;return position},renderAll:()=>renders++,window:{finishFiCardStartup:()=>shown++},requestAnimationFrame:fn=>frames.push(fn),setTimeout:(fn,delay)=>{timers.set(delay,fn);return delay},clearTimeout:id=>timers.delete(id)};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 return {ctx,timers,resolveLoad,resolvePosition,flush(){while(frames.length)frames.shift()()},get shown(){return shown},get renders(){return renders},get positionCalls(){return positionCalls}};
}
test('startup keeps provisional cards hidden until archive and first GPS render are ready',async()=>{
 const s=setup(),done=s.ctx.startFiCard();assert.equal(s.positionCalls,0);s.resolveLoad();await new Promise(setImmediate);assert.equal(s.positionCalls,1);assert.equal(s.shown,0);s.resolvePosition();await done;assert.equal(s.renders,1);assert.equal(s.shown,0);s.flush();assert.equal(s.shown,1);assert.equal(s.timers.size,0);
});
test('slow GPS stops blocking the wallet after five seconds',async()=>{
 const s=setup(),done=s.ctx.startFiCard();s.resolveLoad();await new Promise(setImmediate);s.timers.get(5000)();await done;s.flush();assert.equal(s.shown,1);assert.equal(s.renders,1);
});
test('empty wallet does not wait for GPS and failed storage does not trap the loading screen',async()=>{
 const s=setup(0),done=s.ctx.startFiCard();s.resolveLoad();await done;s.flush();assert.equal(s.shown,1);
 const failed=setup();failed.ctx.load=()=>Promise.reject(Error('storage unavailable'));await assert.rejects(failed.ctx.startFiCard());failed.flush();assert.equal(failed.shown,1);
});
