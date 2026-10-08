const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
test('mall pages show nearby cards together and keep far cards off the first page',()=>{
 const ctx={};vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('function smartMallPages('),html.indexOf('function renderSmartCarousel(){')),ctx);
 for(const n of [3,4,5,8]){
  const tiles=Array.from({length:n},(_,i)=>'<b>near'+i+'</b>').concat('<b>far</b>');
  const result=ctx.smartMallPages(tiles,n),pages=result.split('<div class="smartMallPage">').slice(1);
  assert.equal(pages.length,Math.ceil(n/4)+1);assert.ok(!pages[0].includes('<b>far</b>'));assert.ok(pages.at(-1).includes('<b>far</b>'));
  if(n===3)assert.ok(pages[0].includes('smartBlank'));for(let i=0;i<n;i++)assert.ok(result.includes('near'+i));
 }
});
