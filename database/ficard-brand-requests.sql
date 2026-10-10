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
