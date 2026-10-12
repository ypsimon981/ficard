import {createClient} from "npm:@supabase/supabase-js@2.57.4";
const send=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
Deno.serve(async req=>{
 if(req.method!=="POST")return send({error:"POST only"},405);
 const token=req.headers.get("x-ficard-worker-token");
 if(!token||token.length!==64)return send({error:"Unauthorized"},401);
 const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
 const {data:authorized,error:ae}=await db.rpc("ficard_livorno_authorize_worker",{p_token:token});
 if(ae||!authorized)return send({error:"Unauthorized"},401);
 const {data,error}=await db.rpc("ficard_livorno_tick");
 return error?send({error:"Queue unavailable"},503):send(data,202);
});
