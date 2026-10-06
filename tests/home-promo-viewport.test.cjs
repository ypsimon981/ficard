const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=n=>fs.readFileSync(path.join(__dirname,'../',n),'utf8');
test('promo random deck includes every message once per cycle and never repeats adjacent messages or colors',()=>{
 const message={textContent:'',animate(){}},colors=[],messages=[],banner={style:{setProperty:(k,v)=>colors.push(v)},addEventListener(){},contains:()=>false,getClientRects:()=>[{}],getBoundingClientRect:()=>({top:100,bottom:200})};let tick;
 const document={querySelector:s=>s==='.scanPromo'?banner:null,getElementById:()=>message};vm.runInNewContext(source('ficard-promo.js'),{document,window:{innerHeight:800,matchMedia:()=>({matches:false})},scannerBridge:false,setInterval:fn=>tick=fn});
 messages.push(message.textContent);for(let i=0;i<59;i++){tick();messages.push(message.textContent)}
 for(let i=0;i<messages.length;i+=6)assert.equal(new Set(messages.slice(i,i+6)).size,6);
 for(let i=1;i<messages.length;i++){assert.notEqual(messages[i],messages[i-1]);assert.notEqual(colors[i],colors[i-1])}
 document.hidden=true;tick();assert.equal(message.textContent,messages.at(-1));
});
test('iPhone menu tracks visible viewport bottom after scroll, keyboard resize and restore',()=>{
 const callbacks={},values={},classes=new Set(),nav={offsetHeight:95,style:{setProperty:(k,v)=>values[k]=v},classList:{add:x=>classes.add(x)}},viewport={pageTop:0,height:844,offsetTop:0,addEventListener:(e,fn)=>callbacks[e]=fn};
 let render;const ctx={navigator:{userAgent:'iPhone'},document:{querySelector:()=>nav},window:{visualViewport:viewport,addEventListener(){},scrollY:0},scannerBridge:false,requestAnimationFrame:fn=>{render=fn;return 1}};
 vm.runInNewContext(source('ficard-viewport.js'),ctx);assert.equal(values['--nav-page-top'],'749px');assert.ok(classes.has('viewportAnchored'));
 viewport.pageTop=1300;callbacks.scroll();render();assert.equal(values['--nav-page-top'],'2049px');
 viewport.height=420;callbacks.resize();render();assert.equal(values['--nav-page-top'],'1625px');
 viewport.height=844;callbacks.resize();render();assert.equal(values['--nav-page-top'],'2049px');
});
