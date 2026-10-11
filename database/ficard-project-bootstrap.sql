create schema ficard_stats;
revoke all on schema ficard_stats from public;
grant usage on schema ficard_stats to anon, authenticated;
create table ficard_stats.daily_usage(
day date not null,event text not null check(event in ('app_open','page_view','card_added','promo_impression','promo_click','share_started','share_completed','backup_merged')),
page text not null check(page in ('home','map','scandixit','profile')),
brand text not null default '',total bigint not null default 1 check(total between 1 and 1000000),
primary key(day,event,page,brand));
alter table ficard_stats.daily_usage enable row level security;
revoke all on ficard_stats.daily_usage from public, anon, authenticated;
create policy ficard_no_client_access on ficard_stats.daily_usage as restrictive for all to anon,authenticated using(false) with check(false);
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
end;$function$;

revoke all on function ficard_stats.increment_usage(text,text,text) from public;
grant execute on function ficard_stats.increment_usage(text,text,text) to anon,authenticated;
create function public.ficard_count_usage(p_event text,p_page text,p_brand text default null) returns void language sql security invoker set search_path='' as $$select ficard_stats.increment_usage(p_event,p_page,p_brand);$$;
revoke all on function public.ficard_count_usage(text,text,text) from public;
grant execute on function public.ficard_count_usage(text,text,text) to anon,authenticated,service_role;
create table public.ficard_brand_requests (
 id uuid primary key,
 brand_name text not null check (char_length(brand_name) between 2 and 100 and brand_name !~ '[[:cntrl:]@<>]' and brand_name !~ '[0-9]{6}'),
 category text not null check (category in ('supermercati','abbigliamento','sport','elettronica','casa','casalinghi','petstore','farmacia','beauty','ristorazione','carburanti','altro')),
 created_at timestamptz not null default now()
);
alter table public.ficard_brand_requests enable row level security;
revoke all on public.ficard_brand_requests from public, anon, authenticated;
grant insert (id,brand_name,category) on public.ficard_brand_requests to anon, authenticated;
create policy ficard_brand_request_insert on public.ficard_brand_requests for insert to anon, authenticated with check (true);
create index ficard_brand_requests_name on public.ficard_brand_requests (lower(btrim(brand_name)), category);
-- The dashboard owner can group requests. No SELECT policy or public view is exposed.
-- select lower(btrim(brand_name)) as marchio, category, count(*) as richieste
-- from public.ficard_brand_requests group by 1,2 order by richieste desc;

