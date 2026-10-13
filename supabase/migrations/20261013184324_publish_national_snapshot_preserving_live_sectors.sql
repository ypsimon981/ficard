CREATE OR REPLACE FUNCTION public.ficard_shared_read(p_cells jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare v_cell record; count_new integer:=0; queue_note text:=null; result jsonb;
begin
 if not (select enabled from ficard_private.shared_config where id) then return '{"disabled":true}'::jsonb; end if;
 if jsonb_typeof(p_cells) is distinct from 'array' or jsonb_array_length(p_cells) not between 1 and 16 then raise exception 'Invalid sectors'; end if;
 if exists(select 1 from jsonb_to_recordset(p_cells) as t(y integer,x integer) where y is null or x is null or y<700 or y>=960 or x<120 or x>=380) then raise exception 'Invalid sectors'; end if;
 perform pg_advisory_xact_lock(1938437027);
 for v_cell in select distinct y,x from jsonb_to_recordset(p_cells) as t(y integer,x integer) loop
  if not exists(select 1 from ficard_private.shared_cells where y=v_cell.y and x=v_cell.x) then
   if (select count(*) from ficard_private.shared_cells where created_at>=date_trunc('day',now()))>=(case when coalesce((select warmup_until>now() from ficard_private.shared_config where id),false) then 256 else 64 end) or (select count(*) from ficard_private.shared_cells where status in ('pending','loading'))>=64 then
    queue_note:='capacity';continue;
   end if;
   insert into ficard_private.shared_cells(y,x) values(v_cell.y,v_cell.x);count_new:=count_new+1;
  end if;
  update ficard_private.shared_cells set origin='user',last_requested_at=now() where y=v_cell.y and x=v_cell.x;
  update ficard_private.shared_cells set status='pending',retry_after=null
  where y=v_cell.y and x=v_cell.x and status='ready' and fetched_at<now()-interval '30 days';
 end loop;
 select jsonb_agg(jsonb_build_object(
  'y',r.y,'x',r.x,
  'complete',coalesce(c.status='ready' and c.fetched_at>=now()-interval '30 days',false),
  'status',coalesce(c.status,case when s.y is not null then 'snapshot' else 'deferred' end),
  'fetched_at',c.fetched_at,
  'snapshot_available',s.y is not null,
  'snapshot_coverage_verified',coalesce(s.coverage_verified,false),
  'elements',merged.elements
 )) into result
 from (select distinct y,x from jsonb_to_recordset(p_cells) as t(y integer,x integer)) r
 left join ficard_private.shared_cells c on c.y=r.y and c.x=r.x
 left join ficard_private.national_snapshot_cells s on s.y=r.y and s.x=r.x and s.source_sha256='629f9d57b9cf864365ec809efb92693d9c4ea67b715e7f998f3fda26ffc5236a'
 cross join lateral (
  select coalesce(jsonb_agg(e order by e->>'type',(e->>'id')::bigint),'[]'::jsonb) elements
  from (
   select distinct on (e->>'type',e->>'id') e
   from (
    select e,0 priority from jsonb_array_elements(case when c.fetched_at>='2026-10-12T00:00:00Z'::timestamptz then '[]'::jsonb else coalesce(s.elements,'[]'::jsonb) end) e
    where (e->'tags' ? 'name' or e->'tags' ? 'brand' or e->'tags' ? 'operator')
    and not(e->'tags' ? 'disused' or e->'tags' ? 'abandoned' or e->'tags' ? 'disused:shop' or e->'tags' ? 'disused:amenity')
    union all
    select e,1 priority from jsonb_array_elements(coalesce(c.elements,'[]'::jsonb)) e
   ) candidates order by e->>'type',e->>'id',priority desc
  ) unique_elements
 ) merged;
 return jsonb_build_object('cells',result,'queued_new',count_new,'queue',queue_note,'attribution','© OpenStreetMap contributors · ODbL');
end $function$;
REVOKE ALL ON FUNCTION public.ficard_shared_read(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ficard_shared_read(jsonb) TO service_role;
