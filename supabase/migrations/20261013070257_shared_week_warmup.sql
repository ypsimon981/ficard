alter table ficard_private.shared_config add column warmup_until timestamptz;
update ficard_private.shared_config set warmup_until=now()+interval '7 days' where id;
create or replace function public.ficard_shared_tick()
returns jsonb language plpgsql security definer set search_path='' as $$
declare j record;r record;c record;payload jsonb;compact jsonb;err text;v_lease uuid;v_id bigint;
begin
 if not (select enabled from ficard_private.shared_config where id) then return '{"status":"disabled"}'::jsonb; end if;
 if not pg_try_advisory_xact_lock(1938437028) then return '{"status":"busy"}'::jsonb; end if;
 for j in select * from ficard_private.shared_requests loop
  select * into r from net._http_response where id=j.request_id;
  if not found and j.started_at>now()-interval '90 seconds' then return '{"status":"waiting"}'::jsonb; end if;
  err:=null;
  begin
   if r.id is null or r.timed_out or r.error_msg is not null then raise exception 'Source timeout'; end if;
   if r.status_code<>200 then raise exception 'Source HTTP %',r.status_code; end if;
   payload:=r.content::jsonb;
   if payload ? 'remark' or jsonb_typeof(payload->'elements') is distinct from 'array' then raise exception 'Incomplete source response'; end if;
   if jsonb_array_length(payload->'elements')>12000 then raise exception 'Source response too large'; end if;
   if exists(select 1 from jsonb_array_elements(payload->'elements') e where e->>'type' is null or e->>'type' not in ('node','way','relation') or e->>'id' is null or coalesce(e->'lat',e->'center'->'lat') is null or coalesce(e->'lon',e->'center'->'lon') is null) then raise exception 'Malformed source element'; end if;
   select coalesce(jsonb_agg(jsonb_build_object('type',e->>'type','id',(e->>'id')::bigint,'lat',coalesce(e->'lat',e->'center'->'lat'),'lon',coalesce(e->'lon',e->'center'->'lon'),'tags',coalesce((select jsonb_object_agg(k,left(v,300)) from jsonb_each_text(e->'tags') t(k,v) where k in ('name','brand','operator','addr:street','addr:housenumber','addr:city','addr:suburb','addr:neighbourhood','addr:quarter','addr:district','addr:postcode')),'{}'::jsonb))),'[]'::jsonb)
   into compact from jsonb_array_elements(payload->'elements') e
   where (coalesce(e->>'lat',e->'center'->>'lat'))::float8>=j.y/20.0 and (coalesce(e->>'lat',e->'center'->>'lat'))::float8<(j.y+1)/20.0
   and (coalesce(e->>'lon',e->'center'->>'lon'))::float8>=j.x/20.0 and (coalesce(e->>'lon',e->'center'->>'lon'))::float8<(j.x+1)/20.0
   and (e->'tags' ? 'name' or e->'tags' ? 'brand' or e->'tags' ? 'operator')
   and not(e->'tags' ? 'disused' or e->'tags' ? 'abandoned' or e->'tags' ? 'disused:shop' or e->'tags' ? 'disused:amenity');
   update ficard_private.shared_cells set elements=compact,status='ready',fetched_at=now(),lease=null,retry_after=null,last_error=null where y=j.y and x=j.x and lease=j.lease;
  exception when others then err:=left(sqlerrm,300);
  end;
  delete from ficard_private.shared_requests where request_id=j.request_id;
  if err is not null then
   if j.endpoint_attempt=0 then v_id:=ficard_private.shared_request(j.y,j.x,j.lease,1);return jsonb_build_object('status','fallback','request_id',v_id);end if;
   update ficard_private.shared_cells set status='error',lease=null,retry_after=now()+interval '1 hour',last_error=err where y=j.y and x=j.x and lease=j.lease;
  end if;
 end loop;
 select * into c from ficard_private.shared_cells where (retry_after is null or retry_after<=now()) and (status<>'ready' or fetched_at<now()-interval '30 days') and (origin='user' or (select warmup_until>now() from ficard_private.shared_config where id) or extract(hour from now() at time zone 'Europe/Rome') between 1 and 5) order by (origin='user') desc,last_requested_at desc nulls last,attempts,created_at for update skip locked limit 1;
 if not found then return '{"status":"idle"}'::jsonb; end if;
 v_lease:=gen_random_uuid();
 update ficard_private.shared_cells set status='loading',lease=v_lease,retry_after=now()+interval '3 minutes',attempts=attempts+1,last_error=null where y=c.y and x=c.x;
 v_id:=ficard_private.shared_request(c.y,c.x,v_lease,0);return jsonb_build_object('status','queued','request_id',v_id);
end$$;

