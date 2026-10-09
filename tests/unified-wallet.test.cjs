const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
test('unified wallet orders by distance, keeps unlocated cards and exposes distance',()=>{
 const ctx={quickPositionReady:()=>true,currentPos:{},nearestFor:c=>c.distance===undefined?null:{d:c.distance},cardHtml:c=>'<div class="card cardItem ">'+c.name+'</div>',distanceLabel:d=>d+' m',esc:String};vm.createContext(ctx);
 vm.runInContext(html.slice(html.indexOf('function mostUsedFirst('),html.indexOf('function renderCards(){')),ctx);
 const cards=[{id:'a',name:'A',distance:100},{id:'b',name:'B'},{id:'c',name:'C',distance:2}];
 assert.equal(ctx.distanceOrderedCards(cards).map(c=>c.id).join(','),'c,a,b');
 assert.match(ctx.unifiedCardHtml(cards[2],true),/nearbyHero/);assert.doesNotMatch(ctx.unifiedCardHtml(cards[2],true),/walletDistance/);assert.match(ctx.unifiedCardHtml(cards[2],true),/walletArrival/);assert.match(ctx.unifiedCardHtml(cards[0],false),/100 m/);
 assert.doesNotMatch(ctx.unifiedCardHtml(cards[1],false),/walletDistance/);
 ctx.quickPositionReady=()=>false;cards[1].useCount=10;assert.equal(ctx.distanceOrderedCards(cards)[0].id,'b');
});
