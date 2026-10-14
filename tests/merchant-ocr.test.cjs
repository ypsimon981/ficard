const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('merchant-ocr.js','utf8'),ctx={BRANDS:{metro:{name:'Metro'},conad:{name:'Conad'}}};vm.createContext(ctx);vm.runInContext(source,ctx);
test('clean shared card identifies Metro from the merchant header',()=>{
 const hit=ctx.merchantFromOcr('Metro\n74747474474474',92);assert.equal(hit.key,'metro');assert.equal(hit.name,'Metro');
});
test('old promotional images never use Fi-Card or Fecard as the custom merchant',()=>{
 for(const text of ['I= Fi-Card','Fecard','Condiviso da\nFi-Card','Non devi cercare la card giusta,'])assert.equal(ctx.merchantFromOcr(text,90),null,text);
 assert.equal(ctx.merchantFromOcr('Fi-Card\nMetro\nTESSERA FEDELTÀ\n74747474474474',90).key,'metro');
});
test('uncertain or ambiguous merchants still require manual confirmation',()=>{
 assert.equal(ctx.merchantFromOcr('Metro',35),null);assert.equal(ctx.merchantFromOcr('Metro\nConad',90),null);
 assert.equal(ctx.merchantFromOcr('Boutique Aurora',90).name,'Boutique Aurora');
});
