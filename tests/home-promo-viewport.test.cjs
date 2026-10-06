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
test('app shell never positions the menu using unreliable viewport coordinates',()=>{
 const root=new Set(),body=new Set();
 const ctx={scannerBridge:false,document:{documentElement:{classList:{add:v=>root.add(v)}},body:{classList:{add:v=>body.add(v)}}}};
 vm.runInNewContext(source('ficard-viewport.js'),ctx);assert.ok(root.has('appShellRoot'));assert.ok(body.has('appShell'));
 root.clear();body.clear();ctx.scannerBridge=true;vm.runInNewContext(source('ficard-viewport.js'),ctx);assert.equal(root.size,0);assert.equal(body.size,0);
});
