begin;
do $$
declare a jsonb;b jsonb;v_lease uuid:=gen_random_uuid();marker jsonb:='[{"type":"node","id":999999999,"lat":43.56,"lon":10.32,"tags":{"name":"TEST"}}]';
begin
 perform pg_advisory_xact_lock(1938437028);
 update ficard_private.shared_config set enabled=false;
 if public.ficard_shared_read('[{"y":871,"x":206}]')->>'disabled'<>'true' then raise exception 'Remote switch failed'; end if;
 if public.ficard_shared_tick()->>'status'<>'disabled' then raise exception 'Worker switch failed'; end if;
 update ficard_private.shared_config set enabled=true;
 a:=public.ficard_shared_read('[{"y":871,"x":206}]');b:=public.ficard_shared_read('[{"y":871,"x":206}]');
 if (select count(*) from ficard_private.shared_cells where y=871 and x=206)<>1 or (b->>'queued_new')::integer<>0 then raise exception 'Duplicate admission'; end if;
 if has_function_privilege('anon','public.ficard_shared_read(jsonb)','execute') or has_function_privilege('anon','public.ficard_shared_tick()','execute') then raise exception 'Public worker RPC'; end if;
 if exists(select 1 from ficard_private.shared_requests) then raise exception 'Wait until the worker is idle before verification'; end if;
 update ficard_private.shared_cells set status='loading',elements=marker,lease=v_lease where y=871 and x=206;
 insert into ficard_private.shared_requests(request_id,y,x,lease,endpoint_attempt) values(-991,871,206,v_lease,1);
 insert into net._http_response(id,status_code,content) values(-991,200,'{"remark":"runtime timeout","elements":[]}');
 perform public.ficard_shared_tick();
 if (select elements from ficard_private.shared_cells where y=871 and x=206)<>marker or (select status from ficard_private.shared_cells where y=871 and x=206)<>'error' then raise exception 'Partial response damaged cache'; end if;
 update ficard_private.shared_cells set status='loading',lease=v_lease,retry_after=now()+interval '3 minutes' where y=871 and x=206;
 insert into ficard_private.shared_requests(request_id,y,x,lease,endpoint_attempt) values(-992,871,206,v_lease,1);
 insert into net._http_response(id,status_code,content) values(-992,200,'{"elements":[]}');
 perform public.ficard_shared_tick();
 if (select elements from ficard_private.shared_cells where y=871 and x=206)<>'[]'::jsonb or (select status from ficard_private.shared_cells where y=871 and x=206)<>'ready' then raise exception 'Empty complete response failed'; end if;
end$$;
select 'passed: remote switch, worker switch, duplicate admission, RPC permissions, partial/outage retention, empty completed archive' as result;
rollback;
