-- Official identifiers use a separate namespace, never synthetic OSM identifiers.
create or replace function public.ficard_national_pharmacies_read(p_cells jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if jsonb_typeof(p_cells) is distinct from 'array' then raise exception 'Invalid sectors'; end if;
 if jsonb_array_length(p_cells) not between 1 and 16 then raise exception 'Invalid sectors'; end if;
 if exists(select 1 from jsonb_to_recordset(p_cells) as c(y integer,x integer) where y is null or x is null or y<700 or y>=960 or x<120 or x>=380) then raise exception 'Invalid sectors'; end if;
 select jsonb_agg(jsonb_build_object('y',c.y,'x',c.x,'elements',coalesce(p.elements,'[]'::jsonb))) into result
 from (select distinct y,x from jsonb_to_recordset(p_cells) as t(y integer,x integer)) c
 cross join lateral (
  select jsonb_agg(jsonb_build_object('type','pharmacy-it','id',code::bigint,'lat',lat,'lon',lon,'tags',jsonb_build_object('amenity','pharmacy','name',name,'addr:street',address,'addr:city',city,'addr:postcode',postcode,'source','Ministero della Salute','ref:msal',code)) order by code) elements
  from ficard_private.national_pharmacies
  where lat is not null and lon is not null and floor(lat*20)::integer=c.y and floor(lon*20)::integer=c.x and (valid_from is null or valid_from<=current_date)
 ) p;
 return result;
end $$;
revoke all on function public.ficard_national_pharmacies_read(jsonb) from public,anon,authenticated;
grant execute on function public.ficard_national_pharmacies_read(jsonb) to service_role;
grant usage on schema ficard_private to service_role;
grant select on ficard_private.national_pharmacies to service_role;
