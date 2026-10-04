const assert=require('node:assert/strict');
const {validGTIN,normalizeBarcode,ocrCodes,expandUPCE,consensus}=require('../scandixit-scanner.js');
for(const code of ['4006381333931','96385074','036000291452','10012345000017'])assert(validGTIN(code),code);
for(const code of ['4006381333932','00000000','12345','40063813339310','abcdefgh'])assert(!validGTIN(code),code);
assert.equal(normalizeBarcode('4 006381 333931'),'4006381333931');
assert.equal(expandUPCE('04252614'),'042100005264');
assert.equal(normalizeBarcode('04252614','UPC_E'),'042100005264');
assert.deepEqual(ocrCodes('4 006381 333931\nModel ABC4006381333931\n4006381333932'),['4006381333931']);
assert.deepEqual(ocrCodes('4006381\n333931'),[]);
assert.deepEqual(ocrCodes('O4006381333931\n4006381333931X\n9994006381333931'),[]);
assert.deepEqual(ocrCodes('4006381333931\n036000291452'),['4006381333931','036000291452']);
const vote=consensus();assert(!vote('a',1));assert(vote('a',2));assert(!vote('b',3));assert(!vote('b',7000));assert(vote('b',7100));
console.log('GTIN, UPC-E, OCR extraction and live consensus: passed');

const {initialZoom}=require('../scandixit-scanner.js');
assert.equal(initialZoom({min:1,max:4,step:.1}),3);
assert.equal(initialZoom({min:1,max:1.5,step:.1}),1.5);
assert.equal(initialZoom({min:3,max:6,step:.1}),3);
assert.equal(initialZoom({min:1,max:4,step:.6}),2.8);
