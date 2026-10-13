-- Remember a one-cell border around user searches, including diagonals.
-- Targets survive daily admission limits; importing prefetch cells does not expand them.
create table ficard_private.shared_halo_targets (
 y integer not null check(y between 700 and 959),
 x integer not null check(x between 120 and 379),
 requested_at timestamptz not null default now(),
 primary key(y,x)
);
alter table ficard_private.shared_halo_targets enable row level security;
revoke all on ficard_private.shared_halo_targets from public,anon,authenticated;

create function ficard_private.shared_register_halo()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.origin='user' then
  insert into ficard_private.shared_halo_targets(y,x,requested_at)
  select new.y+dy,new.x+dx,coalesce(new.last_requested_at,now())
  from generate_series(-1,1) dy cross join generate_series(-1,1) dx
  where new.y+dy between 700 and 959 and new.x+dx between 120 and 379
  on conflict(y,x) do update set requested_at=greatest(ficard_private.shared_halo_targets.requested_at,excluded.requested_at);
 end if;
 return new;
end$$;
revoke all on function ficard_private.shared_register_halo() from public,anon,authenticated;
create trigger shared_register_halo after insert or update of origin,last_requested_at
on ficard_private.shared_cells for each row execute function ficard_private.shared_register_halo();

-- Include searches already made before this rollout.
insert into ficard_private.shared_halo_targets(y,x,requested_at)
select c.y+dy,c.x+dx,max(coalesce(c.last_requested_at,c.created_at))
from ficard_private.shared_cells c cross join generate_series(-1,1) dy cross join generate_series(-1,1) dx
where c.origin='user' and c.y+dy between 700 and 959 and c.x+dx between 120 and 379
group by c.y+dy,c.x+dx;

create function ficard_private.shared_admit_halo()
returns integer language plpgsql security invoker set search_path='' as $$
declare allowance integer;added integer;
begin
 if not (select enabled from ficard_private.shared_config where id) then return 0;end if;
 if not coalesce((select warmup_until>now() from ficard_private.shared_config where id),false)
 and extract(hour from now() at time zone 'Europe/Rome') not between 1 and 5 then return 0;end if;
 perform pg_advisory_xact_lock(1938437027);
 delete from ficard_private.shared_halo_targets h where exists
 (select 1 from ficard_private.shared_cells c where c.y=h.y and c.x=h.x);
 allowance:=greatest(0,least(8,
  40-(select count(*)::integer from ficard_private.shared_cells where origin='prefetch' and created_at>=date_trunc('day',now())),
  48-(select count(*)::integer from ficard_private.shared_cells where created_at>=date_trunc('day',now())),
  48-(select count(*)::integer from ficard_private.shared_cells where status in ('pending','loading')),
  (80-coalesce((select calls from ficard_private.shared_budget where day=current_date),0))/2));
 insert into ficard_private.shared_cells(y,x,origin,last_requested_at)
 select y,x,'prefetch',null from ficard_private.shared_halo_targets
 order by requested_at desc,y,x limit allowance on conflict(y,x) do nothing;
 get diagnostics added=row_count;
 delete from ficard_private.shared_halo_targets h where exists
 (select 1 from ficard_private.shared_cells c where c.y=h.y and c.x=h.x);
 return added;
end$$;
revoke all on function ficard_private.shared_admit_halo() from public,anon,authenticated;

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
 perform ficard_private.shared_admit_halo();
 select * into c from ficard_private.shared_cells where (retry_after is null or retry_after<=now()) and (status<>'ready' or fetched_at<now()-interval '30 days') and (origin='user' or (select warmup_until>now() from ficard_private.shared_config where id) or extract(hour from now() at time zone 'Europe/Rome') between 1 and 5) order by (origin='user') desc,last_requested_at desc nulls last,attempts,created_at for update skip locked limit 1;
 if not found then return '{"status":"idle"}'::jsonb; end if;
 v_lease:=gen_random_uuid();
 update ficard_private.shared_cells set status='loading',lease=v_lease,retry_after=now()+interval '3 minutes',attempts=attempts+1,last_error=null where y=c.y and x=c.x;
 v_id:=ficard_private.shared_request(c.y,c.x,v_lease,0);return jsonb_build_object('status','queued','request_id',v_id);
end$$;

