(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LivornoCache=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const brands={conad:{label:'Conad',color:'#be2332',initial:'C'},lidl:{label:'Lidl',color:'#2453b8',initial:'L'},decathlon:{label:'Decathlon',color:'#1677ba',initial:'D'},ip:{label:'IP',color:'#df6800',initial:'IP'}};
 const key=slug=>'ficard:livorno-pilot:v2:'+slug;
 const endpoint='https://jzmuwixgryvbbqqaudkh.supabase.co/functions/v1/ficard-livorno-read';
 function valid(data,slug){
  return !!data&&data.brand===slug&&Array.isArray(data.stores)&&data.count===data.stores.length&&data.stores.every(x=>['node','way','relation'].includes(x.osm_type)&&Number.isSafeInteger(x.osm_id)&&Number.isFinite(x.lat)&&Number.isFinite(x.lon)&&x.lat>=43.45&&x.lat<=43.65&&x.lon>=10.22&&x.lon<=10.43);
 }
 function read(storage){const data={},warnings=[];for(const slug of Object.keys(brands)){try{const raw=storage.getItem(key(slug));if(raw){const d=JSON.parse(raw);if(valid(d,slug)&&d.complete)data[slug]=d;else warnings.push(slug);}}catch(e){warnings.push(slug);}}return {data,warnings};}
 function stores(data,filter='all'){return Object.entries(data).filter(([slug])=>filter==='all'||slug===filter).flatMap(([slug,d])=>d.stores.map(x=>({...x,slug})));}
 function expired(d){return !d.state?.fetched_at||Date.now()-Date.parse(d.state.fetched_at)>=30*86400000||!Number.isFinite(Date.parse(d.state.fetched_at));}
 async function refresh({storage,fetcher=fetch,mode='online',online=true,signal}){
  const cached=read(storage),data={...cached.data},errors=[],warnings=[];
  if(mode==='cache'||!online)return {data,errors,warnings,source:'local',requests:0};
  if(mode==='error')return {data,errors:['Errore server simulato (503). Nessuna richiesta inviata.'],warnings,source:'fallback',requests:0};
  let requests=0;
  await Promise.all(Object.keys(brands).map(async slug=>{
   try{
    requests++;const r=await fetcher(endpoint+'?brand='+slug,{signal:signal||AbortSignal.timeout(15000),cache:'no-store'});
    if(!r.ok)throw Error('HTTP '+r.status);
    const d=await r.json();if(!valid(d,slug))throw Error('Risposta non valida');
    if(!d.complete){errors.push(brands[slug].label+': '+(d.source||'archivio incompleto'));return;}
    data[slug]=d;
    try{storage.setItem(key(slug),JSON.stringify(d));}catch(e){warnings.push(brands[slug].label+': salvataggio locale non disponibile');}
   }catch(e){errors.push(brands[slug].label+': '+String(e));}
  }));
  return {data,errors,warnings,source:errors.length?'fallback':'server',requests};
 }
 return {brands,key,endpoint,valid,read,stores,expired,refresh};
});
