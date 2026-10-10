/* ScanDixit catalog transport: first match, bounded requests and honest failures. */
(function(root){
'use strict';
const hosts=['world.openbeautyfacts.org','world.openfoodfacts.org','world.openpetfoodfacts.org','world.openproductsfacts.org'];
const fields='code,product_name,product_name_en,generic_name,brands,quantity,product_type,categories,ingredients_text,allergens,labels,countries,origins,manufacturing_places,packaging,stores,created_t,last_modified_t,image_front_small_url,image_front_url';
const cache=new Map();
function failure(reason){return Object.assign(new Error(reason),{reason})}
async function request(host,code,version,fetcher,timeoutMs,signal){
 const controller=new AbortController();let timer;
 const cancel=()=>controller.abort();signal.addEventListener('abort',cancel,{once:true});
 try{
  if(signal.aborted)throw failure('cancelled');
  return await Promise.race([
   (async()=>{
    let response;try{response=await fetcher('https://'+host+'/api/'+version+'/product/'+encodeURIComponent(code)+'.json?fields='+encodeURIComponent(fields),{signal:controller.signal,credentials:'omit'});}catch(e){throw failure(signal.aborted?'cancelled':'network')}
    let data;try{data=await response.json()}catch(e){throw failure('response')}
    const missing=data.result?.id==='product_not_found'||data.result?.id==='product_found_with_a_different_product_type'||data.status===0;
    if(response.status===404&&missing)return {host,state:'missing'};
    if(!response.ok)throw failure('http_'+response.status);
    if((data.status===1||['success','success_with_errors'].includes(data.status))&&data.product&&String(data.product.code)===code)return {host,state:'found',data};
    if(missing)return {host,state:'missing'};
    throw failure('response');
   })(),
   new Promise((_,reject)=>{timer=setTimeout(()=>{reject(failure(signal.aborted?'cancelled':'timeout'));controller.abort()},timeoutMs)})
  ]);
 }finally{clearTimeout(timer);signal.removeEventListener('abort',cancel);controller.abort()}
}
async function lookup(code,options={}){
 code=String(code);if(cache.has(code))return cache.get(code);
 const fetcher=options.fetcher||root.fetch.bind(root),timeoutMs=options.timeoutMs??7000;
 const controller=new AbortController(),signal=controller.signal;
 const cancel=()=>controller.abort();options.signal?.addEventListener('abort',cancel,{once:true});if(options.signal?.aborted)cancel();
 try{
  const result=await new Promise(resolve=>{
   let remaining=hosts.length,settled=false;const checks=[];
   const finish=value=>{if(settled)return;settled=true;resolve(value);controller.abort()};
   for(const host of hosts)(async()=>{
    let outcome;
    for(const version of ['v3','v2']){
     try{outcome=await request(host,code,version,fetcher,timeoutMs,signal);break}catch(error){
      outcome={host,state:'unavailable',reason:error.reason||'network'};
      if(signal.aborted||error.reason==='http_429')break;
     }
    }
    if(settled)return;
    if(outcome.state==='found'){finish({...outcome,checks:[outcome]});return}
    checks.push(outcome);
    if(--remaining===0)finish({state:signal.aborted?'cancelled':checks.every(c=>c.state==='missing')?'missing':checks.every(c=>c.state==='unavailable')?'unavailable':'partial',checks});
   })();
  });
  if(result.state==='found'){cache.set(code,result);if(cache.size>32)cache.delete(cache.keys().next().value)}
  return result;
 }finally{options.signal?.removeEventListener('abort',cancel);controller.abort()}
}
const api={lookup};root.FiCardCatalog=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
