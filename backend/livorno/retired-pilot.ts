Deno.serve(()=>new Response(JSON.stringify({error:"Synchronous import retired; background worker handles imports"}),{status:410,headers:{"content-type":"application/json"}}));
