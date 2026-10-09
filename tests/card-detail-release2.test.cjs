const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
test('card actions use six buttons with accessible trash before store content',()=>{
 const line=html.split('\n').find(l=>l.includes('<div class="detailToolbar" aria-label='));
 const toolbar=line.slice(0,line.indexOf("'+officialFlyerHtml(c)"));
 assert.equal((toolbar.match(/<button /g)||[]).length,6);
 assert.ok(toolbar.includes('id="deleteBtn" class="deleteCardAction"'));
 assert.ok(toolbar.includes('aria-label="Elimina carta"'));
 assert.ok(line.indexOf('deleteBtn')<line.indexOf('cardLocations'));
 assert.ok(!line.includes('detailDeleteRow'));
 const css=fs.readFileSync(require('node:path').join(__dirname,'../ficard-polish.css'),'utf8');
 assert.match(css,/\.detailToolbar\{grid-template-columns:repeat\(3,/);
 assert.match(css,/grid-template-columns:minmax\(0,2fr\) minmax\(0,1fr\)/);
});
test('flyer links are optional, official HTTPS pages and keep the card open',()=>{
 const c=vm.createContext({inferredBrandKey:x=>x.brandKey||'',esc:x=>x});
 vm.runInContext(html.slice(html.indexOf('const OFFICIAL_FLYERS='),html.indexOf('function openCard(')),c);
 for(const key of ['conad','coop','esselunga','lidl','eurospin','carrefour','aldi','bennet','elite','tigota']){
  const banner=c.officialFlyerHtml({brandKey:key});assert.ok(banner.includes('href="https://'));assert.ok(banner.includes('target="_blank" rel="noopener noreferrer"'));assert.ok(banner.includes('Seleziona il tuo punto vendita'));
 }
 assert.ok(c.officialFlyerHtml({name:'Supermercati PIM'}).includes('supermercatipim.com'));
 assert.equal(c.officialFlyerHtml({name:'Una carta privata',brandKey:'custom'}),'');
});
