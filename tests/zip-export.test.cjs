const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const zip=require('../ficard-zip.js'),html=fs.readFileSync('index.html','utf8');
test('ZIP uses standard store format, UTF-8 names and correct CRC/central directory',async()=>{
 const entries=[{name:'0001-Metro.png',data:new Uint8Array([137,80,78,71])},{name:'0002-CafèNoir.png',data:new Uint8Array([1,2,3])}],blob=zip.create(entries),buf=Buffer.from(await blob.arrayBuffer());
 assert.equal(blob.type,'application/zip');assert.equal(buf.readUInt32LE(0),0x04034b50);assert.equal(buf.readUInt16LE(6),0x0800);assert.equal(buf.readUInt16LE(8),0);
 assert.equal(buf.readUInt32LE(14),zip.crc32(entries[0].data));assert.equal(buf.readUInt16LE(buf.length-12),2);
 const start=buf.readUInt32LE(buf.length-6);assert.equal(buf.readUInt32LE(start),0x02014b50);assert.equal(buf.readUInt32LE(buf.length-22),0x06054b50);
 assert(buf.includes(Buffer.from('CafèNoir')));assert.equal(zip.crc32(new TextEncoder().encode('123456789')),0xcbf43926);
});
test('ZIP rejects duplicate names and paths',()=>{
 const a={name:'same.png',data:new Uint8Array()};assert.throws(()=>zip.create([a,a]));assert.throws(()=>zip.create([{...a,name:'../private.png'}]));
});
test('settings have separate export/import/sharing boxes and no duplicate action IDs',()=>{
 const starts=['exportCardsBox','importCardsBox','sharingCardsBox'].map(id=>html.indexOf('id="'+id+'"'));
 const sections=starts.map((start,i)=>html.slice(start,starts[i+1]||html.indexOf('id="importFile"',start)));
 assert(sections[0].includes('id="exportData"')&&sections[0].includes('id="exportCardImages"'));assert(!sections[0].includes('id="importData"'));
 assert(sections[1].includes('id="importData"')&&sections[1].includes('id="importImagesProfile"'));assert(!sections[1].includes('id="exportData"'));
 assert(sections[2].includes('id="shareBackup"'));
 for(const id of ['exportData','importData','shareBackup','importImagesProfile'])assert.equal(html.split('id="'+id+'"').length-1,1);
});
function fixture(fail=false){
 const nodes={exportCardImages:{disabled:false},zipExportStatus:{textContent:''},shareCardImagesZip:{hidden:false}},downloads=[],source=html.slice(html.indexOf('let preparedImagesZip='),html.indexOf('async function createShareCard('));
 const ctx={Uint8Array,File,Blob,setTimeout:(fn,ms)=>ms===0?setTimeout(fn,0):null,URL:{createObjectURL:()=>'blob:test',revokeObjectURL(){}},cards:[{name:'Metro',code:'00123',format:'CODE128',color:'#FFFF00'},{name:'Metro',code:'00456',format:'CODE128',color:'#FFFF00'}],normalizeFormat:x=>x,inferManualFormat:()=> 'CODE128',bwipBcid:()=> 'code128',bwipjs:{toCanvas:(canvas,data)=>{if(fail&&data.text==='00456')throw Error('bad code');canvas.width=400;canvas.height=150}},FiCardZip:zip,toast(){},document:{getElementById:id=>nodes[id],createElement:tag=>tag==='a'?{click(){downloads.push(this.download)},remove(){}}:{},body:{appendChild(){}}},createShareCard:async(card,barcode)=>({width:1080,height:800,toBlob:fn=>fn(new Blob([new Uint8Array([137,80,78,71])],{type:'image/png'}))}),navigator:{canShare:()=>false}};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(source,ctx);return {ctx,nodes,downloads};
}
test('bulk export generates every card offscreen with unique filenames and leaves wallet data unchanged',async()=>{
 const f=fixture(),before=JSON.stringify(f.ctx.cards);await f.ctx.exportCardImages();assert.equal(f.downloads.length,1);assert(f.downloads[0].endsWith('.zip'));assert.equal(f.nodes.shareCardImagesZip.hidden,false);assert.equal(f.nodes.exportCardImages.disabled,false);assert.equal(JSON.stringify(f.ctx.cards),before);
 assert(f.nodes.zipExportStatus.textContent.includes('2 PNG'));
});
test('a failed card prevents a partial archive from being downloaded',async()=>{
 const f=fixture(true);await f.ctx.exportCardImages();assert.equal(f.downloads.length,0);assert.equal(f.nodes.shareCardImagesZip.hidden,true);assert.equal(f.nodes.exportCardImages.disabled,false);assert.match(f.nodes.zipExportStatus.textContent,/Metro/);
});
