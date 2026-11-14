do $code_stats$
declare
 definition text;
 original_check text;
 extra_events constant text := '''onboarding_started'',''onboarding_completed'',''first_card_added'',''first_cards_imported'',''gps_permission_denied'',''gps_permission_granted'',''gps_permission_granted_later'',''gps_preference_disabled'',''gps_position_unavailable'',''gps_position_timeout'',''gps_position_acquired'',''scan_success'',''scan_cancelled'',''scan_camera_error'',''card_open_suggested'',''health_code_shown'',''gps_disabled'',''scan_failed'',''scan_image_success'',''scan_image_failed'',''lottery_code_shown'',''lottery_suggestion_open'',''custom_logo_added'',''custom_logo_replaced'',''custom_logo_removed''';
begin
 select pg_get_functiondef('ficard_stats.increment_usage(text,text,text)'::regprocedure) into definition;
 if position('''onboarding_started''' in definition)=0 then
  if position('''arrival_time_over5'')' in definition)=0 then
   raise exception 'Aggregate validator changed: review before updating';
  end if;
  definition:=replace(definition,'''arrival_time_over5'')','''arrival_time_over5'','||extra_events||')');
  execute definition;
 end if;
 select pg_get_expr(conbin,conrelid) into original_check
 from pg_constraint where conrelid='ficard_stats.daily_usage'::regclass and conname='daily_usage_event_check';
 if original_check is null then raise exception 'Missing daily usage event constraint'; end if;
 if position('onboarding_started' in original_check)=0 then
  alter table ficard_stats.daily_usage drop constraint daily_usage_event_check;
  execute 'alter table ficard_stats.daily_usage add constraint daily_usage_event_check check (('||original_check||') or event in ('||extra_events||'))';
 end if;
end;
$code_stats$;

