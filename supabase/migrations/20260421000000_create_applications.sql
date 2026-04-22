create table if not exists applications (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),

  -- job
  job_id      text not null,
  job_title   text not null,

  -- personal
  first_name  text not null,
  last_name   text not null,
  email       text not null,
  phone       text not null,

  -- professional
  linkedin    text,
  portfolio   text,
  resume_name text,
  resume_path text,
  why_proxii  text not null,
  cover_letter text,

  -- availability
  availability date not null,
  referral    text not null,

  -- proxii screening
  sv_character  text not null,
  iaf_rating    numeric(4,2) not null,
  nailgun       text not null
);

-- Notifications are handled via Supabase Dashboard → Database → Webhooks
