-- Check-in semanal de sentimento (3 dimensões, escala 1–5).
-- Separado de check_ins (check-in diário de tarefas).
-- Idempotente: unique(user_id, semana_id) + upsert no backend.

create table if not exists check_ins_semanais (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references users(id)   on delete cascade,
  semana_id   uuid        not null references semanas(id) on delete cascade,
  confianca   smallint    not null check (confianca  between 1 and 5),
  clareza     smallint    not null check (clareza    between 1 and 5),
  progresso   smallint    not null check (progresso  between 1 and 5),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, semana_id)
);

create index if not exists check_ins_semanais_user_idx on check_ins_semanais (user_id);