create or replace function public.ficard_shared_night_scan(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path='' as $$
declare local_day date;local_hour integer;allowance integer;added integer;claimed integer;
begin
 if not (select enabled from ficard_private.shared_config where id) then return '{"status":"disabled"}'::jsonb; end if;
 if (select warmup_until>p_now from ficard_private.shared_config where id) then return '{"status":"warmup_active"}'::jsonb;end if;
 local_day:=(p_now at time zone 'Europe/Rome')::date;
 local_hour:=extract(hour from p_now at time zone 'Europe/Rome');
 if local_hour<1 or local_hour>=6 then return '{"status":"not_night"}'::jsonb; end if;
 perform pg_advisory_xact_lock(1938437027);
 insert into ficard_private.shared_night_runs(day) values(local_day) on conflict(day) do nothing;
 get diagnostics claimed=row_count;
 if claimed=0 then return jsonb_build_object('status','already_prepared','day',local_day); end if;
 allowance:=greatest(0,least(20,
  64-(select count(*)::integer from ficard_private.shared_cells where created_at>=date_trunc('day',now())),
  48-(select count(*)::integer from ficard_private.shared_cells where status in ('pending','loading')),
  (80-coalesce((select calls from ficard_private.shared_budget where day=current_date),0))/2));
 with candidates as (
  select seed.y+dy as y,seed.x+dx as x,max(seed.last_requested_at) as requested,max(jsonb_array_length(seed.elements)) as density
  from ficard_private.shared_cells seed cross join generate_series(-1,1) dy cross join generate_series(-1,1) dx
  where seed.status='ready' and jsonb_array_length(seed.elements)>=3 and (dy<>0 or dx<>0)
  and seed.y+dy between 700 and 959 and seed.x+dx between 120 and 379
  and not exists(select 1 from ficard_private.shared_cells old where old.y=seed.y+dy and old.x=seed.x+dx)
  group by seed.y+dy,seed.x+dx
 ),chosen as (select y,x from candidates order by requested desc nulls last,density desc,y,x limit allowance)
 insert into ficard_private.shared_cells(y,x,origin,last_requested_at)
 select y,x,'prefetch',null from chosen on conflict(y,x) do nothing;
 get diagnostics added=row_count;
 update ficard_private.shared_night_runs set added_cells=added where day=local_day;
 return jsonb_build_object('status','prepared','day',local_day,'queued',added,'limit',20);
end$$;
revoke all on function public.ficard_shared_night_scan(timestamptz) from public,anon,authenticated;
grant execute on function public.ficard_shared_night_scan(timestamptz) to service_role;

create table ficard_private.shared_warmup_runs(slot timestamptz primary key,queued integer not null default 0);
alter table ficard_private.shared_warmup_runs enable row level security;
revoke all on ficard_private.shared_warmup_runs from public,anon,authenticated;
create or replace function public.ficard_shared_warmup(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path='' as $$
declare ends_at timestamptz;allowance integer;added integer;claimed integer;hour_slot timestamptz;
begin
 if not (select enabled from ficard_private.shared_config where id) then return '{"status":"disabled"}'::jsonb;end if;
 select warmup_until into ends_at from ficard_private.shared_config where id;
 if ends_at is null or p_now>=ends_at then return jsonb_build_object('status','finished','until',ends_at);end if;
 hour_slot:=date_trunc('hour',p_now);
 perform pg_advisory_xact_lock(1938437027);
 insert into ficard_private.shared_warmup_runs(slot) values(hour_slot) on conflict(slot) do nothing;
 get diagnostics claimed=row_count;
 if claimed=0 then return '{"status":"already_prepared"}'::jsonb;end if;
 allowance:=greatest(0,least(2,
  40-(select count(*)::integer from ficard_private.shared_cells where origin='prefetch' and created_at>=date_trunc('day',now())),
  48-(select count(*)::integer from ficard_private.shared_cells where created_at>=date_trunc('day',now())),
  48-(select count(*)::integer from ficard_private.shared_cells where status in ('pending','loading')),
  (80-coalesce((select calls from ficard_private.shared_budget where day=current_date),0))/2));
 with candidates as (
  select seed.y+dy as y,seed.x+dx as x,max(seed.last_requested_at) as requested,max(jsonb_array_length(seed.elements)) as density
  from ficard_private.shared_cells seed cross join generate_series(-1,1) dy cross join generate_series(-1,1) dx
  where seed.status='ready' and jsonb_array_length(seed.elements)>=3 and (dy<>0 or dx<>0)
  and seed.y+dy between 700 and 959 and seed.x+dx between 120 and 379
  and not exists(select 1 from ficard_private.shared_cells old where old.y=seed.y+dy and old.x=seed.x+dx)
  group by seed.y+dy,seed.x+dx
 ),chosen as (select y,x from candidates order by requested desc nulls last,density desc,y,x limit allowance)
 insert into ficard_private.shared_cells(y,x,origin,last_requested_at)
 select y,x,'prefetch',null from chosen on conflict(y,x) do nothing;
 get diagnostics added=row_count;
 update ficard_private.shared_warmup_runs set queued=added where slot=hour_slot;
 return jsonb_build_object('status','prepared','queued',added,'until',ends_at,'daily_limit',40);
end$$;
revoke all on function public.ficard_shared_warmup(timestamptz) from public,anon,authenticated;
grant execute on function public.ficard_shared_warmup(timestamptz) to service_role;
