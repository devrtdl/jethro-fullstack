-- Liga o utilizador da app ao utilizador do Supabase Auth
alter table users add column if not exists auth_id text unique;

create index if not exists users_auth_id_idx on users (auth_id);
