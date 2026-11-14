const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');

test('custom logo accepts bounded WebP data and rejects external URLs and spoofed MIME',()=>{
 const context=vm.createContext({atob});
 vm.runInContext(html.slice(html.indexOf('function safeCustomLogo'),html.indexOf('function logoEditor')),context);
 const check=context.safeCustomLogo;
 assert.equal(check('https://example.org/logo.webp'),'');
 assert.equal(check('data:image/webp;base64,PHN2Zy8+'),'');
 assert.equal(check('data:image/webp;base64,'+'A'.repeat(180000)),'');
 const webp='data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
 assert.equal(check(webp),webp);
});

test('a camera session reports only its first terminal outcome',()=>{
 const events=[];
 const context=vm.createContext({window:{FiCardAnalytics:{track:(...args)=>events.push(args)}}});
 const handler=html.slice(html.indexOf('function finishCardScan'),html.indexOf('async function stopScan'));
 vm.runInContext('let cardScanActive=true;'+handler,context);
 context.finishCardScan('scan_success');
 context.finishCardScan('scan_cancelled');
 assert.deepEqual(events,[['scan_success','home']]);
});
