const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../scandixit.html'),'utf8');
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function showCode('));
const nodes=new Map();
function makeNode(tag='div'){
 return {tag,value:'',textContent:'',href:'',target:'',rel:'',children:[],listeners:{},classes:new Set(),classList:{add(x){this.owner.classes.add(x)},remove(x){this.owner.classes.delete(x)},contains(x){return this.owner.classes.has(x)}},append(...xs){this.children.push(...xs)},appendChild(x){this.children.push(x)},replaceChildren(...xs){this.children=[...xs]},addEventListener(k,fn){this.listeners[k]=fn},querySelector(q){if(q==='.resultKicker')return this.kicker||=makeNode('div');return null},scrollIntoView(){}};
}
const get=id=>{if(!nodes.has(id))nodes.set(id,makeNode());return nodes.get(id)};
for(const id of ['codeResult','productSheet'])get(id).classList.owner=get(id);
for(const node of nodes.values())node.classList.owner=node;
const tabs=[makeNode('button'),makeNode('button')];tabs[0].dataset={tab:'barcode'};tabs[1].dataset={tab:'ocr'};
let catalogMode='hit';const urls=[];
const product={code:'4006381333931',product_name:'Crema demo',brands:'Marca demo',quantity:'250 ml',product_type:'beauty',ingredients_text:'Aqua, Glycerin',allergens:'',labels:'',categories:'Cura della pelle',last_modified_t:0};
const context={AbortController,URLSearchParams,location:{search:''},document:{body:{classList:{add(){}}},getElementById:get,querySelectorAll:()=>tabs,createElement:tag=>makeNode(tag)},FiCardReader:require('../ficard-reader.js'),ScanDixit:require('../scandixit-scanner.js'),encodeURIComponent,fetch:async url=>{urls.push(url);if(catalogMode==='offline')throw Error('offline');return {ok:catalogMode==='hit',status:catalogMode==='hit'?200:404,json:async()=>url.includes('openbeautyfacts.org')&&catalogMode==='hit'?{status:'success',product}:{status:'failure',result:{id:'product_not_found'}}}},URL:{},setTimeout,clearTimeout,console};
context.FiCardCatalog={lookup:(code,options)=>require('../scandixit-catalog.js').lookup(code,{...options,fetcher:context.fetch})};
context.window=context;vm.createContext(context);vm.runInContext(inline,context);
(async()=>{
 get('scanStatus').textContent='Nessun codice valido trovato. Prova una foto più nitida o inserisci le cifre.';get('codeInput').value='4006381333931';await get('lookupCode').listeners.click();await new Promise(setImmediate);
 assert.equal(get('scanStatus').textContent,'');
 assert.equal(get('amazonSearch').href,'https://www.amazon.it/s?k=4006381333931');
 assert.equal(get('sheetTitle').textContent,'Crema demo');assert.equal(get('sheetBrand').textContent,'Marca demo');
 assert(get('sheetFields').children.some(x=>x.children[0].textContent==='Ingredienti'&&x.children[1].textContent==='Aqua, Glycerin'));
 assert.equal(urls.length,4);assert(urls.some(url=>url.includes('openbeautyfacts.org')));assert(urls.every(url=>!url.includes('product_type=all')));assert.equal(get('sheetSource').children[0].children[0].href,'https://world.openbeautyfacts.org/product/4006381333931');
 catalogMode='miss';await context.loadProductSheet('5901234123457');
 assert.equal(get('sheetTitle').textContent,'Scheda non trovata nel catalogo');assert.equal(get('sheetFields').children.length,1);assert.match(get('sheetBrand').textContent,/non ha ancora/);
 catalogMode='offline';await context.loadProductSheet('5012345678900');
 assert.equal(get('sheetTitle').textContent,'Catalogo non raggiungibile');
 const count=urls.length;context.showCode('55338834090101772503222982','barcode','CODE_128');await new Promise(setImmediate);assert.equal(get('resultCode').textContent,'55338834090101772503222982');assert.equal(get('amazonSearch').hidden,true);assert.equal(get('productSheet').classes.has('show'),false);assert.equal(urls.length,count);assert.match(get('matchNote').textContent,/non è un identificativo prodotto/);
 console.log('Product sheet v3 catalog hit, miss, outage, ingredient mapping, attribution and Amazon link: passed');
})().catch(e=>{console.error(e);process.exit(1)});

