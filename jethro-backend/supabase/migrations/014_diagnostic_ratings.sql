create table if not exists diagnostic_ratings (
  id           text primary key,
  submission_id text not null,
  email        text not null,
  stars        smallint not null check (stars between 1 and 5),
  created_at   timestamptz not null default now()
);

create index if not exists diagnostic_ratings_email_idx on diagnostic_ratings (lower(email));
create index if not exists diagnostic_ratings_submission_idx on diagnostic_ratings (submission_id);
