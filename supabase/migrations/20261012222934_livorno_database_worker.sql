-- Overpass rejects requests from the Edge egress. pg_net uses database egress.
create table ficard_private.livorno_requests(
 request_id bigint primary key, brand_id bigint not null, lease uuid not null,
 slug text not null, endpoint text not null, endpoint_attempt integer not null default 0,
 started_at timestamptz not null default now()
);
alter table ficard_private.livorno_requests enable row level security;
revoke all on ficard_private.livorno_requests from public,anon,authenticated;

create or replace function ficard_private.request_livorno(p_job jsonb,p_endpoint_attempt integer default 0)
returns bigint language plpgsql security invoker set search_path='' as $$
declare v_endpoint text; v_label text; v_query text; v_request bigint;
begin
 v_endpoint:=case when p_endpoint_attempt=0 then 'https://overpass-api.de/api/interpreter' else 'https://overpass.kumi.systems/api/interpreter' end;
 v_label:=case p_job->>'slug' when 'ip' then 'IP' when 'conad' then 'Conad' when 'lidl' then 'Lidl' when 'decathlon' then 'Decathlon' end;
 if v_label is null then raise exception 'Invalid pilot brand'; end if;
 v_query:=format('[out:json][timeout:20];(nwr["brand"="%s"](43.45,10.22,43.65,10.43);nwr["name"="%s"](43.45,10.22,43.65,10.43););out center tags;',v_label,v_label);
 v_request:=net.http_get(url:=v_endpoint,params:=jsonb_build_object('data',v_query),headers:=jsonb_build_object('User-Agent','Fi-Card/0.2 (https://fi-card.app; info@fi-card.app)'),timeout_milliseconds:=30000);
 insert into ficard_private.livorno_requests(request_id,brand_id,lease,slug,endpoint,endpoint_attempt)
 values(v_request,(p_job->>'brand_id')::bigint,(p_job->>'lease')::uuid,p_job->>'slug',v_endpoint,p_endpoint_attempt);
 return v_request;
end$$;
revoke all on function ficard_private.request_livorno(jsonb,integer) from public,anon,authenticated;

create or replace function public.ficard_livorno_tick()
returns jsonb language plpgsql security definer set search_path='' as $$
declare j record; r record; payload jsonb; rows jsonb; err text; job jsonb; v_request bigint;
begin
 if not pg_try_advisory_xact_lock(1938437026) then return '{"status":"busy"}'::jsonb; end if;
 for j in select * from ficard_private.livorno_requests loop
  select * into r from net._http_response where id=j.request_id;
  if not found and j.started_at>now()-interval '90 seconds' then return '{"status":"waiting"}'::jsonb; end if;
  err:=null;
  begin
   if r.id is null or r.timed_out or r.error_msg is not null then raise exception 'Network timeout or error: %',coalesce(r.error_msg,'timeout'); end if;
   if r.status_code<>200 then raise exception 'Overpass HTTP %: %',r.status_code,left(r.content,500); end if;
   payload:=r.content::jsonb;
   if payload ? 'remark' or jsonb_typeof(payload->'elements') is distinct from 'array' then raise exception 'Incomplete Overpass response'; end if;
   select coalesce(jsonb_agg(jsonb_build_object('osm_type',x->>'type','osm_id',(x->>'id')::bigint,'name',coalesce(x->'tags'->>'name',j.slug),'lat',coalesce(x->'lat',x->'center'->'lat'),'lon',coalesce(x->'lon',x->'center'->'lon'),'tags',coalesce(x->'tags','{}'::jsonb))),'[]'::jsonb)
   into rows from jsonb_array_elements(payload->'elements') x;
   perform public.ficard_livorno_finish_job(j.brand_id,j.lease,rows,null,(extract(epoch from now()-j.started_at)*1000)::integer,j.endpoint);
  exception when others then err:=left(sqlerrm,1000);
  end;
  delete from ficard_private.livorno_requests where request_id=j.request_id;
  if err is not null then
   if j.endpoint_attempt=0 then
    job:=jsonb_build_object('brand_id',j.brand_id,'slug',j.slug,'lease',j.lease);
    v_request:=ficard_private.request_livorno(job,1);
    return jsonb_build_object('status','fallback','request_id',v_request);
   end if;
   perform public.ficard_livorno_finish_job(j.brand_id,j.lease,'[]'::jsonb,err,(extract(epoch from now()-j.started_at)*1000)::integer,j.endpoint);
  end if;
 end loop;
 job:=public.ficard_livorno_claim_job();
 if job is null then return '{"status":"idle"}'::jsonb; end if;
 v_request:=ficard_private.request_livorno(job);
 return jsonb_build_object('status','queued','brand',job->>'slug','request_id',v_request);
end$$;
revoke all on function public.ficard_livorno_tick() from public,anon,authenticated;
grant execute on function public.ficard_livorno_tick() to service_role;
select cron.schedule('ficard-livorno-import','30 seconds','select public.ficard_livorno_tick();');
