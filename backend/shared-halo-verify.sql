-- Isolate model checks inside a transaction; all live data is restored.
begin;
select pg_advisory_xact_lock(1938437028);
select pg_advisory_xact_lock(1938437027);
delete from ficard_private.shared_requests;
delete from ficard_private.shared_cells;
delete from ficard_private.shared_halo_targets;
update ficard_private.shared_config set enabled=true,warmup_until=now()+interval '1 day';
insert into ficard_private.shared_budget(day,calls) values(current_date,0) on conflict(day) do update set calls=0;
do $$
declare n integer;
begin
 perform public.ficard_shared_read('[{"y":800,"x":200}]');
 if (select count(*) from ficard_private.shared_halo_targets)<>9 then raise exception 'Single sector must produce 3x3';end if;
 perform public.ficard_shared_read('[{"y":800,"x":200}]');
 if (select count(*) from ficard_private.shared_halo_targets)<>9 then raise exception 'Repeated search duplicates halo';end if;
 n:=ficard_private.shared_admit_halo();
 if n<>8 or (select count(*) from ficard_private.shared_cells)<>9 then raise exception 'Eight neighbours not admitted';end if;
 if (select count(*) from ficard_private.shared_halo_targets)<>0 then raise exception 'Prefetch recursively expanded';end if;
 if (select count(*) from ficard_private.shared_cells where origin='user')<>1 then raise exception 'User priority changed';end if;
 delete from ficard_private.shared_cells;
 perform public.ficard_shared_read('[{"y":800,"x":200},{"y":800,"x":201},{"y":801,"x":200},{"y":801,"x":201}]');
 if (select count(*) from ficard_private.shared_halo_targets)<>16 then raise exception '2x2 must produce 4x4';end if;
 perform ficard_private.shared_admit_halo();perform ficard_private.shared_admit_halo();
 if (select count(*) from ficard_private.shared_cells)<>16 then raise exception 'Union did not deduplicate';end if;
 delete from ficard_private.shared_cells;delete from ficard_private.shared_halo_targets;
 perform public.ficard_shared_read('[{"y":700,"x":120}]');
 if (select count(*) from ficard_private.shared_halo_targets)<>4 then raise exception 'Grid boundary clipping failed';end if;
 update ficard_private.shared_budget set calls=500 where day=current_date;
 n:=ficard_private.shared_admit_halo();
 if n<>0 or (select count(*) from ficard_private.shared_halo_targets)<>3 then raise exception 'Budget must defer, preserve targets';end if;
 update ficard_private.shared_budget set calls=0 where day=current_date;
 update ficard_private.shared_config set enabled=false;
 if ficard_private.shared_admit_halo()<>0 then raise exception 'Off switch ignored';end if;
 if has_function_privilege('anon','ficard_private.shared_admit_halo()','EXECUTE') or has_table_privilege('anon','ficard_private.shared_halo_targets','SELECT') then raise exception 'Anonymous access';end if;
end$$;
rollback;
