-- pg_net is not relocatable. Reinstall its transient networking tables only
-- after the pilot is idle; the store archive is unaffected.
do $$begin
 if not pg_try_advisory_xact_lock(1938437026) then raise exception 'Pilot busy'; end if;
 if exists(select 1 from ficard_private.livorno_requests) or exists(select 1 from net.http_request_queue) then raise exception 'Networking queue is not empty'; end if;
end$$;
drop extension pg_net;
create extension pg_net with schema extensions;
revoke all on schema net from public,anon,authenticated;
grant usage on schema net to service_role;
