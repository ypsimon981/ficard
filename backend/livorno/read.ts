import {createClient} from "npm:@supabase/supabase-js@2.57.4";
const headers={"access-control-allow-origin":"*","access-control-allow-methods":"GET,OPTIONS","access-control-allow-headers":"authorization,apikey,content-type","content-type":"application/json","cache-control":"no-store"};
const send=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="GET")return send({error:"GET only"},405);
 const slug=new URL(req.url).searchParams.get("brand")||"";
 if(!["ip","conad","lidl","decathlon"].includes(slug))return send({error:"Invalid brand"},400);
 try{
  const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
  const {data,error}=await db.rpc("ficard_livorno_cache",{p_slug:slug});
  if(error||!data)throw Error("Cache read failed");
  const {state,stores}=data;
  const fresh=state?.status==="ready"&&state.fetched_at&&Date.now()-Date.parse(state.fetched_at)<30*86400000;
  const source=fresh?"cache":stores?.length?"stale_cache":state?.status==="loading"?"in_progress":state?.status==="error"?"unavailable":"not_populated";
  return send({brand:slug,area:"Livorno pilot",source,complete:!!fresh,state,count:stores?.length||0,stores:stores||[],attribution:"© OpenStreetMap contributors · ODbL"});
 }catch(e){console.error(String(e));return send({error:"Cache temporarily unavailable"},503);}
});
