const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('ficard-polish.css','utf8');
test('all catalog mini cards use the same logo, scale and card color as the wallet',()=>{
 const c=vm.createContext({cards:[],save(){},esc:s=>String(s??''),L:{divIcon:x=>x}});
 vm.runInContext(html.slice(html.indexOf('const CATEGORIES='),html.indexOf('function demoCards()'))+'\nglobalThis.catalog=BRANDS;',c);
 vm.runInContext(html.slice(html.indexOf('function inferredBrandKey('),html.indexOf('function renderCategoryChips(')),c);
 for(const name of ['brandLogoHtml','cardInk'])vm.runInContext(html.split('\n').find(l=>l.startsWith('function '+name+'(')),c);
 vm.runInContext(html.slice(html.indexOf('function mapBrandVisual('),html.indexOf('function renderLocations(')),c);
 assert.equal(Object.keys(c.catalog).length,141);
 for(const [key,b] of Object.entries(c.catalog)){
  const card={brandKey:key,name:b.name,color:b.color},art=c.brandLogoHtml(b,'wallet');
  const pin=c.mapCardPinIcon(card).html,mini=c.shopMiniCardHtml(card);
  for(const rendered of [pin,mini]){
   assert.ok(rendered.includes('--card-color:'+b.color),key+' color');
   if(b.logo)assert.ok(rendered.includes(art),key+' artwork');
  }
 }
});
test('mini cards remove legacy logo backplates and preserve solid card backgrounds',()=>{
 assert.match(css,/\.mapCardFace \.brandLogo\{background:transparent!important;/);
 assert.match(css,/\.mapCardFace::before\{display:none\}/);
 assert.match(css,/\.mapCardPin\.walletDark\[data-brand="decathlon"\] \.brandLogo\{filter:brightness\(0\) invert\(1\).*!important/);
});
