create table public.ficard_usage_events (
 event_id uuid primary key,
 installation_id uuid not null,
 event text not null check (event in ('app_open','page_view','card_added')),
 page text not null check (page in ('home','map','scandixit','profile')),
 brand text check (brand is null or brand in ('esselunga','conad','coop','carrefour','lidl','eurospin','md','pam','despar','todis','idromarket','decathlon','cisalfa','intersport','jdsports','footlocker','bata','deichmann','pittarosso','ovs','hm','zara','calzedonia','intimissimi','ikea','leroymerlin','obi','bricocenter','tigota','acquaesapone','sephora','douglas','unieuro','mediaworld','euronics','eni','q8','ip','altri','aldi','dipiù','ins','bennet','iperal','iper','demos','pewex','elite','naturasì','simply','famila','a&o','mercato','tesco','auchan','nike','adidas','puma','salmoiraghi','grandvision','primark','mango','benetton','tezenis','kiabi','terranova','piazzaitalia','upim','motivi','kiko','yvesrocher','dm','bottegaverde','lillapois','benu','lloyds','farmacia','drmax','starbucks','mcdonalds','burgerking','kfc','oldwildwest','roadhouse','feltrinelli','mondadori','arcaplanet','maxizoo','shell','tamoil','total','penny','sigma','crai','deco','sole365','risparmiocasa','maurys','action','pepco','tecnomat','jysk','stradivarius','bershka','pullandbear','coin','awlab','geox','skechers','pinalli','notino','trony','expert','comet','gamestop','isoladeitesori','zooplus','libraccio','autogrill','lapiadineria','rossopomodoro','venchi','flyingtiger','petmark','italpet','robinsonpetshop','zooservice','majesticpets','elitepet','petsupermarket','globalpet','emark','scarpescarpe')),
 app_version text not null check (app_version ~ '^0[.]9[.][0-9]{1,4}$'),
 received_at timestamptz not null default now(),
 check (event='card_added' or brand is null)
);
create index ficard_usage_received_idx on public.ficard_usage_events (received_at);
create index ficard_usage_install_idx on public.ficard_usage_events (installation_id,received_at);
alter table public.ficard_usage_events enable row level security;
revoke all on public.ficard_usage_events from public,anon,authenticated;
grant insert (event_id,installation_id,event,page,brand,app_version) on public.ficard_usage_events to anon;
grant all on public.ficard_usage_events to service_role;
create policy ficard_usage_insert on public.ficard_usage_events for insert to anon with check (received_at=now());
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('ficard-usage-retention','17 3 * * *',$job$delete from public.ficard_usage_events where received_at < now()-interval '90 days';$job$);

