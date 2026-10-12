create extension if not exists pg_net;
create extension if not exists pg_cron;
create schema if not exists ficard_private;
revoke all on schema ficard_private from public,anon,authenticated;
alter table public.ficard_store_cells
 add column if not exists lease uuid,
 add column if not exists last_error text,
 add column if not exists attempts integer not null default 0,
 add column if not exists duration_ms integer,
 add column if not exists endpoint text;
do $$begin
 if not exists(select 1 from vault.secrets where name='ficard_livorno_worker_token') then
  perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'ficard_livorno_worker_token');
 end if;
end$$;

create or replace function public.ficard_livorno_authorize_worker(p_token text)
returns boolean language sql security definer set search_path='' as $$
 select exists(select 1 from vault.decrypted_secrets where name='ficard_livorno_worker_token' and decrypted_secret=p_token);
$$;

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
 update public.ficard_store_cells set status='loading',lease=v_lease,retry_after=now()+interval '2 minutes',attempts=attempts+1
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
 if jsonb_typeof(p_rows)<>'array' then raise exception 'Expected array'; end if;
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

revoke all on function public.ficard_livorno_authorize_worker(text),public.ficard_livorno_claim_job(),public.ficard_livorno_finish_job(bigint,uuid,jsonb,text,integer,text) from public,anon,authenticated;
grant execute on function public.ficard_livorno_authorize_worker(text),public.ficard_livorno_claim_job(),public.ficard_livorno_finish_job(bigint,uuid,jsonb,text,integer,text) to service_role;
-- Retire the old synchronous importer lock.
revoke all on function public.ficard_claim_pilot_cell(bigint,text) from public,anon,authenticated,service_role;

create or replace function ficard_private.dispatch_livorno()
returns bigint language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.ficard_store_cells c join public.ficard_store_brands b on b.id=c.brand_id
 where c.cell_key='livorno-pilot-v1' and b.slug in ('ip','conad','lidl','decathlon')
 and (c.retry_after is null or c.retry_after<=now())
 and (c.status<>'ready' or c.fetched_at is null or c.fetched_at<now()-interval '30 days')) then return null; end if;
 return net.http_post(
 url:='https://jzmuwixgryvbbqqaudkh.supabase.co/functions/v1/ficard-livorno-worker',
 headers:=jsonb_build_object('content-type','application/json','x-ficard-worker-token',(select decrypted_secret from vault.decrypted_secrets where name='ficard_livorno_worker_token')),
 body:='{}'::jsonb,timeout_milliseconds:=10000);
end$$;
revoke all on function ficard_private.dispatch_livorno() from public,anon,authenticated;
select cron.schedule('ficard-livorno-import','* * * * *','select ficard_private.dispatch_livorno();');
