-- Fi-Card aggregate analytics v2
-- Statistical counters only: no user ID, installation ID, card code or precise location.

alter table ficard_stats.daily_usage drop constraint if exists daily_usage_event_check;
alter table ficard_stats.daily_usage add constraint daily_usage_event_check check(event in (
 'install_observed','analytics_disabled','analytics_enabled','app_open','page_view','card_added','card_open',
 'favorite_toggled','fullscreen_open','scan_started','navigation_started','location_association_started',
 'backup_created','card_share_started','promo_impression','promo_click','share_started','share_completed','backup_merged'
));

create table if not exists ficard_stats.install_coverage(
 singleton boolean primary key default true check(singleton),
 installs bigint not null default 0 check(installs>=0),
 enabled_estimate bigint not null default 0 check(enabled_estimate>=0 and enabled_estimate<=installs),
 disabled_actions bigint not null default 0 check(disabled_actions>=0),
 enabled_actions bigint not null default 0 check(enabled_actions>=0),
 updated_at timestamptz not null default now()
);
alter table ficard_stats.install_coverage enable row level security;
revoke all on ficard_stats.install_coverage from public,anon,authenticated;
insert into ficard_stats.install_coverage(singleton) values(true) on conflict(singleton) do nothing;

create or replace function ficard_stats.increment_usage(p_event text,p_page text,p_brand text default null)
returns void language plpgsql security definer set search_path='' as $function$
begin
 if p_event is null or p_event not in ('install_observed','analytics_disabled','analytics_enabled','app_open','page_view','card_added','card_open','favorite_toggled','fullscreen_open','scan_started','navigation_started','location_association_started','backup_created','card_share_started','promo_impression','promo_click','share_started','share_completed','backup_merged')
 or p_page is null or p_page not in ('home','map','scandixit','profile')
 or (p_event not in ('card_added','card_open','promo_impression','promo_click') and p_brand is not null)
 or (p_event in ('card_added','card_open') and p_brand is not null and not(p_brand=any(ARRAY['esselunga','conad','coop','carrefour','lidl','eurospin','md','pam','despar','todis','idromarket','decathlon','cisalfa','intersport','jdsports','footlocker','bata','deichmann','pittarosso','ovs','hm','zara','calzedonia','intimissimi','ikea','leroymerlin','obi','bricocenter','tigota','acquaesapone','sephora','douglas','unieuro','mediaworld','euronics','eni','q8','ip','altri','aldi','dipiù','ins','bennet','iperal','iper','demos','pewex','elite','naturasì','simply','famila','a&o','mercato','tesco','auchan','nike','adidas','puma','salmoiraghi','grandvision','primark','mango','benetton','tezenis','kiabi','terranova','piazzaitalia','upim','motivi','kiko','yvesrocher','dm','bottegaverde','lillapois','benu','lloyds','farmacia','drmax','starbucks','mcdonalds','burgerking','kfc','oldwildwest','roadhouse','feltrinelli','mondadori','arcaplanet','maxizoo','shell','tamoil','total','penny','sigma','crai','deco','sole365','risparmiocasa','maurys','action','pepco','tecnomat','jysk','stradivarius','bershka','pullandbear','coin','awlab','geox','skechers','pinalli','notino','trony','expert','comet','gamestop','isoladeitesori','zooplus','libraccio','autogrill','lapiadineria','rossopomodoro','venchi','flyingtiger','petmark','italpet','robinsonpetshop','zooservice','majesticpets','elitepet','petsupermarket','globalpet','emark','scarpescarpe','norauto','bricoio','pim'])))
 or (p_event in ('promo_impression','promo_click') and (p_brand is null or p_brand !~ '^(banner|fourth|last|scandixit):tip[0-5]$')) then
  raise exception using errcode='22023',message='Invalid aggregate category';
 end if;

 insert into ficard_stats.daily_usage(day,event,page,brand,total)
 values ((now() at time zone 'Europe/Rome')::date,p_event,p_page,coalesce(p_brand,''),1)
 on conflict(day,event,page,brand) do update set total=least(ficard_stats.daily_usage.total+1,1000000);

 if p_event='install_observed' then
  update ficard_stats.install_coverage
   set installs=installs+1,enabled_estimate=enabled_estimate+1,updated_at=now()
   where singleton=true;
 elsif p_event='analytics_disabled' then
  update ficard_stats.install_coverage
   set disabled_actions=disabled_actions+1,enabled_estimate=greatest(enabled_estimate-1,0),updated_at=now()
   where singleton=true;
 elsif p_event='analytics_enabled' then
  update ficard_stats.install_coverage
   set enabled_actions=enabled_actions+1,enabled_estimate=least(enabled_estimate+1,installs),updated_at=now()
   where singleton=true;
 end if;
end;$function$;

revoke all on function ficard_stats.increment_usage(text,text,text) from public;
grant execute on function ficard_stats.increment_usage(text,text,text) to anon,authenticated;

create or replace view ficard_stats.coverage_summary with (security_invoker=true) as
select installs,
       enabled_estimate,
       installs-enabled_estimate as disabled_estimate,
       disabled_actions,
       enabled_actions,
       case when installs=0 then null else round(enabled_estimate*100.0/installs,2) end as coverage_pct,
       updated_at
from ficard_stats.install_coverage
where singleton=true;
revoke all on ficard_stats.coverage_summary from public,anon,authenticated;

notify pgrst,'reload schema';
