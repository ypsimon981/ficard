const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),{nativeHtml}=require('../scripts/native-html.cjs');
test('native package adapts GPS, backups and sharing without changing the web shell',()=>{
 const original=read('index.html'),html=nativeHtml(original,'index.html');
 assert.match(html,/window.FiCardNative.getPosition/);assert.match(html,/await window.FiCardNative.saveFile/);
 assert.match(html,/await window.FiCardNative.saveBackup/);
 assert.match(html,/await downloadBackup\(cards,"fi-card-prima-del-ripristino/);
 assert.match(html,/!window.FiCardNative&&"serviceWorker"/);
 assert.doesNotMatch(original,/src="\.\/native\/ficard-native.js"/);
 for(const [,script] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(script.trim())new vm.Script(script);
 assert.ok(nativeHtml(read('scandixit.html'),'scandixit.html').includes('./native/ficard-native.js'));
});
test('release configuration is local HTTPS and contains no hosted server or enabled ads',()=>{
 const config=JSON.parse(read('capacitor.config.json'));assert.equal(config.webDir,'www');assert.equal(config.server.url,undefined);assert.equal(config.android.allowMixedContent,false);
 assert.match(read('ficard-ads-config.js'),/enabled:false/);
});
test('native export marks a backup saved only after the file write succeeds',async()=>{
 const html=nativeHtml(read('index.html'),'index.html');
 const code=html.slice(html.indexOf('async function downloadBackup('),html.indexOf('\n',html.indexOf('async function downloadBackup(')));
 const writes=[],messages=[],info={textContent:''};let finish,reject;
 const ctx={Blob,Date,JSON,window:{FiCardNative:{saveBackup:(blob,name)=>{assert.equal(name,'backup.json');assert.equal(blob.type,'application/json');return new Promise((ok,no)=>{finish=ok;reject=no})},saveFile:()=>assert.fail('Backup must not open the share sheet')}},localStorage:{setItem:(...args)=>writes.push(args)},document:{getElementById:()=>info},toast:text=>messages.push(text)};
 vm.createContext(ctx);vm.runInContext(code,ctx);
 const pending=ctx.downloadBackup([{code:'000123',name:'Tigòta'}],'backup.json');
 assert.equal(writes.length,0);assert.equal(messages.length,0);finish();await pending;
 assert.equal(writes.length,1);assert.equal(messages.at(-1),'Backup salvato');
 const cancelled=ctx.downloadBackup([],'backup.json');reject(Error('CANCELLED'));await assert.rejects(cancelled,/CANCELLED/);
 assert.equal(writes.length,1);assert.equal(messages.length,1);
 const failed=ctx.downloadBackup([],'backup.json');reject(Error('WRITE_FAILED'));await assert.rejects(failed,/WRITE_FAILED/);
 assert.equal(writes.length,1);assert.equal(messages.length,1);
});
