create table if not exists forms (
  id text primary key,
  slug text not null unique,
  title text not null,
  description text null,
  status text not null check (status in ('draft', 'published', 'archived')),
  steps jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forms_slug_idx on forms (slug);
create index if not exists forms_status_idx on forms (status);

create table if not exists form_submissions (
  id text primary key,
  form_id text not null references forms(id) on delete cascade,
  form_slug text not null,
  created_at timestamptz not null default now(),
  answers jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  status text not null check (status in ('accepted', 'delivery_failed')),
  delivery jsonb null
);

create index if not exists form_submissions_form_id_idx on form_submissions (form_id);
create index if not exists form_submissions_created_at_idx on form_submissions (created_at desc);

create table if not exists form_events (
  id text primary key,
  form_id text not null references forms(id) on delete cascade,
  form_slug text not null,
  type text not null check (type in ('form_started', 'step_viewed', 'form_abandoned')),
  session_id text not null,
  step_id text null,
  created_at timestamptz not null default now()
);

create index if not exists form_events_form_id_idx on form_events (form_id);
create index if not exists form_events_session_id_idx on form_events (session_id);
create index if not exists form_events_created_at_idx on form_events (created_at desc);
