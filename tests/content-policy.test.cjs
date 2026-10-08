const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../ficard-content.js'),'utf8');
function storage(){const items={};return {getItem:k=>items[k]||null,setItem:(k,v)=>items[k]=v};}
function start(local,session,now){const root={localStorage:local,sessionStorage:session,navigator:{onLine:true},FiCardAdContent:[{title:'Ad',url:'https://example.com/'}],document:{readyState:'loading',addEventListener(){}},addEventListener(){}};const NativeDate=Date;class Clock extends NativeDate{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}vm.runInNewContext(source,{window:root,Date:Clock,Math});return root;}
test('first two daily sessions can show ads, third uses tips, next day resets',()=>{
 const local=storage(),session=storage(),now=new Date(2026,9,8,9).getTime();
 let r=start(local,session,now);assert.equal(r.FiCardContent.model('banner').advert,true);
 r=start(local,session,now+1000);assert.equal(r.FiCardContent.model('banner').advert,true);
 r=start(local,session,now+31*60000);assert.equal(r.FiCardContent.model('banner').advert,true);
 r=start(local,session,now+62*60000);assert.equal(r.FiCardContent.model('banner').advert,false);
 r=start(local,session,now+24*60*60000);assert.equal(r.FiCardContent.model('banner').advert,true);
});
test('offline, no inventory and storage failure always fall back to safe stable tips',()=>{
 const r=start(storage(),storage(),Date.now());r.navigator.onLine=false;
 const first=r.FiCardContent.model('banner');assert.equal(first.advert,false);assert.equal(r.FiCardContent.model('banner').title,first.title);
 r.navigator.onLine=true;r.FiCardAdContent=[];assert.equal(r.FiCardContent.model('banner').advert,false);
 r.FiCardAdContent=[{title:'bad',url:'javascript:alert(1)'}];assert.equal(r.FiCardContent.model('banner').advert,false);
 const denied={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};assert.equal(start(denied,denied,Date.now()).FiCardContent.adAvailable(),false);
});
