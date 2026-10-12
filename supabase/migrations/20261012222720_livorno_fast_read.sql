create or replace function public.ficard_livorno_cache(p_slug text)
returns jsonb language sql security invoker set search_path='' as $$
 select jsonb_build_object(
 'state',(select jsonb_build_object('status',c.status,'fetched_at',c.fetched_at,'retry_after',c.retry_after,'last_error',c.last_error,'attempts',c.attempts,'duration_ms',c.duration_ms) from public.ficard_store_cells c where c.brand_id=b.id and c.cell_key='livorno-pilot-v1'),
 'stores',coalesce((select jsonb_agg(to_jsonb(r)) from (select osm_type,osm_id,name,lat,lon from public.ficard_store_locations l where l.brand_id=b.id and lat between 43.45 and 43.65 and lon between 10.22 and 10.43 order by osm_type,osm_id limit 1000) r),'[]'::jsonb))
 from public.ficard_store_brands b where slug=p_slug and slug in ('ip','conad','lidl','decathlon');
$$;
revoke all on function public.ficard_livorno_cache(text) from public,anon,authenticated;
grant execute on function public.ficard_livorno_cache(text) to service_role;
