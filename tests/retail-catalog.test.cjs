const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),ctx=vm.createContext({});
vm.runInContext(html.slice(html.indexOf('const CATEGORIES='),html.indexOf('function demoCards()'))+'\nglobalThis.catalog=BRANDS;globalThis.categories=CATEGORIES;',ctx);
vm.runInContext(html.match(/function categoryFor\(c\)\{[^\n]+/)[0],ctx);
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../ficard-stores.js'),'utf8'),{window,AbortController,setTimeout,clearTimeout,URLSearchParams,fetch});
test('new retail brands are available in the correct categories',()=>{
 for(const key of ['petmark','italpet','robinsonpetshop','zooservice','majesticpets','elitepet','petsupermarket','globalpet'])assert.equal(ctx.catalog[key].category,'petstore');
 for(const key of ['emark','risparmiocasa','maurys'])assert.equal(ctx.catalog[key].category,'casalinghi');
 assert.equal(ctx.categories.casalinghi,'Casalinghi');assert.ok(html.includes('<option value="casalinghi">Casalinghi</option>'));
});
test('existing household cards migrate while other home and custom categories stay intact',()=>{
 for(const brandKey of ['risparmiocasa','maurys'])assert.equal(ctx.categoryFor({brandKey,category:'casa'}),'casalinghi');
 assert.equal(ctx.categoryFor({brandKey:'ikea',category:'casa'}),'casa');assert.equal(ctx.categoryFor({brandKey:'maurys',category:'altro'}),'altro');
});
test('OSM shop name variants match the newly supported card brands',()=>{
 for(const [key,name] of [['petmark','Pet Mark'],['italpet','Ital Pet'],['robinsonpetshop','Robinson Petshop'],['zooservice','Zooservice'],['majesticpets','Majestic Pets'],['elitepet','ElitePet'],['petsupermarket','Petsupermarket'],['globalpet','GlobalPet'],['emark','E Mark'],['maurys','Maurys']]){
  const names=window.FiCardStores.names({},ctx.catalog,key);assert.ok(window.FiCardStores.matches({name},names),key);
 }
});
