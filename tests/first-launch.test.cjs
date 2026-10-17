const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
function setup(seed={},embedded=false){
 const data=new Map(Object.entries(seed)),listeners={},nodes={},bodyClasses=new Set();let reloads=0,market=null;
 function element(){return {className:'',setAttribute(){},appendChild(el){nodes[el.id]=el},after(el){nodes[el.id]=el},remove(){delete nodes[this.id]},focus(){},querySelector(sel){return this.fields?.[sel]||null},set innerHTML(html){this.html=html;this.fields={};for(const m of html.matchAll(/<input[^>]*id="([^"]+)"[^>]*>/g))this.fields['#'+m[1]]={checked:m[0].includes(' checked'),focus(){}};for(const m of html.matchAll(/<select id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)){const selected=m[2].match(/value="([^"]+)" selected/)||m[2].match(/value="([^"]+)"/);this.fields['#'+m[1]]={value:selected?.[1],focus(){}}}this.fields.input=Object.values(this.fields)[0];this.fields.form={}}}}
 nodes.marketSettingsBox=element();nodes.marketResidence=element();
 const ctx={localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},sessionStorage:{removeItem(){}},navigator:{language:'it-IT'},document:{readyState:'loading',getElementById:id=>nodes[id],createElement:element,addEventListener:(key,fn)=>listeners[key]=fn,body:{classList:{add:v=>bodyClasses.add(v),remove:v=>bodyClasses.delete(v)},appendChild:el=>nodes[el.id]=el}},location:{reload(){reloads++}},addEventListener(){},dispatchEvent(){},clearTimeout(){},setTimeout(){},CustomEvent:class{},FiCardMarkets:{read:()=>({residence:'IT',override:'auto'}),setPreferences:v=>market=v}};
 ctx.window=ctx;ctx.parent=embedded?{}:ctx;vm.createContext(ctx);for(const l of ['it','en','fr','es','pt','nl','de'])vm.runInContext(read('locales/'+l+'.js'),ctx);vm.runInContext(read('ficard-onboarding.js'),ctx);
 return {ctx,data,nodes,bodyClasses,show:()=>listeners.DOMContentLoaded(),get reloads(){return reloads},get market(){return market},submit(){nodes.firstLaunch.querySelector('form').onsubmit({preventDefault(){}})}};
}
test('first launch waits for confirmation, explains GPS without a checkbox and persists settings',async()=>{
 const s=setup();let ready=false;s.ctx.FiCardOnboarding.ready.then(()=>ready=true);s.show();await Promise.resolve();assert.equal(ready,false);
 const form=s.nodes.firstLaunch;assert.equal(form.querySelector('#welcomeGps'),null);assert.match(form.html,/Posizione GPS/);assert.equal(form.querySelector('#welcomeAnalytics').checked,true);
 form.querySelector('#welcomeResidence').value='FR';form.querySelector('#welcomeMarket').value='IT';form.querySelector('#welcomeAnalytics').checked=false;s.submit();await s.ctx.FiCardOnboarding.ready;
 assert.equal(s.ctx.FiCardOnboarding.pending(),false);assert.equal(s.ctx.FiCardOnboarding.gpsEnabled(),true);assert.equal(s.data.get('ficard.analytics.aggregate.v1'),'no');assert.equal(s.market.residence,'FR');assert.equal(s.market.override,'IT');assert.equal(s.nodes.firstLaunch,undefined);
 const again=setup(Object.fromEntries(s.data));again.show();assert.equal(again.nodes.firstLaunch,undefined);assert.equal(again.ctx.FiCardOnboarding.gpsEnabled(),true);
});
test('language preview preserves choices and confirmation reloads once into the selected language',()=>{
 const s=setup({'ficard.gps.enabled.v1':'no'});s.show();s.nodes.firstLaunch.querySelector('#welcomeResidence').value='FR';
 s.nodes.firstLaunch.querySelector('#welcomeLanguage').onchange({target:{value:'en'}});
 assert.match(s.nodes.firstLaunch.html,/Welcome to Fi-Card/);assert.equal(s.nodes.firstLaunch.querySelector('#welcomeResidence').value,'FR');assert.equal(s.nodes.firstLaunch.querySelector('#welcomeGps'),null);
 s.submit();assert.equal(s.reloads,1);assert.equal(s.data.get('ficard.language.v2'),'en');assert.equal(s.data.get('ficard.onboarding.complete.v1'),'yes');assert.equal(s.data.get('ficard.gps.enabled.v1'),'no');
});
test('existing opt-outs stay off and embedded scanners never show the introduction',()=>{
 const s=setup({'ficard.analytics.aggregate.v1':'no','ficard.gps.enabled.v1':'no'});s.show();assert.equal(s.nodes.firstLaunch.querySelector('#welcomeAnalytics').checked,false);s.submit();assert.equal(s.ctx.FiCardOnboarding.gpsEnabled(),false);
 const embedded=setup({},true);embedded.show();assert.equal(embedded.ctx.FiCardOnboarding.pending(),false);assert.equal(embedded.nodes.firstLaunch,undefined);
});
test('residence determines special card availability independently of the market',()=>{
 const ctx={window:null,document:{readyState:'loading',addEventListener(){},getElementById(){return null},body:{dataset:{}}},localStorage:{getItem(){return null},setItem(){}},addEventListener(){}};ctx.window=ctx;vm.runInNewContext(read('ficard-markets.js'),ctx);
 ctx.FiCardMarkets.setPreferences({residence:'IT',override:'FR'});assert.equal(ctx.FiCardMarkets.residentFeature('receiptLottery'),true);assert.equal(ctx.FiCardMarkets.enabled('receiptLottery'),false);
 ctx.FiCardMarkets.setPreferences({residence:'FR',override:'IT'});assert.equal(ctx.FiCardMarkets.residentFeature('receiptLottery'),false);assert.equal(ctx.FiCardMarkets.enabled('receiptLottery'),true);
});
test('GPS opt-out prevents both web and native permission requests, and the prompt waits for confirmation',async()=>{
 const html=read('index.html'),native=require('../scripts/native-html.cjs').nativeHtml(html,'index.html');
 for(const source of [html,native]){
  let pending=true,enabled=false,release,calls=0;
  const ready=new Promise(resolve=>release=resolve);
  const ctx={positionRequest:null,window:{FiCardOnboarding:{pending:()=>pending,ready,gpsEnabled:()=>enabled,disabledMessage:()=> 'disabled'},FiCardNative:{getPosition:async()=>{calls++;return {lat:1}}}}};
  ctx.navigator={geolocation:{getCurrentPosition:success=>{calls++;success({coords:{latitude:1,longitude:2,accuracy:10}})}}};
  vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function getPosition(){'),source.indexOf('function formatPositionAge(')),ctx);
  const request=ctx.getPosition();assert.equal(calls,0);pending=false;release();await assert.rejects(request,e=>e.code===1);assert.equal(calls,0);
  enabled=true;await ctx.getPosition();assert.equal(calls,1);
 }
});
test('aggregate counters cannot leave the device while first-launch choices are pending',async()=>{
 const calls=[],ctx={FiCardOnboarding:{pending:()=>true},localStorage:{getItem:()=>null},navigator:{onLine:true},document:{readyState:'loading',addEventListener(){}},FICARD_ANALYTICS_CONFIG:{url:'https://example.supabase.co',key:'public'},fetch:()=>{calls.push(1);return Promise.resolve({ok:true})}};ctx.window=ctx;ctx.parent=ctx;
 vm.runInNewContext(read('ficard-analytics.js'),ctx);assert.equal(await ctx.FiCardAnalytics.track('app_open','home'),false);assert.equal(calls.length,0);
});
