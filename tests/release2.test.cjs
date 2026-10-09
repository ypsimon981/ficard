const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const ocr=fs.readFileSync(require('node:path').join(__dirname,'../merchant-ocr.js'),'utf8');
function extract(source,start,end){return source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)))}
test('OCR preserves leading zeros and rejects ambiguous, weak or mixed text',()=>{
 const ctx=vm.createContext({});vm.runInContext(extract(ocr,'function numberFromOcr(','async function numberImage('),ctx);
 assert.equal(ctx.numberFromOcr('0 408 630 088 892',95),'0408630088892');
 assert.equal(ctx.numberFromOcr('0408630088892\n123456789',95),null);
 assert.equal(ctx.numberFromOcr('0408630088892',59),null);
 assert.equal(ctx.numberFromOcr('O 408 630 088 892',95),null);
 assert.equal(ctx.numberFromOcr('0000000000000',95),null);
});
test('alias is escaped, optional, and independent of merchant identity',()=>{
 const ctx=vm.createContext({esc:s=>String(s).replaceAll('<','&lt;').replaceAll('"','&quot;')});vm.runInContext(extract(html,'function cardAliasHtml(','function cardHtml('),ctx);
 assert.equal(ctx.cardAliasHtml({name:'Elite'}),'');assert.match(ctx.cardAliasHtml({alias:'<Simone>'}),/&lt;Simone>/);
 assert.equal(ctx.cardDisplayName({name:'Elite',alias:'Famiglia'}),'Elite · Famiglia');
});
test('distances contain only the measurement',()=>{
 const ctx=vm.createContext({});vm.runInContext(extract(html,'function distanceLabel(','function mapBrandVisual('),ctx);
 assert.equal(ctx.distanceLabel(1300),'1,3 km');assert.equal(ctx.distanceLabel(50),'50 m');
});
test('sharing a card set uses a compatible file without marking a backup saved',async()=>{
 const reader=require('../ficard-reader.js'),calls=[],messages=[];
 const ctx=vm.createContext({Blob,File,Date,JSON,window:{FiCardNative:{saveFile:async(blob,name)=>calls.push({data:JSON.parse(await blob.text()),name})}},toast:x=>messages.push(x)});
 vm.runInContext(extract(html,'async function shareBackup(','function validateBackup('),ctx);
 await ctx.shareBackup([{name:'Elite',alias:'Famiglia',code:'0408630088892',format:'EAN13',locations:[{lat:41,lng:12}]}]);
 assert.equal(calls.length,1);assert.equal(calls[0].data.version,2);assert.equal(calls[0].data.cards[0].alias,'Famiglia');assert.equal(calls[0].data.cards[0].code,'0408630088892');assert.match(calls[0].name,/\.json$/);assert.equal(messages.length,0);
});
