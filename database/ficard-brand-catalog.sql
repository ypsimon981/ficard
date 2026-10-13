-- Fi-Card remote brand catalog.
-- Live project provisioned 2026-10-13. The private catalog admin token is intentionally NOT stored in git.

create table if not exists public.ficard_brand_catalog (
  brand_key text primary key,
  name text not null,
  category text not null default 'altro',
  color text,
  mark text,
  logo_url text,
  logo_bg text default 'transparent',
  logo_scale smallint,
  domain text,
  international boolean not null default true,
  markets text[] not null default '{}',
  status text not null default 'draft',
  is_complete boolean not null default false,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint ficard_brand_key_format check (char_length(brand_key) between 1 and 80 and brand_key !~ '[[:space:][:cntrl:]/\\]'),
  constraint ficard_brand_category check (category in ('supermercati','abbigliamento','sport','elettronica','casa','casalinghi','petstore','farmacia','beauty','ristorazione','carburanti','altro')),
  constraint ficard_brand_status check (status in ('draft','published','disabled')),
  constraint ficard_brand_color check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint ficard_brand_scale check (logo_scale is null or logo_scale between 10 and 100),
  constraint ficard_brand_markets check (international or cardinality(markets)>0)
);

alter table public.ficard_brand_catalog enable row level security;
revoke all on table public.ficard_brand_catalog from anon, authenticated;
grant select on table public.ficard_brand_catalog to anon, authenticated;
grant all on table public.ficard_brand_catalog to service_role;

drop policy if exists "public catalog rows are readable" on public.ficard_brand_catalog;
create policy "public catalog rows are readable" on public.ficard_brand_catalog
for select to anon, authenticated using(status in ('published','disabled'));

create table if not exists public.ficard_catalog_state (
  singleton boolean primary key default true check(singleton),
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);
insert into public.ficard_catalog_state(singleton,version) values(true,1) on conflict(singleton) do nothing;
alter table public.ficard_catalog_state enable row level security;
revoke all on table public.ficard_catalog_state from anon, authenticated;
grant select on table public.ficard_catalog_state to anon, authenticated;
grant all on table public.ficard_catalog_state to service_role;
drop policy if exists "catalog state is public" on public.ficard_catalog_state;
create policy "catalog state is public" on public.ficard_catalog_state for select to anon, authenticated using(true);

create or replace function public.ficard_touch_catalog_version() returns trigger
language plpgsql security definer set search_path=''
as $$begin update public.ficard_catalog_state set version=version+1,updated_at=now() where singleton=true; if tg_op='DELETE' then return old; else return new; end if; end$$;
revoke all on function public.ficard_touch_catalog_version() from public,anon,authenticated;
grant execute on function public.ficard_touch_catalog_version() to service_role;
drop trigger if exists ficard_brand_catalog_version on public.ficard_brand_catalog;
create trigger ficard_brand_catalog_version after insert or update or delete on public.ficard_brand_catalog
for each statement execute function public.ficard_touch_catalog_version();

-- Admin RPCs are provisioned on the live project with a random 256-bit catalog-only token.
-- Store only SHA-256(token) in ficard_private.catalog_admin_secret and keep the plaintext token only on the protected OVH developer host.
-- Never commit catalog-config.php or the plaintext token.
