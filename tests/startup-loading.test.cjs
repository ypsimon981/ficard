const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('async function startFiCard(){'),html.indexOf('\nif(scannerBridge){',html.indexOf('async function startFiCard(){')));
function setup(count=1){
 let resolveLoad,resolvePosition,shown=0,renders=0,positionCalls=0;
 const frames=[],timers=new Map(),outcomes=[],load=new Promise(resolve=>resolveLoad=resolve),position=new Promise(resolve=>resolvePosition=resolve);
 const ctx={cards:Array(count).fill({}),document:{readyState:'complete',querySelector:()=>({setAttribute(){}})},load:()=>load,refreshPosition:()=>{positionCalls++;return position},renderAll:()=>renders++,window:{finishFiCardStartup:()=>shown++,FiCardAnalytics:{startupOutcome:outcome=>outcomes.push(outcome)}},requestAnimationFrame:fn=>frames.push(fn),setTimeout:(fn,delay)=>{timers.set(delay,fn);return delay},clearTimeout:id=>timers.delete(id)};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 return {ctx,timers,outcomes,resolveLoad,resolvePosition,flush(){while(frames.length)frames.shift()()},get shown(){return shown},get renders(){return renders},get positionCalls(){return positionCalls}};
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
test('first-display outcomes distinguish GPS failures, empty wallets and a rendered hero',async()=>{
 for(const [status,expected] of [['ready','no_card'],['gps_denied','gps_denied'],['gps_unavailable','gps_unavailable'],['timeout','timeout']]){
  const s=setup(),done=s.ctx.startFiCard();s.resolveLoad();await new Promise(setImmediate);s.resolvePosition(status);await done;s.flush();assert.deepEqual(s.outcomes,[expected]);
 }
 const found=setup(),done=found.ctx.startFiCard();found.resolveLoad();found.resolvePosition('ready');await done;found.ctx.arrivalTimingRecord={id:'card-one',ms:2800};found.flush();assert.deepEqual(found.outcomes,['found']);
 const empty=setup(0),emptyDone=empty.ctx.startFiCard();empty.resolveLoad();await emptyDone;empty.flush();assert.deepEqual(empty.outcomes,['empty']);
});
