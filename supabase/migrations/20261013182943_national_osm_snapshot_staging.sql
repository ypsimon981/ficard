create table ficard_private.national_snapshot_cells (
 source_sha256 text not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
 y integer not null check(y between 700 and 959),
 x integer not null check(x between 120 and 379),
 elements jsonb not null check(jsonb_typeof(elements)='array'),
 point_count integer generated always as (jsonb_array_length(elements)) stored,
 coverage_verified boolean not null default false,
 imported_at timestamptz not null default now(),
 primary key(source_sha256,y,x)
);
alter table ficard_private.national_snapshot_cells enable row level security;
revoke all on ficard_private.national_snapshot_cells from public,anon,authenticated;
comment on table ficard_private.national_snapshot_cells is 'Recovered national OSM snapshot staging. Not live cache, not independently verified complete. Do not mark live sectors ready from this table without validating extraction coverage.';
