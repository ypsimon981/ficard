const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../ficard-stores-ui.js'),'utf8');
function setup(){
 const fields={shopCategory:{value:''},shopCard:{value:''},shopFavorites:{checked:false}};
 const cards=[{id:'conad',name:'Conad',category:'supermercati'},{id:'zara',name:'Zara',category:'abbigliamento'},{id:'lidl',name:'Lidl',category:'supermercati'}];
 const ctx={document:{getElementById:id=>fields[id]},cards,BRANDS:{conad:{name:'Conad'},zara:{name:'Zara'},lidl:{name:'Lidl'}},inferredBrandKey:c=>c.id,CATEGORIES:{supermercati:'Supermercati',abbigliamento:'Abbigliamento'},categoryFor:c=>c.category,esc:s=>s,shops:()=>cards.map(c=>({c,favorite:c.id==='conad'}))};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function storeBrand('),source.indexOf('function navigate(')),ctx);
 return {ctx,fields};
}
test('category removes incompatible cards and clears an incompatible previous choice',()=>{
 const {ctx,fields}=setup();fields.shopCard.value='conad';fields.shopCategory.value='abbigliamento';ctx.populate();
 assert.equal(fields.shopCard.value,'');assert.match(fields.shopCard.innerHTML,/Zara/);assert.doesNotMatch(fields.shopCard.innerHTML,/Conad|Lidl/);
 assert.deepEqual(Array.from(ctx.filtered(),x=>x.c.id),['zara']);
});
test('brand choice groups multiple cards of the same brand',()=>{
 const {ctx,fields}=setup();ctx.cards.push({id:'conad-family',brandKey:'conad',name:'Conad famiglia',category:'supermercati'});ctx.populate();
 assert.equal((fields.shopCard.innerHTML.match(/value="conad"/g)||[]).length,1);
 fields.shopCard.value='conad';assert.deepEqual(Array.from(ctx.filtered(),x=>x.c.id),['conad','conad-family']);
});
test('shops require their own explicit preference, independent of card preference',()=>{
 const ctx={};vm.createContext(ctx);vm.runInContext(source.match(/const savedFavorite=[^;]+;/)[0]+'globalThis.isFavorite=savedFavorite;',ctx);
 assert.equal(ctx.isFavorite({}),false);assert.equal(ctx.isFavorite({favorite:false}),false);assert.equal(ctx.isFavorite({favorite:true}),true);
});
test('compatible card remains selected and all categories restore all choices',()=>{
 const {ctx,fields}=setup();fields.shopCard.value='conad';fields.shopCategory.value='supermercati';ctx.populate();
 assert.equal(fields.shopCard.value,'conad');assert.deepEqual(Array.from(ctx.filtered(),x=>x.c.id),['conad']);
 fields.shopCategory.value='';ctx.populate();assert.equal(fields.shopCard.value,'conad');assert.match(fields.shopCard.innerHTML,/Zara/);
 fields.shopCard.value='';fields.shopFavorites.checked=true;assert.deepEqual(Array.from(ctx.filtered(),x=>x.c.id),['conad']);
});
