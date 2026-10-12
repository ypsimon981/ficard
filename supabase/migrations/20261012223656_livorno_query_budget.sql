-- Keep the pilot query resource budget small; use the verified global fallback.
create or replace function ficard_private.request_livorno(p_job jsonb,p_endpoint_attempt integer default 0)
returns bigint language plpgsql security invoker set search_path='' as $$
declare v_endpoint text; v_label text; v_query text; v_request bigint;
begin
 v_endpoint:=case when p_endpoint_attempt=0 then 'https://overpass-api.de/api/interpreter' else 'https://maps.mail.ru/osm/tools/overpass/api/interpreter' end;
 v_label:=case p_job->>'slug' when 'ip' then 'IP' when 'conad' then 'Conad' when 'lidl' then 'Lidl' when 'decathlon' then 'Decathlon' end;
 if v_label is null then raise exception 'Invalid pilot brand'; end if;
 v_query:=format('[out:json][timeout:10][maxsize:16777216];(nwr["brand"="%s"](43.45,10.22,43.65,10.43);nwr["name"="%s"](43.45,10.22,43.65,10.43););out center tags;',v_label,v_label);
 v_request:=net.http_get(url:=v_endpoint,params:=jsonb_build_object('data',v_query),headers:=jsonb_build_object('User-Agent','Fi-Card/0.2 (https://fi-card.app; info@fi-card.app)'),timeout_milliseconds:=30000);
 insert into ficard_private.livorno_requests(request_id,brand_id,lease,slug,endpoint,endpoint_attempt)
 values(v_request,(p_job->>'brand_id')::bigint,(p_job->>'lease')::uuid,p_job->>'slug',v_endpoint,p_endpoint_attempt);
 return v_request;
end$$;
revoke all on function ficard_private.request_livorno(jsonb,integer) from public,anon,authenticated;

create or replace function public.ficard_livorno_claim_job()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_brand bigint; v_slug text; v_lease uuid;
begin
 select c.brand_id,b.slug into v_brand,v_slug
 from public.ficard_store_cells c join public.ficard_store_brands b on b.id=c.brand_id
 where c.cell_key='livorno-pilot-v1' and b.slug in ('ip','conad','lidl','decathlon')
 and (c.retry_after is null or c.retry_after<=now())
 and (c.status<>'ready' or c.fetched_at is null or c.fetched_at<now()-interval '30 days')
 order by c.attempts,b.slug for update of c skip locked limit 1;
 if v_brand is null then return null; end if;
 v_lease:=gen_random_uuid();
 update public.ficard_store_cells set status='loading',last_error=null,lease=v_lease,retry_after=now()+interval '3 minutes',attempts=attempts+1
 where brand_id=v_brand and cell_key='livorno-pilot-v1';
 return jsonb_build_object('brand_id',v_brand,'slug',v_slug,'lease',v_lease);
end$$;

create or replace function public.ficard_livorno_finish_job(p_brand_id bigint,p_lease uuid,p_rows jsonb,p_error text,p_duration_ms integer,p_endpoint text)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.ficard_store_cells where brand_id=p_brand_id and cell_key='livorno-pilot-v1' and lease=p_lease and status='loading' for update;
 if not found then return false; end if;
 if p_error is not null then
  update public.ficard_store_cells set status='error',last_error=left(p_error,1000),duration_ms=p_duration_ms,lease=null,retry_after=now()+interval '1 hour'
  where brand_id=p_brand_id and cell_key='livorno-pilot-v1';
  return true;
 end if;
 if jsonb_typeof(p_rows) is distinct from 'array' then raise exception 'Expected array'; end if;
 if exists(select 1 from jsonb_to_recordset(p_rows) as r(osm_type text,osm_id bigint,lat float8,lon float8)
 where osm_type is null or osm_type not in ('node','way','relation') or osm_id is null or lat is null or lon is null or not(lat between 43.45 and 43.65 and lon between 10.22 and 10.43)) then raise exception 'Invalid Livorno rows'; end if;
 -- The replacement and ready flag commit together; partial imports remain invisible.
 delete from public.ficard_store_locations where brand_id=p_brand_id and lat between 43.45 and 43.65 and lon between 10.22 and 10.43;
 insert into public.ficard_store_locations(osm_type,osm_id,brand_id,name,lat,lon,tags,updated_at)
 select distinct on(osm_type,osm_id) osm_type,osm_id,p_brand_id,name,lat,lon,coalesce(tags,'{}'::jsonb),now()
 from jsonb_to_recordset(p_rows) as r(osm_type text,osm_id bigint,name text,lat float8,lon float8,tags jsonb)
 on conflict(osm_type,osm_id,brand_id) do update set name=excluded.name,lat=excluded.lat,lon=excluded.lon,tags=excluded.tags,updated_at=excluded.updated_at;
 update public.ficard_store_cells set status='ready',fetched_at=now(),retry_after=null,lease=null,last_error=null,duration_ms=p_duration_ms,endpoint=p_endpoint
 where brand_id=p_brand_id and cell_key='livorno-pilot-v1';
 return true;
end$$;

