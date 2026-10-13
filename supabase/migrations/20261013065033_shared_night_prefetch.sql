alter table ficard_private.shared_cells add column origin text not null default 'user' check(origin in ('user','prefetch')),add column last_requested_at timestamptz default now();
create table ficard_private.shared_night_runs(day date primary key,started_at timestamptz not null default now(),added_cells integer not null default 0);
alter table ficard_private.shared_night_runs enable row level security;
revoke all on ficard_private.shared_night_runs from public,anon,authenticated;
create or replace function public.ficard_shared_read(p_cells jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_cell record; fresh boolean; count_new integer:=0; queue_note text:=null; result jsonb;
begin
 if not (select enabled from ficard_private.shared_config where id) then return '{"disabled":true}'::jsonb; end if;
 if jsonb_typeof(p_cells) is distinct from 'array' or jsonb_array_length(p_cells) not between 1 and 16 then raise exception 'Invalid sectors'; end if;
 if exists(select 1 from jsonb_to_recordset(p_cells) as t(y integer,x integer) where y is null or x is null or y<700 or y>=960 or x<120 or x>=380) then raise exception 'Invalid sectors'; end if;
 -- Admission is serialized so repeated anonymous requests cannot bypass quotas.
 perform pg_advisory_xact_lock(1938437027);
 for v_cell in select distinct y,x from jsonb_to_recordset(p_cells) as t(y integer,x integer) loop
  if not exists(select 1 from ficard_private.shared_cells where y=v_cell.y and x=v_cell.x) then
   if (select count(*) from ficard_private.shared_cells where created_at>=date_trunc('day',now()))>=64 or (select count(*) from ficard_private.shared_cells where status in ('pending','loading'))>=64 then
    queue_note:='capacity';continue;
   end if;
   insert into ficard_private.shared_cells(y,x) values(v_cell.y,v_cell.x);count_new:=count_new+1;
  end if;
  update ficard_private.shared_cells set origin='user',last_requested_at=now() where y=v_cell.y and x=v_cell.x;
  update ficard_private.shared_cells set status='pending',retry_after=null
  where y=v_cell.y and x=v_cell.x and status='ready' and fetched_at<now()-interval '30 days';
 end loop;
 select jsonb_agg(jsonb_build_object('y',r.y,'x',r.x,'complete',coalesce(c.status='ready' and c.fetched_at>=now()-interval '30 days',false),'status',coalesce(c.status,'deferred'),'fetched_at',c.fetched_at,'elements',coalesce(c.elements,'[]'::jsonb))) into result
 from (select distinct y,x from jsonb_to_recordset(p_cells) as t(y integer,x integer)) r
 left join ficard_private.shared_cells c on c.y=r.y and c.x=r.x;
 return jsonb_build_object('cells',result,'queued_new',count_new,'queue',queue_note,'attribution','© OpenStreetMap contributors · ODbL');
end$$;

create or replace function ficard_private.shared_request(p_y integer,p_x integer,p_lease uuid,p_attempt integer)
returns bigint language plpgsql security invoker set search_path='' as $$
declare v_id bigint; query text; v_endpoint text; used integer;
begin
 insert into ficard_private.shared_budget(day,calls) values(current_date,0) on conflict(day) do nothing;
 update ficard_private.shared_budget set calls=calls+1 where day=current_date and calls<(case when (select origin from ficard_private.shared_cells where y=p_y and x=p_x)='prefetch' then 80 else 120 end) returning calls into used;
 if used is null then
  update ficard_private.shared_cells set status='error',lease=null,retry_after=(current_date+1)::timestamptz,last_error='Daily source budget reached' where y=p_y and x=p_x and lease=p_lease;return null;
 end if;
 v_endpoint:=case when p_attempt=0 then 'https://overpass-api.de/api/interpreter' else 'https://maps.mail.ru/osm/tools/overpass/api/interpreter' end;
 query:=format('[out:json][timeout:10][maxsize:16777216];(nwr["shop"](%s,%s,%s,%s);nwr["amenity"~"^(fuel|pharmacy)$"](%s,%s,%s,%s););out center tags;',p_y/20.0,p_x/20.0,(p_y+1)/20.0,(p_x+1)/20.0,p_y/20.0,p_x/20.0,(p_y+1)/20.0,(p_x+1)/20.0);
 v_id:=net.http_get(url:=v_endpoint,params:=jsonb_build_object('data',query),headers:=jsonb_build_object('User-Agent','Fi-Card/0.9.206 (https://fi-card.app; info@fi-card.app)'),timeout_milliseconds:=30000);
 insert into ficard_private.shared_requests(request_id,y,x,lease,endpoint_attempt) values(v_id,p_y,p_x,p_lease,p_attempt);
 update ficard_private.shared_cells set endpoint=v_endpoint where y=p_y and x=p_x;return v_id;
end$$;

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
 select * into c from ficard_private.shared_cells where (retry_after is null or retry_after<=now()) and (status<>'ready' or fetched_at<now()-interval '30 days') and (origin='user' or extract(hour from now() at time zone 'Europe/Rome') between 1 and 5) order by (origin='user') desc,last_requested_at desc nulls last,attempts,created_at for update skip locked limit 1;
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
