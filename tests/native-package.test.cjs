const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),{nativeHtml}=require('../scripts/native-html.cjs');
test('native package adapts GPS, backups and sharing without changing the web shell',()=>{
 const original=read('index.html'),html=nativeHtml(original,'index.html');
 assert.match(html,/window.FiCardNative.getPosition/);assert.match(html,/await window.FiCardNative.saveFile/);
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
