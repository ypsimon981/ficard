const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=n=>fs.readFileSync(path.join(__dirname,'../',n),'utf8'),html=read('index.html'),ui=read('ficard-stores-ui.js');
const ctx=vm.createContext({});vm.runInContext(html.match(/function isManualLocation[^\n]+/)[0],ctx);
test('manual map legacy points remain removable; OSM shops and favourites do not',()=>{
 for(const point of [{},{source:'osm'},{source:'manual-map'}])assert.equal(ctx.isManualLocation(point),true);
 for(const point of [{osmId:'node/1'},{source:'osm-favorite'},{osmId:'way/2',source:'osm'}])assert.equal(ctx.isManualLocation(point),false);
});
function element(){return {dataset:{},children:[],setAttribute(k,v){this[k]=v},append(x){this.children.push(x)},querySelector(q){return this.targets[q]||(this.targets[q]=element())},targets:{}}}
test('shop rows use barcode icon and only manually added points get a trash button',()=>{
 const c={name:'Negozio',id:'c'},scope=vm.createContext({document:{createElement:element},isManualLocation:ctx.isManualLocation,mapBrandVisual:()=>({color:'#000'}),esc:s=>s,mapBrandInnerHtml:()=>'',distanceLabel:()=>'',pinSvg:()=>'<svg/>',trashSvg:()=>'<svg/>',heartSvg:()=>'<svg/>'});
 vm.runInContext(ui.slice(ui.indexOf('function cardBarcodeSvg('),ui.indexOf('function list(')),scope);
 for(const [l,remove] of [[{source:'osm',address:'Via Roma 1'},true],[{osmId:'node/1',address:'Via Roma 1'},false],[{source:'osm-favorite',address:'Via Roma 1'},false]]){
  c.locations=[l];const row=scope.row({c,l,saved:true,favorite:true,d:0});assert.match(row.innerHTML,/aria-label="Apri carta"[^>]*><svg/);assert.match(row.innerHTML,/Via Roma 1/);assert.equal(row.querySelector('.shopActions').children.length,remove?1:0);
 }
});
test('reverse address requests deduplicate, persist locally and tolerate outages',async()=>{
 let count=0,value='';const storage={getItem:()=>value,setItem:(k,v)=>{value=v}},window={};const env={window,AbortController,setTimeout,clearTimeout,URLSearchParams,fetch:async()=>{count++;return {ok:true,json:async()=>({address:{road:'Via Roma',house_number:'12',city:'Roma'}})}}};
 vm.runInNewContext(read('ficard-stores.js'),env);const S=window.FiCardStores,p={lat:41.9,lng:12.4};
 const results=await Promise.all([S.reverseAddress(p,storage),S.reverseAddress(p,storage)]);assert.deepEqual(results,['Via Roma 12, Roma','Via Roma 12, Roma']);assert.equal(count,1);
 vm.runInNewContext(read('ficard-stores.js'),env);assert.equal(await window.FiCardStores.reverseAddress(p,storage),'Via Roma 12, Roma');assert.equal(count,1);
 assert.equal(await S.reverseAddress({lat:NaN,lng:0},storage),'');assert.equal(S.addressText({city:'Roma'}),'Roma');
 const offline={};vm.runInNewContext(read('ficard-stores.js'),{...env,window:offline,fetch:async()=>{throw Error('offline')}});assert.equal(await offline.FiCardStores.reverseAddress(p,{getItem:()=>''}),'');
});
