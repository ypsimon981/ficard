const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const nodes={},listeners={};let serial=0,shown=[];
function element(){return {hidden:false,disabled:false,textContent:'',value:'',style:{},contentWindow:{},children:[],listeners:{},classList:{add(){},remove(){}},addEventListener(k,fn){this.listeners[k]=fn},replaceChildren(){this.children=[]},append(x){this.children.push(x)},remove(){this.removed=true},querySelector(){return null}};}
const get=id=>nodes[id]||(nodes[id]=element()),body=element(),tabs=[element(),element()];
const context={console,location:{origin:'https://example.test'},crypto:{randomUUID:()=>String(++serial)},encodeURIComponent,document:{body,getElementById:get,querySelectorAll:()=>tabs,addEventListener(){},createElement:()=>element()},window:null,setTimeout:()=>1,clearTimeout(){},showCode:(...args)=>shown.push(args),setTab(){}};context.window=context;context.addEventListener=(k,fn)=>listeners[k]=fn;
vm.createContext(context);for(const file of ['ficard-reader.js','scandixit-scanner.js'])vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../'+file),'utf8'),context);
(async()=>{
 get('startCamera').listeners.click();const frame=body.children.at(-1);assert.match(frame.src,/^\.\/\?scanner=scandixit&request=1/);assert.equal(frame.allow,'camera');assert.equal(body.style.overflow,'hidden');
 const data={type:'ficard.scan.result',request:'1',code:'55338834090101772503222982',format:'CODE_128'};
 listeners.message({origin:'https://evil.test',source:frame.contentWindow,data});assert.equal(shown.length,0);
 listeners.message({origin:context.location.origin,source:{},data});assert.equal(shown.length,0);
 listeners.message({origin:context.location.origin,source:frame.contentWindow,data:{...data,request:'old'}});assert.equal(shown.length,0);
 listeners.message({origin:context.location.origin,source:frame.contentWindow,data});assert.equal(shown.length,1);assert.equal(shown[0][0],data.code);assert.equal(shown[0][2],'CODE_128');assert(frame.removed);assert.equal(body.style.overflow,'');
 listeners.message({origin:context.location.origin,source:frame.contentWindow,data});assert.equal(shown.length,1);
 get('startCamera').listeners.click();const cancelled=body.children.at(-1);listeners.message({origin:context.location.origin,source:cancelled.contentWindow,data:{type:'ficard.scan.cancel',request:'2'}});assert(cancelled.removed);assert.equal(shown.length,1);
 get('startCamera').listeners.click();const stopped=body.children.at(-1);await get('stopCamera').listeners.click();assert(stopped.removed);
 console.log('ScanDixit opens the actual FiCard page; trusted code return, cancellation and stale/foreign message rejection passed');
})().catch(e=>{console.error(e);process.exitCode=1});
