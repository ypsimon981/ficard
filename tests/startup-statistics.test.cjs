const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../ficard-analytics.js'),'utf8');
function setup(off=false){
 const calls=[],values=new Map(off?[['ficard.analytics.aggregate.v1','no']]:[]);
 const root={document:{readyState:'loading',addEventListener(){},querySelector:()=>null,getElementById:()=>null},navigator:{onLine:true},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},setTimeout,clearTimeout,addEventListener(){},FICARD_ANALYTICS_CONFIG:{url:'https://example.supabase.co',key:'public'},fetch:async(url,options)=>{calls.push(JSON.parse(options.body));return {ok:true}}};
 root.window=root;root.parent=root;root.AbortController=AbortController;vm.runInNewContext(source,root);return {api:root.FiCardAnalytics,calls,values,root};
}
test('arrival times transmit only a fixed band, never raw milliseconds or a card identifier',async()=>{
 for(const [ms,bucket] of [[0,'lt1'],[999,'lt1'],[1000,'1to2'],[1999,'1to2'],[2000,'2to3'],[2999,'2to3'],[3000,'3to5'],[5000,'3to5'],[5001,'over5'],[30000,'over5']]){
  const s=setup();await s.api.arrivalLatency(ms);await s.api.arrivalLatency(ms+1);assert.equal(s.calls.length,1);assert.equal(s.calls[0].p_event,'arrival_time_'+bucket);assert.equal(s.calls[0].p_brand,null);assert.equal(s.calls[0].p_page,'home');assert.deepEqual(Object.keys(s.calls[0]).sort(),['p_brand','p_event','p_page']);
 }
});
test('each opening has one valid first-display outcome; invalid input cannot become free text',async()=>{
 for(const outcome of ['found','no_card','gps_denied','gps_unavailable','timeout','empty','error']){
  const s=setup();await s.api.startupOutcome('private name 123');await s.api.startupOutcome(outcome);await s.api.startupOutcome('found');assert.equal(s.calls.length,1);assert.equal(s.calls[0].p_event,'startup_'+outcome);assert.equal(s.calls[0].p_brand,null);
 }
 const s=setup();for(const value of [NaN,Infinity,-1,30001,'2800'])await s.api.arrivalLatency(value);assert.equal(s.calls.length,0);
});
test('opt-outs, offline mode and embedded scanners send no startup counters',async()=>{
 for(const mode of ['off','offline','embed']){
  const s=setup(mode==='off');if(mode==='offline')s.root.navigator.onLine=false;if(mode==='embed')s.root.parent={};await s.api.startupOutcome('timeout');await s.api.arrivalLatency(2800);assert.equal(s.calls.length,0);
 }
});
