-- Add fixed, anonymous startup categories to the existing daily counters.
-- No new identifiers, raw durations, coordinates or card fields are accepted.
do $startup_stats$
declare
 definition text;
 original_check text;
 extra_events constant text := '''startup_found'',''startup_no_card'',''startup_gps_denied'',''startup_gps_unavailable'',''startup_timeout'',''startup_empty'',''startup_error'',''arrival_time_lt1'',''arrival_time_1to2'',''arrival_time_2to3'',''arrival_time_3to5'',''arrival_time_over5''';
begin
 select pg_get_functiondef('ficard_stats.increment_usage(text,text,text)'::regprocedure) into definition;
 if position('''startup_found''' in definition)=0 then
  if position('''backup_merged'')' in definition)=0 then
   raise exception 'Aggregate validator changed: review before updating';
  end if;
  definition:=replace(definition,'''backup_merged'')','''backup_merged'','||extra_events||')');
  execute definition;
 end if;
 select pg_get_expr(conbin,conrelid) into original_check
 from pg_constraint where conrelid='ficard_stats.daily_usage'::regclass and conname='daily_usage_event_check';
 if original_check is null then raise exception 'Missing daily usage event constraint'; end if;
 if position('startup_found' in original_check)=0 then
  alter table ficard_stats.daily_usage drop constraint daily_usage_event_check;
  execute 'alter table ficard_stats.daily_usage add constraint daily_usage_event_check check (('||original_check||') or event in ('||extra_events||'))';
 end if;
end;
$startup_stats$;

-- Daily reporting (run as the owner, not exposed to the public app):
-- select day,event,sum(total) as total from ficard_stats.daily_usage
-- where event like 'startup\_%' escape '\' or event like 'arrival\_time\_%' escape '\'
-- group by day,event order by day desc,event;
-- startup_* is one first-display outcome per page load.
-- arrival_time_* is the first displayed hero within 30 seconds, including a
-- possible late result after the 5-second loading fallback. Do not add the two
-- families together as if they represented distinct app opens.
