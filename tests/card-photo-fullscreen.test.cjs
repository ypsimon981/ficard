const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function setup(){
 const els={},classes=new Set();let focus=0,sync=0,draw=0;
 for(const id of ['fullBarcode','fullPhoto','closeFull','fullCardHeader','fullNum'])els[id]={style:{},focus(){focus++},removeAttribute(key){delete this[key]}};
 els.fullBarcode.classList={add:v=>classes.add(v),remove:(...vs)=>vs.forEach(v=>classes.delete(v)),toggle:(v,on)=>on?classes.add(v):classes.delete(v)};
 const trigger={isConnected:true,focus(){focus++}};
 const ctx={document:{getElementById:id=>els[id],activeElement:trigger},syncCardScreen(){sync++},drawBarcode(){draw++},cardInk:()=>'',brandLogoHtml:()=>'',brandFor:()=>'',cardDisplayName:c=>c.name,esc:String};
 els.fullCardHeader.classList={toggle(){}};vm.createContext(ctx);require('./health-fixture.cjs')(ctx,html);vm.runInContext(html.slice(html.indexOf('let fullScreenReturnFocus='),html.indexOf('const LOCATION_DUPLICATE_METERS=')),ctx);
 return {ctx,els,classes,get focus(){return focus},get sync(){return sync},get draw(){return draw}};
}
test('saved photo opens full screen without regenerating its code or modifying the photo',()=>{
 const s=setup(),card={photo:'data:image/jpeg;base64,YQ=='};s.ctx.showFullPhoto(card);
 assert.equal(s.els.fullPhoto.src,card.photo);assert.ok(s.classes.has('show'));assert.ok(s.classes.has('photoMode'));assert.equal(s.draw,0);assert.equal(s.sync,1);assert.equal(s.focus,1);
 s.ctx.closeFullScreen();assert.equal(s.classes.size,0);assert.equal(s.els.fullPhoto.src,undefined);assert.equal(s.focus,2);assert.equal(s.sync,2);assert.ok(card.photo);
});
test('barcode remains available after displaying a photo and missing photos do not open',()=>{
 const s=setup();s.ctx.showFullPhoto({});assert.equal(s.classes.size,0);
 s.ctx.showFullPhoto({photo:'photo'});s.ctx.showFull({code:'1234',name:'Card'});
 assert.ok(s.classes.has('show'));assert.ok(!s.classes.has('photoMode'));assert.equal(s.els.fullPhoto.src,undefined);assert.equal(s.els.fullNum.textContent,'1234');assert.equal(s.draw,1);
});
test('preview is a keyboard-accessible photo button and fullscreen keeps the entire image',()=>{
 assert.match(html,/button id="openCardPhoto" type="button"/);assert.match(html,/preview.onclick=\(\)=>showFullPhoto\(c\)/);
 const css=fs.readFileSync(require('node:path').join(__dirname,'../ficard-polish.css'),'utf8');assert.match(css,/#fullBarcode.photoMode #fullPhoto\{[^}]*object-fit:contain/);
 for(const lang of ['it','en','fr','es','pt','nl','de'])assert.match(fs.readFileSync(require('node:path').join(__dirname,'../locales/'+lang+'.js'),'utf8'),/"photo.fullscreen":/);
});
