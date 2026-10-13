begin;
do $$
declare at_night timestamptz;at_noon timestamptz;a jsonb;b jsonb;n integer;previous_prefetch integer;
begin
 update ficard_private.shared_config set warmup_until=null where id;
 at_night:=((now() at time zone 'Europe/Rome')::date+2+time '02:00') at time zone 'Europe/Rome';
 at_noon:=((now() at time zone 'Europe/Rome')::date+2+time '12:00') at time zone 'Europe/Rome';
 a:=public.ficard_shared_night_scan(at_noon);
 if a->>'status'<>'not_night' then raise exception 'Daytime guard failed';end if;
 select count(*) into previous_prefetch from ficard_private.shared_cells where origin='prefetch';
 a:=public.ficard_shared_night_scan(at_night);
 if a->>'status'<>'prepared' or (a->>'queued')::integer>20 then raise exception 'Night allowance failed';end if;
 b:=public.ficard_shared_night_scan(at_night);
 if b->>'status'<>'already_prepared' then raise exception 'Idempotence failed';end if;
 if (a->>'queued')::integer>0 then
  perform public.ficard_shared_read((select jsonb_build_array(jsonb_build_object('y',y,'x',x)) from ficard_private.shared_cells where origin='prefetch' limit 1));
  select count(*) into n from ficard_private.shared_cells where origin='prefetch';
  if n<>(previous_prefetch+(a->>'queued')::integer-1) then raise exception 'User promotion failed';end if;
 end if;
 if has_function_privilege('anon','public.ficard_shared_night_scan(timestamptz)','EXECUTE') then raise exception 'Public scan RPC';end if;
end$$;
select 'passed: day guard, night limit, idempotence, user promotion, permissions' as verification;
rollback;
