/* Local ZIP writer. PNG files are already compressed: store without recompression. */
(function(root){'use strict';
const encoder=new TextEncoder(),table=new Uint32Array(256);
for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0}
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=table[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0}
function header(size){const bytes=new Uint8Array(size);return {bytes,view:new DataView(bytes.buffer)}}
function create(entries){
 if(!Array.isArray(entries)||entries.length>65535)throw Error('Too many ZIP entries');
 const files=[],directory=[],names=new Set();let offset=0,centralSize=0;
 for(const entry of entries){
  if(!entry||!(entry.data instanceof Uint8Array)||typeof entry.name!=='string'||!entry.name||/[\\/\x00]/.test(entry.name)||names.has(entry.name))throw Error('Invalid ZIP entry');
  names.add(entry.name);const name=encoder.encode(entry.name),size=entry.data.length,crc=crc32(entry.data);
  if(name.length>65535||size>0xffffffff)throw Error('ZIP entry too large');
  const local=header(30),lv=local.view;lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x0800,true);lv.setUint16(12,33,true);lv.setUint32(14,crc,true);lv.setUint32(18,size,true);lv.setUint32(22,size,true);lv.setUint16(26,name.length,true);
  const central=header(46),cv=central.view;cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x0800,true);cv.setUint16(14,33,true);cv.setUint32(16,crc,true);cv.setUint32(20,size,true);cv.setUint32(24,size,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);
  files.push(local.bytes,name,entry.data);directory.push(central.bytes,name);offset+=30+name.length+size;centralSize+=46+name.length;
  if(offset+centralSize+22>0xffffffff)throw Error('ZIP too large');
 }
 const end=header(22),ev=end.view;ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);
 return new Blob([...files,...directory,end.bytes],{type:'application/zip'});
}
root.FiCardZip={create,crc32};if(typeof module!=='undefined')module.exports=root.FiCardZip;
})(typeof window==='undefined'?globalThis:window);
