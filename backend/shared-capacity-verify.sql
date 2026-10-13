begin;
select pg_advisory_xact_lock(1938437028);
select pg_advisory_xact_lock(1938437027);
do $$
declare v uuid:=gen_random_uuid();r bigint;
begin
 insert into ficard_private.shared_cells(y,x,origin,lease,status) values(710,125,'prefetch',v,'loading') on conflict(y,x) do update set lease=v,status='loading',origin='prefetch';
 insert into ficard_private.shared_budget(day,calls,downloaded_bytes) values(current_date,500,0) on conflict(day) do update set calls=500,downloaded_bytes=0;
 update ficard_private.shared_config set enabled=true,warmup_until=now()+interval '1 day';
 r:=ficard_private.shared_request(710,125,v,0);
 if r is not null then raise exception '500-call limit bypassed';end if;
 update ficard_private.shared_budget set calls=499,downloaded_bytes=50000000 where day=current_date;
 r:=ficard_private.shared_request(710,125,v,0);
 if r is not null or (select calls from ficard_private.shared_budget where day=current_date)<>499 then raise exception 'Download threshold bypassed';end if;
 update ficard_private.shared_config set warmup_until=now()-interval '1 minute';
 update ficard_private.shared_cells set origin='user' where y=710 and x=125;
 update ficard_private.shared_budget set calls=120,downloaded_bytes=0 where day=current_date;
 r:=ficard_private.shared_request(710,125,v,0);
 if r is not null then raise exception 'Normal quota not restored after expiry';end if;
end$$;
select 'capacity checks passed; transaction rolled back' as verification;
rollback;
