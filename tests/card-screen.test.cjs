const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function setup(request){const state={detail:false,full:false},listeners={},status={textContent:''};const ctx={navigator:{wakeLock:{request}},document:{visibilityState:'visible',getElementById:id=>({classList:{contains:()=>state[id==='detailModal'?'detail':'full']}}),querySelectorAll:()=>[status],addEventListener:(n,f)=>listeners[n]=f},window:{addEventListener(){}},cards:[],confirm:()=>true};vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('let cardWakeLock='),source.indexOf('function openCard(')),ctx);return {ctx,state,listeners,status}}
test('native maximum brightness follows fullscreen and resets on close or background',async()=>{
 const {ctx,state}=setup(async()=>({released:false,release:async()=>{},addEventListener(){}})),calls=[];
 ctx.window.FiCardNative={setFullScreen:async active=>calls.push(active)};
 state.detail=true;await ctx.syncCardScreen();assert.equal(calls.at(-1),false);
 state.full=true;await ctx.syncCardScreen();assert.equal(calls.at(-1),true);
 ctx.document.visibilityState='hidden';await ctx.syncCardScreen();assert.equal(calls.at(-1),false);
 ctx.document.visibilityState='visible';await ctx.syncCardScreen();assert.equal(calls.at(-1),true);
 state.full=false;await ctx.syncCardScreen();assert.equal(calls.at(-1),false);
});
test('screen lock follows card display and reacquires on return',async()=>{let calls=0,releases=0;const {ctx,state,status}=setup(async()=>{calls++;return {released:false,release:async()=>{releases++},addEventListener(){}}});state.detail=true;await ctx.syncCardScreen();await ctx.syncCardScreen();assert.equal(calls,1);assert.match(status.textContent,/mantenuto acceso/);state.full=true;state.detail=false;await ctx.syncCardScreen();assert.equal(releases,0);ctx.document.visibilityState='hidden';await ctx.syncCardScreen();assert.equal(releases,1);ctx.document.visibilityState='visible';await ctx.syncCardScreen();assert.equal(calls,2);state.full=false;await ctx.syncCardScreen();assert.equal(releases,2)});
test('closing before async acquisition releases the late lock',async()=>{let resolve,released=0;const {ctx,state}=setup(()=>new Promise(r=>resolve=r));state.detail=true;const pending=ctx.syncCardScreen();state.detail=false;resolve({release:async()=>released++});await pending;assert.equal(released,1)});
test('unsupported and refused locks leave the card usable',async()=>{const {ctx,state,status}=setup(async()=>{throw Error('denied')});state.detail=true;await ctx.syncCardScreen();assert.match(status.textContent,/non disponibile/);delete ctx.navigator.wakeLock;await ctx.syncCardScreen();assert.match(status.textContent,/luminosità/)});
test('duplicate advice allows keeping or cancelling exact content',()=>{const {ctx}=setup(async()=>{});ctx.cards=[{name:'Carta',code:'0012'}];ctx.confirm=()=>false;assert.equal(ctx.confirmPossibleDuplicate('0012'),false);assert.equal(ctx.confirmPossibleDuplicate('12'),true);ctx.confirm=()=>true;assert.equal(ctx.confirmPossibleDuplicate('0012'),true)});
