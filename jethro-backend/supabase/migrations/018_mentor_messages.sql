-- Mensagens do chat com o Mentor IA (Tab Mentor / pós-paywall)
create table if not exists mentor_messages (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references users(id) on delete cascade,
  session_id  text        not null,
  role        text        not null check (role in ('user', 'assistant')),
  content     text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists mentor_messages_user_session_idx
  on mentor_messages (user_id, session_id, created_at asc);
