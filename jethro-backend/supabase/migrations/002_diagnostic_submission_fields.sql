alter table form_submissions
  add column if not exists answers_by_slug jsonb not null default '{}'::jsonb,
  add column if not exists respondent jsonb not null default '{}'::jsonb,
  add column if not exists derived jsonb not null default '{}'::jsonb,
  add column if not exists respondent_name text null,
  add column if not exists respondent_email text null,
  add column if not exists whatsapp_number text null,
  add column if not exists whatsapp_country_iso text null,
  add column if not exists score numeric(6,2) null;

create index if not exists form_submissions_score_idx on form_submissions (score desc);
create index if not exists form_submissions_country_idx on form_submissions (whatsapp_country_iso);
create index if not exists form_submissions_email_idx on form_submissions (respondent_email);
