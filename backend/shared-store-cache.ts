import {createClient} from "npm:@supabase/supabase-js@2.57.4";
const cors={"access-control-allow-origin":"*","access-control-allow-methods":"POST,OPTIONS","access-control-allow-headers":"content-type","content-type":"application/json","cache-control":"no-store"};
const send=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return send({error:"POST only"},405);
 if(Number(req.headers.get("content-length")||0)>2048)return send({error:"Request too large"},413);
 try{
  const raw=await req.text();if(raw.length>2048)return send({error:"Request too large"},413);
  const body=JSON.parse(raw),cells=body.cells;
  if(Object.keys(body).some(k=>!["cells","pharmacies"].includes(k))||(body.pharmacies!==undefined&&typeof body.pharmacies!=="boolean")||!Array.isArray(cells)||!cells.length||cells.length>16||cells.some(c=>!c||Object.keys(c).some(k=>!["y","x"].includes(k))||!Number.isInteger(c.y)||!Number.isInteger(c.x)||c.y<700||c.y>=960||c.x<120||c.x>=380)||new Set(cells.map(c=>c.y+"/"+c.x)).size!==cells.length)return send({error:"Invalid sectors"},400);
  const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
  const {data,error}=await db.rpc("ficard_shared_read",{p_cells:cells});
  if(error){console.error(error.message);return send({error:"Archive unavailable"},503);}
  if(body.pharmacies===true&&!data.disabled){
   const pharmacies=await db.rpc("ficard_national_pharmacies_read",{p_cells:cells});
   if(pharmacies.error){console.error(pharmacies.error.message);return send({error:"Pharmacy archive unavailable"},503);}
   for(const cell of data.cells){const points=pharmacies.data.find((p:{y:number,x:number})=>p.y===cell.y&&p.x===cell.x);cell.elements.push(...(points?.elements||[]));}
   data.pharmacies_included=true;
   data.attribution+=" · Farmacie: Ministero della Salute · IODL 2.0";
  }
  return send(data);
 }catch{return send({error:"Invalid request"},400);}
});
