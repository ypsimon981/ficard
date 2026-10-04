const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../scandixit.html'),'utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const nodes=new Map();
function makeNode(tag='div'){
 return {tag,value:'',textContent:'',href:'',target:'',rel:'',children:[],listeners:{},classes:new Set(),classList:{add(x){this.owner.classes.add(x)},remove(x){this.owner.classes.delete(x)},contains(x){return this.owner.classes.has(x)}},append(...xs){this.children.push(...xs)},appendChild(x){this.children.push(x)},replaceChildren(...xs){this.children=[...xs]},addEventListener(k,fn){this.listeners[k]=fn},querySelector(q){if(q==='.resultKicker')return this.kicker||=makeNode('div');return null},scrollIntoView(){}};
}
const get=id=>{if(!nodes.has(id))nodes.set(id,makeNode());return nodes.get(id)};
for(const id of ['codeResult','productSheet'])get(id).classList.owner=get(id);
for(const node of nodes.values())node.classList.owner=node;
const tabs=[makeNode('button'),makeNode('button')];tabs[0].dataset={tab:'barcode'};tabs[1].dataset={tab:'ocr'};
let response={status:1,product:{code:'4006381333931',product_name:'Crema demo',brands:'Marca demo',quantity:'250 ml',product_type:'beauty',ingredients_text:'Aqua, Glycerin',allergens:'',labels:'',categories:'Cura della pelle',last_modified_t:0}};
const context={document:{getElementById:get,querySelectorAll:()=>tabs,createElement:tag=>makeNode(tag)},ScanDixit:{normalizeBarcode:x=>/^4006381333931$/.test(x)?x:null},encodeURIComponent,fetch:async url=>({ok:true,json:async()=>{context.lastUrl=url;return response}}),URL:{},setTimeout,clearTimeout,console};
context.window=context;vm.createContext(context);vm.runInContext(inline,context);
(async()=>{
 get('codeInput').value='4006381333931';await get('lookupCode').listeners.click();await new Promise(setImmediate);
 assert.equal(get('amazonSearch').href,'https://www.amazon.it/s?k=4006381333931');
 assert.equal(get('sheetTitle').textContent,'Crema demo');assert.equal(get('sheetBrand').textContent,'Marca demo');
 assert(get('sheetFields').children.some(x=>x.children[0].textContent==='Ingredienti'&&x.children[1].textContent==='Aqua, Glycerin'));
 assert.match(context.lastUrl,/product_type=all/);assert.equal(get('sheetSource').children[0].children[0].href,'https://world.openbeautyfacts.org/product/4006381333931');
 response={status:0};get('codeInput').value='4006381333931';await get('lookupCode').listeners.click();await new Promise(setImmediate);
 assert.equal(get('sheetTitle').textContent,'Scheda non trovata nel catalogo');assert.equal(get('sheetFields').children.length,1);assert.match(get('sheetBrand').textContent,/non ha ancora/);
 console.log('Product sheet catalog hit/miss, ingredient mapping, attribution and Amazon link: passed');
})().catch(e=>{console.error(e);process.exit(1)});
