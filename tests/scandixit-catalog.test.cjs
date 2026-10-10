const {test}=require('node:test'),assert=require('node:assert/strict'),{lookup}=require('../scandixit-catalog.js');
const miss=()=>({ok:false,status:404,json:async()=>({status:'failure',result:{id:'product_not_found'}})});
const hit=code=>({ok:true,status:200,json:async()=>({status:'success',product:{code,product_name:'Hydra bomb',brands:'Garnier'}})});
test('a product renders without waiting for another catalog that hangs; repeated lookup uses the successful result',async()=>{
 let calls=0;const fetcher=async url=>{calls++;return url.includes('openbeautyfacts')?hit('3600541944695'):new Promise(()=>{})};
 const result=await lookup('3600541944695',{fetcher,timeoutMs:25});assert.equal(result.state,'found');assert.equal(result.data.product.brands,'Garnier');
 const before=calls;await lookup('3600541944695',{fetcher});assert.equal(calls,before);
});
test('four genuine API 404 misses are not a connection outage and do not retry',async()=>{
 let calls=0;const result=await lookup('1111111111116',{fetcher:async()=>{calls++;return miss()}});assert.equal(result.state,'missing');assert.equal(calls,4);
});
test('transient browser errors retry once with the compatible API and recover',async()=>{
 const versions=[];const result=await lookup('2222222222222',{fetcher:async url=>{versions.push(url);if(url.includes('openbeautyfacts')&&url.includes('/v3/'))throw Error('Failed to fetch');if(url.includes('openbeautyfacts'))return hit('2222222222222');return miss()}});
 assert.equal(result.state,'found');assert.ok(versions.some(url=>url.includes('/v2/')));
});
test('partial failures remain inconclusive, total failure explains the browser connection, and rate limits do not retry',async()=>{
 const partial=await lookup('3333333333338',{fetcher:async url=>{if(url.includes('openbeautyfacts'))throw Error('Failed to fetch');return miss()}});assert.equal(partial.state,'partial');assert.equal(partial.checks.find(x=>x.host.includes('openbeautyfacts')).reason,'network');
 let count=0;const limited=await lookup('4444444444444',{fetcher:async()=>{count++;return {ok:false,status:429,json:async()=>({})}}});assert.equal(limited.state,'unavailable');assert.equal(count,4);
});
test('stalled requests terminate with a bounded timeout even when fetch ignores abort',async()=>{
 const result=await lookup('5555555555550',{fetcher:()=>new Promise(()=>{}),timeoutMs:10});assert.equal(result.state,'unavailable');assert.ok(result.checks.every(x=>x.reason==='timeout'));
});
test('new search cancellation cannot return a late product',async()=>{
 const controller=new AbortController();controller.abort();const result=await lookup('6666666666666',{signal:controller.signal,fetcher:async()=>hit('6666666666666'),timeoutMs:10});assert.equal(result.state,'cancelled');
});
