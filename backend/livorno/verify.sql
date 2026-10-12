-- Transactional checks; synthetic data and state are rolled back.
begin;
do $$
declare b bigint; lease_id uuid:=gen_random_uuid(); ok boolean; old_count bigint;
begin
 select id into b from public.ficard_store_brands where slug='decathlon';
 update public.ficard_store_cells set status='loading',lease=lease_id where brand_id=b and cell_key='livorno-pilot-v1';
 ok:=public.ficard_livorno_finish_job(b,lease_id,'[{"osm_type":"node","osm_id":999999999999,"name":"TEST","lat":43.55,"lon":10.32},{"osm_type":"node","osm_id":999999999999,"name":"TEST","lat":43.55,"lon":10.32}]',null,1,'test');
 if not ok or (select count(*) from public.ficard_store_locations where brand_id=b and osm_id=999999999999)<>1 then raise exception 'Duplicate/commit check failed'; end if;
 if not (public.ficard_livorno_cache('decathlon')->'state'->>'status'='ready') then raise exception 'Ready state missing'; end if;
 if public.ficard_livorno_finish_job(b,lease_id,'[]',null,1,'test') then raise exception 'Stale lease accepted'; end if;
 lease_id:=gen_random_uuid();
 update public.ficard_store_cells set status='loading',lease=lease_id where brand_id=b and cell_key='livorno-pilot-v1';
 select count(*) into old_count from public.ficard_store_locations where brand_id=b;
 begin
  perform public.ficard_livorno_finish_job(b,lease_id,'[{"osm_type":"node","osm_id":1,"lat":41,"lon":12}]',null,1,'test');
  raise exception 'Out of area accepted';
 exception when others then
  if sqlerrm<>'Invalid Livorno rows' then raise; end if;
 end;
 if (select count(*) from public.ficard_store_locations where brand_id=b)<>old_count then raise exception 'Invalid import damaged old cache'; end if;
 perform public.ficard_livorno_finish_job(b,lease_id,'[]','test outage',1,'test');
 if (select count(*) from public.ficard_store_locations where brand_id=b)<>old_count then raise exception 'Outage damaged old cache'; end if;
 lease_id:=gen_random_uuid();
 update public.ficard_store_cells set status='loading',lease=lease_id where brand_id=b and cell_key='livorno-pilot-v1';
 perform public.ficard_livorno_finish_job(b,lease_id,'[]',null,1,'test');
 if public.ficard_livorno_cache('decathlon')->'stores'<>'[]'::jsonb then raise exception 'Empty success retained removed stores'; end if;
 if has_function_privilege('anon','public.ficard_livorno_tick()','execute') or has_function_privilege('anon','public.ficard_livorno_authorize_worker(text)','execute') then raise exception 'Worker RPC public'; end if;
end$$;
select 'passed: atomic replacement, duplicates, stale lease, invalid area, outage retention, empty success, RPC permissions' as verification;
rollback;
