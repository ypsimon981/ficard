const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const ctx={URL,location:{href:'https://example.test/ficard/?scan=old#private'}};vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('const FICARD_STORE_LINKS='),source.indexOf('async function shareCard(')),ctx);
test('sharing includes both configured official store URLs',()=>{
 const links={appStore:'https://apps.apple.com/it/app/test/id123',googlePlay:'https://play.google.com/store/apps/details?id=test.app'};
 const text=ctx.cardShareText({name:'Conad'},links);assert.match(text,/Tessera Conad/);assert.ok(text.includes(links.appStore));assert.ok(text.includes(links.googlePlay));
});
test('unpublished or invalid store URLs use a clean web link',()=>{
 const text=ctx.cardShareText({name:'Conad'});assert.match(text,/https:\/\/example.test\/ficard\/$/);assert.doesNotMatch(text,/scan=|private|App Store|Google Play/);
 assert.doesNotMatch(ctx.cardShareText({name:'Conad'},{appStore:'https://example.test/fake',googlePlay:''}),/fake/);
});
