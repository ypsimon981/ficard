const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function field(value=''){return {value,textContent:'',invalid:'',setCustomValidity(v){this.invalid=v},checkValidity(){return !this.invalid},reportValidity(){this.reported=true},focus(){this.focused=true},removeAttribute(){},setAttribute(){}}}
function context(){const fields=Object.fromEntries(['addName','addAlias','addCode','brandSearch','addBrand','addCategory','addColor','addFormat','detectedFormat'].map(k=>[k,field('OLD')]));const ctx={addLogoEditor:null,pendingScanFormat:'EAN13',imageImportDefaults:{name:'OLD'},renderBrandResults(){},document:{getElementById:k=>fields[k],createElement:()=>({})},normalizeFormat:x=>x,inferManualFormat:()=> 'CODE128',bwipBcid:x=>x,bwipjs:{toCanvas(c,o){if(o.text==='INVALID')throw Error('invalid')}},window:{bwipjs:true}};vm.createContext(ctx);const code=source.slice(source.indexOf('function clearNewCardDraft()'),source.indexOf('function resetAddCardFlow()'));vm.runInContext(code,ctx);return {ctx,fields}}
test('new scan clears previous draft and detected format',()=>{const {ctx,fields}=context();ctx.clearNewCardDraft();for(const id of ['addName','addAlias','addCode','addBrand','brandSearch','addFormat'])assert.equal(fields[id].value,'');assert.equal(ctx.pendingScanFormat,null);assert.equal(ctx.imageImportDefaults,null);assert.equal(fields.addCategory.value,'altro')});
test('name and content required, format never blocks saving',()=>{const {ctx,fields}=context();fields.addName.value=' ';assert.equal(ctx.validateNewCardFields(),false);assert.equal(fields.addName.focused,true);fields.addName.value='Carta';fields.addCode.value=' ';assert.equal(ctx.validateNewCardFields(),false);fields.addCode.value='INVALID';assert.equal(ctx.validateNewCardFields(),true);fields.addCode.value='0123456789';fields.addFormat.value='';ctx.pendingScanFormat=null;assert.equal(ctx.validateNewCardFields(),true);fields.addFormat.value='CODE128';assert.equal(ctx.validateNewCardFields(),true)});
test('live scan rejects stale callbacks and repeated results',()=>{assert.match(source,/if\(generation!==scanGeneration\|\|accepted\)return/);assert.match(source,/async function stopScan\(outcome="scan_cancelled"\)\{finishCardScan\(outcome\);scanGeneration\+\+/);assert.match(source,/if\(qrScanner\)await stopScan\(\);if\(!keepDraft\)clearNewCardDraft\(\)/)});

test('save preview preserves leading zeros and keeps the text when rendering fails',()=>{
 const nodes={addCode:{value:'001234'},addCodePreview:{},addPreviewValue:{},addPreviewCanvas:{},addModal:{dataset:{}},addBrand:{value:''},addName:{value:'Test'},addFormat:{value:'CODE39'}};
 const ctx=vm.createContext({document:{getElementById:id=>nodes[id]},isHealthCard:()=>false,drawBarcode:(id,card)=>{assert.equal(card.format,'CODE39');assert.equal(card.code,'001234');return false}});
 vm.runInContext(source.slice(source.indexOf('function updateAddCodePreview'),source.indexOf('function revealAddCardFields')),ctx);
 ctx.updateAddCodePreview();
 assert.equal(nodes.addPreviewValue.textContent,'001234');
 assert.equal(nodes.addPreviewCanvas.hidden,true);
 assert.equal(nodes.addCodePreview.hidden,false);
 nodes.addCode.value='';
 ctx.updateAddCodePreview();
 assert.equal(nodes.addCodePreview.hidden,true);
});
