const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),{randomUUID}=require('node:crypto');
const html=fs.readFileSync('index.html','utf8');
function setup(){const ctx=vm.createContext({window:{},crypto:{randomUUID},normalizeFormat:x=>x,inferManualFormat:()=> 'CODE128'});require('./health-fixture.cjs')(ctx,html);return ctx}
test('fiscal-code syntax, date, check letter and omocodia',()=>{
 const c=setup(),v=c.window.FiCardHealth.valid;
 assert.ok(v('RSSMRA85T10A562S'));assert.ok(v(' rssmra85t10a562s '));
 assert.ok(v('RSSMRA85T10A56NH')); // 2 -> N omocodia, with recalculated checksum
 for(const code of ['1234567890123456','ABCDEFGHIJKLMNOP','RSSMRA85T10A562A','12345678901','RSSMRA85T10A562Sxxx','RSSMRA85T00A562S','RSSMRA85T32A562S','RSSMRA85T40A562S'])assert.equal(v(code),false,code);
});
test('backup validates health cards atomically and fixes their skin and barcode type',()=>{
 const c=setup();vm.runInContext(html.slice(html.indexOf('const CATEGORIES='),html.indexOf('function demoCards()'))+html.slice(html.indexOf('function validateBackup('),html.indexOf('function cardIdentity(')),c);
 const card={kind:'health-it',name:'Old name',code:'rssmra85t10a562s',format:'QR_CODE',color:'#FF0000',locations:[]};
 const restored=c.validateBackup({app:'Fi-Card',version:2,cards:[card]})[0];
 assert.equal(restored.kind,'health-it');assert.equal(restored.name,'Tessera sanitaria');assert.equal(restored.code,'RSSMRA85T10A562S');assert.equal(restored.format,'CODE39');assert.equal(restored.color,'#79BDD9');
 assert.throws(()=>c.validateBackup({app:'Fi-Card',version:2,cards:[card,{...card,code:'1234567890123'}]}),/Codice fiscale non valido/);
 const legacy=c.validateBackup([{...card,kind:undefined,name:'Tessera sanitaria'}])[0];assert.equal(legacy.kind,'health-it');
});
