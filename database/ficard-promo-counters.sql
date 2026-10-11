CREATE OR REPLACE FUNCTION ficard_stats.increment_usage(p_event text, p_page text, p_brand text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if p_event is null or p_event not in ('app_open','page_view','card_added','promo_impression','promo_click','share_started','share_completed','backup_merged')
 or p_page is null or p_page not in ('home','map','scandixit','profile')
 or (p_event not in ('card_added','promo_impression','promo_click') and p_brand is not null)
 or (p_event='card_added' and p_brand is not null and not(p_brand=any(ARRAY['esselunga','conad','coop','carrefour','lidl','eurospin','md','pam','despar','todis','idromarket','decathlon','cisalfa','intersport','jdsports','footlocker','bata','deichmann','pittarosso','ovs','hm','zara','calzedonia','intimissimi','ikea','leroymerlin','obi','bricocenter','tigota','acquaesapone','sephora','douglas','unieuro','mediaworld','euronics','eni','q8','ip','altri','aldi','dipiù','ins','bennet','iperal','iper','demos','pewex','elite','naturasì','simply','famila','a&o','mercato','tesco','auchan','nike','adidas','puma','salmoiraghi','grandvision','primark','mango','benetton','tezenis','kiabi','terranova','piazzaitalia','upim','motivi','kiko','yvesrocher','dm','bottegaverde','lillapois','benu','lloyds','farmacia','drmax','starbucks','mcdonalds','burgerking','kfc','oldwildwest','roadhouse','feltrinelli','mondadori','arcaplanet','maxizoo','shell','tamoil','total','penny','sigma','crai','deco','sole365','risparmiocasa','maurys','action','pepco','tecnomat','jysk','stradivarius','bershka','pullandbear','coin','awlab','geox','skechers','pinalli','notino','trony','expert','comet','gamestop','isoladeitesori','zooplus','libraccio','autogrill','lapiadineria','rossopomodoro','venchi','flyingtiger','petmark','italpet','robinsonpetshop','zooservice','majesticpets','elitepet','petsupermarket','globalpet','emark','scarpescarpe','norauto','bricoio','pim'])))
 or (p_event in ('promo_impression','promo_click') and (p_brand is null or p_brand !~ '^(banner|fourth|last|scandixit):tip[0-5]$')) then
  raise exception using errcode='22023',message='Invalid aggregate category';
 end if;
 insert into ficard_stats.daily_usage(day,event,page,brand,total)
 values ((now() at time zone 'Europe/Rome')::date,p_event,p_page,coalesce(p_brand,''),1)
 on conflict(day,event,page,brand) do update set total=least(ficard_stats.daily_usage.total+1,1000000);
end;$function$

alter table ficard_stats.daily_usage drop constraint daily_usage_event_check;
alter table ficard_stats.daily_usage add constraint daily_usage_event_check check(event in ('app_open','page_view','card_added','promo_impression','promo_click','share_started','share_completed','backup_merged'));
