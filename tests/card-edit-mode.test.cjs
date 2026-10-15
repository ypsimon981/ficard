const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function setup(custom=true){
 const nodes={},classes=new Set();let focused='',saves=0,reopened=0;
 const node=id=>nodes[id]??=( {value:'',scrollTop:350,innerHTML:'',classList:{toggle:(key,on)=>on?classes.add(key):classes.delete(key)},insertAdjacentHTML(){},focus(){focused=id}} );
 const card={id:'one',name:'Test Card',code:'12345',alias:'Original',category:'altro',color:'#5B3DF5',format:'CODE128'};
 const ctx={document:{getElementById:node,querySelector:()=>node('sheet')},window:{FiCardI18n:{translateText:s=>s}},inferredBrandKey:()=>custom?'':'test',CATEGORIES:{altro:'Altro'},categoryFor:c=>c.category,esc:String,cardDisplayName:c=>c.name,catalogOptions:()=>'',codeFormatOptions:()=>'',normalizeFormat:x=>x,inferManualFormat:()=> 'CODE128',formatLabel:x=>x,BRANDS:{},save:()=>saves++,renderAll(){},toast(){},openCard:()=>{reopened++;ctx.setCardEditMode(false)}};
 vm.createContext(ctx);vm.runInContext(html.slice(html.indexOf('function setCardEditMode('),html.indexOf('function showFull(')),ctx);
 ctx.openEditCard(card);
 return {ctx,card,node,classes,get focused(){return focused},get saves(){return saves},get reopened(){return reopened}};
}
test('editing starts at the form with a clear title, focus and save/cancel actions',()=>{
 const s=setup();assert.ok(s.classes.has('cardEditing'));assert.equal(s.node('detailHeading').textContent,'Modifica carta');assert.equal(s.node('sheet').scrollTop,0);assert.equal(s.focused,'detailHeading');
 assert.match(s.node('cardExtras').innerHTML,/Salva modifiche/);assert.match(s.node('cardExtras').innerHTML,/Annulla/);
});
test('cancel returns to the card without persisting draft fields',()=>{
 const s=setup();s.node('editAlias').value='Draft';s.node('editCode').value='98765';s.node('cancelEditCard').onclick();
 assert.equal(s.card.alias,'Original');assert.equal(s.card.code,'12345');assert.equal(s.saves,0);assert.equal(s.reopened,1);assert.ok(!s.classes.has('cardEditing'));assert.equal(s.node('detailHeading').textContent,'La mia carta');assert.equal(s.focused,'editBtn');
});
test('saving updates editable fields and leaves edit mode while catalog fields remain locked',()=>{
 const s=setup(false);for(const id of ['editBrand','editName','editCategory','editColor'])assert.equal(s.node(id).disabled,true);
 s.node('editName').value='Test Card';s.node('editCode').value='98765';s.node('editAlias').value='Family';s.node('editFormat').value='CODE128';s.node('saveEditCard').onclick();
 assert.equal(s.card.alias,'Family');assert.equal(s.card.code,'98765');assert.equal(s.saves,1);assert.ok(!s.classes.has('cardEditing'));
});
