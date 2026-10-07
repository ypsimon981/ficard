create schema if not exists ficard_stats;
revoke all on schema ficard_stats from public;
grant usage on schema ficard_stats to anon,authenticated;
create table if not exists ficard_stats.daily_usage (
 day date not null,
 event text not null check(event in ('app_open','page_view','card_added')),
 page text not null check(page in ('home','map','scandixit','profile')),
 brand text not null default '',
 total bigint not null default 1 check(total between 1 and 1000000),
 primary key(day,event,page,brand)
);
alter table ficard_stats.daily_usage enable row level security;
create policy ficard_no_client_access on ficard_stats.daily_usage as restrictive for all to anon,authenticated using(false) with check(false);
revoke all on table ficard_stats.daily_usage from public,anon,authenticated;
create or replace function ficard_stats.increment_usage(p_event text,p_page text,p_brand text default null)
returns void language plpgsql security definer set search_path='' as $function$
begin
 if p_event is null or p_event not in ('app_open','page_view','card_added')
 or p_page is null or p_page not in ('home','map','scandixit','profile')
 or (p_event<>'card_added' and p_brand is not null)
 or (p_brand is not null and not(p_brand=any(ARRAY['esselunga','conad','coop','carrefour','lidl','eurospin','md','pam','despar','todis','idromarket','decathlon','cisalfa','intersport','jdsports','footlocker','bata','deichmann','pittarosso','ovs','hm','zara','calzedonia','intimissimi','ikea','leroymerlin','obi','bricocenter','tigota','acquaesapone','sephora','douglas','unieuro','mediaworld','euronics','eni','q8','ip','altri','aldi','dipiù','ins','bennet','iperal','iper','demos','pewex','elite','naturasì','simply','famila','a&o','mercato','tesco','auchan','nike','adidas','puma','salmoiraghi','grandvision','primark','mango','benetton','tezenis','kiabi','terranova','piazzaitalia','upim','motivi','kiko','yvesrocher','dm','bottegaverde','lillapois','benu','lloyds','farmacia','drmax','starbucks','mcdonalds','burgerking','kfc','oldwildwest','roadhouse','feltrinelli','mondadori','arcaplanet','maxizoo','shell','tamoil','total','penny','sigma','crai','deco','sole365','risparmiocasa','maurys','action','pepco','tecnomat','jysk','stradivarius','bershka','pullandbear','coin','awlab','geox','skechers','pinalli','notino','trony','expert','comet','gamestop','isoladeitesori','zooplus','libraccio','autogrill','lapiadineria','rossopomodoro','venchi','flyingtiger','petmark','italpet','robinsonpetshop','zooservice','majesticpets','elitepet','petsupermarket','globalpet','emark','scarpescarpe']))) then
  raise exception using errcode='22023',message='Invalid aggregate category';
 end if;
 insert into ficard_stats.daily_usage(day,event,page,brand,total)
 values ((now() at time zone 'Europe/Rome')::date,p_event,p_page,coalesce(p_brand,''),1)
 on conflict(day,event,page,brand) do update set total=least(ficard_stats.daily_usage.total+1,1000000);
end;$function$;
revoke all on function ficard_stats.increment_usage(text,text,text) from public;
grant execute on function ficard_stats.increment_usage(text,text,text) to anon,authenticated;
create or replace function public.ficard_count_usage(p_event text,p_page text,p_brand text default null)
returns void language sql security invoker set search_path='' as $function$
 select ficard_stats.increment_usage(p_event,p_page,p_brand);
$function$;
revoke all on function public.ficard_count_usage(text,text,text) from public;
grant execute on function public.ficard_count_usage(text,text,text) to anon,authenticated;
select cron.schedule('ficard-aggregate-retention','23 3 * * *',
 $cron$delete from ficard_stats.daily_usage where day < (now() at time zone 'Europe/Rome')::date-90;$cron$);
notify pgrst,'reload schema';

-- After the new client is deployed, stop the old identifier-bearing collector.
revoke insert on table public.ficard_usage_events from public,anon,authenticated;
