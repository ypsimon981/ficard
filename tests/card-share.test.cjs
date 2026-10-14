const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const ctx={URL,location:{href:'https://example.test/ficard/?scan=old#private'}};vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('const FICARD_STORE_LINKS='),source.indexOf('async function shareCard(')),ctx);
test('sharing includes both configured official store URLs',()=>{
 const links={appStore:'https://apps.apple.com/it/app/test/id123',googlePlay:'https://play.google.com/store/apps/details?id=test.app'};
 const text=ctx.cardShareText({name:'Conad'},links);assert.match(text,/carta Conad/);assert.ok(text.includes(links.appStore));assert.ok(text.includes(links.googlePlay));
});
test('message tells the recipient to save the attachment and import it, before the promotion',()=>{
 const text=ctx.cardShareText({name:'Metro'});
 assert.match(text,/Salva l’immagine allegata/);assert.match(text,/\+ → Importa immagini/);
 assert(text.indexOf('Salva l’immagine')<text.indexOf('Scopri FiCard'));
 assert.doesNotMatch(text,/747474/,'Private code stays in the attached image, not the promotional text');
});
test('shared image contains only merchant name, rendered code and printed value',async()=>{
 class Canvas{constructor(w=0,h=0){this.width=w;this.height=h;this.calls=[]}getContext(){const calls=this.calls;return {fillRect(...v){calls.push(['fillRect',this.fillStyle,...v])},fillText:(...v)=>calls.push(['text',...v]),drawImage:(...v)=>calls.push(['image',...v]),measureText:s=>({width:String(s).length*30})}}}
 const barcode=new Canvas(600,200),sandbox={HTMLCanvasElement:Canvas,cardInk:()=>'#000000',document:{getElementById:()=>barcode,createElement:()=>new Canvas()}};
 vm.createContext(sandbox);vm.runInContext(source.slice(source.indexOf('async function createShareCard('),source.indexOf('// Fill with the official product URLs')),sandbox);
 const canvas=await sandbox.createShareCard({name:'Metro',code:'74747474474474',color:'#FFFF00'});
 assert.equal(canvas.width,1080);assert.equal(canvas.height,800);
 assert.deepEqual(canvas.calls.filter(c=>c[0]==='fillRect'),[['fillRect','#FFFFFF',0,0,1080,800],['fillRect','#FFFF00',0,0,1080,190]],'Merchant color is confined to the header; code area remains white');
 assert.deepEqual(canvas.calls.filter(c=>c[0]==='text').map(c=>c[1]),['Metro','74747474474474']);
 const image=canvas.calls.find(c=>c[0]==='image');assert.equal(image[1],barcode);
 assert(image[2]>=60&&image[2]+image[4]<=1020,'Barcode has blank horizontal margins');
 assert.equal(canvas.calls.filter(c=>c[0]==='image').length,1,'No promotional or shop logos mixed into OCR');
});
test('unpublished or invalid store URLs use a clean web link',()=>{
 const text=ctx.cardShareText({name:'Conad'});assert.match(text,/https:\/\/example.test\/ficard\/$/);assert.doesNotMatch(text,/scan=|private|App Store|Google Play/);
 assert.doesNotMatch(ctx.cardShareText({name:'Conad'},{appStore:'https://example.test/fake',googlePlay:''}),/fake/);
});
