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
  update ficard_private.shared_cells set status='pending',retry_after=null
  where y=v_cell.y and x=v_cell.x and status='ready' and fetched_at<now()-interval '30 days';
 end loop;
 select jsonb_agg(jsonb_build_object('y',r.y,'x',r.x,'complete',coalesce(c.status='ready' and c.fetched_at>=now()-interval '30 days',false),'status',coalesce(c.status,'deferred'),'fetched_at',c.fetched_at,'elements',coalesce(c.elements,'[]'::jsonb))) into result
 from (select distinct y,x from jsonb_to_recordset(p_cells) as t(y integer,x integer)) r
 left join ficard_private.shared_cells c on c.y=r.y and c.x=r.x;
 return jsonb_build_object('cells',result,'queued_new',count_new,'queue',queue_note,'attribution','© OpenStreetMap contributors · ODbL');
end$$;

