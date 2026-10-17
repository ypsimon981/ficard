const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('let arrivalTimingRecord='),html.indexOf('const arrivalGrid='));
function setup(){
 let time=0,loading=true,id='card-one';const frames=[],label={dataset:{},innerHTML:''};
 const tile={querySelector:q=>q==='[data-card-open]'?{dataset:{cardOpen:id}}:label};
 const root={};
 const c={window:root,document:{body:{classList:{contains:()=>loading}},getElementById:()=>({classList:{contains:()=>true}}),querySelector:()=>tile},performance:{now:()=>time},requestAnimationFrame:fn=>frames.push(fn),queueArrivalFit(){},esc:String,Intl};
 root.addEventListener=()=>{};vm.createContext(c);vm.runInContext(source,c);
 return {c,label,set time(value){time=value},set loading(value){loading=value},set id(value){id=value},flush(){while(frames.length)frames.shift()()}};
}
test('arrival time includes loading and is captured only after the hero is displayed',()=>{
 const s=setup();s.time=1500;s.c.queueArrivalTiming();s.flush();assert.equal(s.label.innerHTML,'');s.loading=false;s.time=2834;s.c.queueArrivalTiming();assert.equal(s.label.innerHTML,'');s.flush();assert.match(s.label.innerHTML,/2,83 secondi/);assert.match(s.label.innerHTML,/ha trovato te <span class="arrivalElapsed">in/);assert.doesNotMatch(s.label.innerHTML,/<br|circa/);
 s.time=9000;s.label.dataset={};s.c.queueArrivalTiming();assert.match(s.label.innerHTML,/2,83 secondi/);
});
test('arrival display retains two decimals including trailing zeroes and subsecond times',()=>{
 for(const [ms,display] of [[2800,'2,80'],[1000,'1,00'],[340,'0,34']]){const s=setup();s.loading=false;s.time=ms;s.c.queueArrivalTiming();s.flush();assert.ok(s.label.innerHTML.includes(display+' secondi'))}
});
test('a different card does not inherit the first card startup timing',()=>{
 const s=setup();s.loading=false;s.time=3100;s.c.queueArrivalTiming();s.flush();s.id='card-two';s.label.innerHTML='';s.label.dataset={};s.c.queueArrivalTiming();s.flush();assert.equal(s.label.innerHTML,'');
});
test('a shop reached later is not reported as an app-start discovery',()=>{
 const s=setup();s.loading=false;s.time=60000;s.c.queueArrivalTiming();s.flush();assert.equal(s.label.innerHTML,'');
});
