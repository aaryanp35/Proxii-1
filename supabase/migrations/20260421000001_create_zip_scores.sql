-- Cached score per ZIP
create table if not exists zip_scores (
  id               uuid primary key default gen_random_uuid(),
  zipcode          text not null,
  area_name        text,
  center_lat       double precision not null,
  center_lng       double precision not null,
  score            integer not null,
  category         text not null,
  raw_score        numeric(10,2),
  growth_score     numeric(10,2),
  risk_score       numeric(10,2),
  business_density integer,
  median_income    integer,
  has_anchor       boolean,
  full_payload     jsonb not null,
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null
);
create unique index if not exists zip_scores_zipcode_idx on zip_scores (zipcode);
create index        if not exists zip_scores_lat_lng_idx on zip_scores (center_lat, center_lng);
create index        if not exists zip_scores_expires_idx on zip_scores (expires_at);

-- Static indicator definitions seeded from server.js weights
create table if not exists indicators (
  id        serial primary key,
  label     text not null unique,
  weight    numeric(5,2) not null,
  direction text not null
);
insert into indicators (label, weight, direction) values
  ('Specialty Coffee',            2.5,  'positive'),
  ('Whole Foods/Organic Grocers', 3.5,  'positive'),
  ('Pilates/Yoga',                1.8,  'positive'),
  ('Boutique Gyms',               1.5,  'positive'),
  ('Wine Bars',                   1.2,  'positive'),
  ('Payday Loans',               -5.0,  'negative'),
  ('Pawn Shops',                 -4.0,  'negative'),
  ('Fast Food Chains',           -1.5,  'negative'),
  ('Industrial Zones',           -2.5,  'negative')
on conflict (label) do nothing;

-- M2M junction: indicator hits per cached ZIP
create table if not exists zip_indicator_hits (
  id             uuid primary key default gen_random_uuid(),
  zip_score_id   uuid    not null references zip_scores(id) on delete cascade,
  indicator_id   integer not null references indicators(id),
  hit_count      integer not null default 0,
  hit_score      numeric(10,2),
  unique (zip_score_id, indicator_id)
);
create index if not exists zip_indicator_hits_zip_idx on zip_indicator_hits (zip_score_id);

-- Every score request logged with cache outcome
create table if not exists score_request_logs (
  id             uuid primary key default gen_random_uuid(),
  requested_zip  text not null,
  resolved_zip   text,
  cache_type     text not null,   -- 'exact' | 'proximity' | 'miss'
  distance_m     double precision,
  model_called   boolean not null default false,
  response_ms    integer,
  created_at     timestamptz not null default now()
);
create index if not exists score_request_logs_zip_idx  on score_request_logs (requested_zip);
create index if not exists score_request_logs_type_idx on score_request_logs (cache_type);
create index if not exists score_request_logs_time_idx on score_request_logs (created_at desc);
