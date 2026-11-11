-- Apply after ficard-startup-statistics.sql. Queued offline events use the receipt day.
-- Add anonymous code-display and GPS suggestion categories to the existing daily counters.
-- No new identifiers, raw durations, coordinates or card fields are accepted.
do $code_stats$
declare
 definition text;
 original_check text;
 extra_events constant text := '''code_shown'',''gps_card_suggested'',''gps_code_shown''';
begin
 select pg_get_functiondef('ficard_stats.increment_usage(text,text,text)'::regprocedure) into definition;
 if position('''code_shown''' in definition)=0 then
  if position('''backup_merged''' in definition)=0 or position('''card_open'',''promo_impression''' in definition)=0 or position('''card_added'',''card_open'')' in definition)=0 then
   raise exception 'Aggregate validator changed: review before updating';
  end if;
  definition:=replace(definition,'''backup_merged''','''backup_merged'','||extra_events);
  definition:=replace(definition,'''card_open'',''promo_impression''','''card_open'',''code_shown'',''promo_impression''');
  definition:=replace(definition,'''card_added'',''card_open'')','''card_added'',''card_open'',''code_shown'')');
  execute definition;
 end if;
 select pg_get_expr(conbin,conrelid) into original_check
 from pg_constraint where conrelid='ficard_stats.daily_usage'::regclass and conname='daily_usage_event_check';
 if original_check is null then raise exception 'Missing daily usage event constraint'; end if;
 if position('code_shown' in original_check)=0 then
  alter table ficard_stats.daily_usage drop constraint daily_usage_event_check;
  execute 'alter table ficard_stats.daily_usage add constraint daily_usage_event_check check (('||original_check||') or event in ('||extra_events||'))';
 end if;
end;
$code_stats$;

