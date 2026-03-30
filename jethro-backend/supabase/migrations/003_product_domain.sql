create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nome text null,
  whatsapp text null,
  auth_provider text not null default 'email'
    check (auth_provider in ('email', 'google', 'apple')),
  plano_assinatura text null
    check (plano_assinatura in ('light', 'pro', 'legacy')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'inactive', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_status_idx on users (status);

create table if not exists diagnostic_questions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  order_index integer not null unique,
  label text not null,
  helper_text text null,
  question_type text not null
    check (question_type in ('text', 'textarea', 'email', 'phone', 'single_select', 'money_range')),
  is_required boolean not null default true,
  is_internal boolean not null default false,
  validation jsonb not null default '{}'::jsonb,
  options jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists diagnostic_models (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  title text not null,
  summary text not null,
  priority_order integer not null unique,
  root_cause text not null,
  pillars jsonb not null default '[]'::jsonb,
  trigger_rules jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists diagnostic_messages (
  id uuid primary key default gen_random_uuid(),
  model_code text not null references diagnostic_models(code) on delete cascade,
  variant text not null
    check (variant in ('v1', 'v2', 'v3')),
  block_1_title text not null,
  block_1_body text not null,
  scripture_verse text null,
  scripture_text text null,
  block_2_title text not null,
  block_2_body text not null,
  cta_label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (model_code, variant)
);

create table if not exists rogerio_quotes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  category text not null
    check (category in ('diagnostic', 'alma', 'principle', 'sales', 'leadership', 'finance')),
  quote_text text not null,
  source_label text null,
  model_code text null references diagnostic_models(code) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists diagnostico_respostas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  modelo_identificado text null references diagnostic_models(code) on delete set null,
  q11_faturamento text null,
  q15_canal text null,
  q16_capacidade text null,
  q17_horas text null,
  q18_status_empresa text null,
  score numeric(6,2) null,
  payload_raw jsonb not null default '{}'::jsonb,
  answers_by_code jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists diagnostico_respostas_user_id_idx on diagnostico_respostas (user_id, created_at desc);
create index if not exists diagnostico_respostas_modelo_idx on diagnostico_respostas (modelo_identificado);

create table if not exists onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  diagnostico_id uuid not null references diagnostico_respostas(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'abandoned')),
  modelo_confirmado text null references diagnostic_models(code) on delete set null,
  json_completo jsonb not null default '{}'::jsonb,
  sem_dre_flag boolean not null default false,
  sem_empresa_flag boolean not null default false,
  equipa_comercial_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists planos_acao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  onboarding_id uuid not null references onboarding_sessions(id) on delete cascade,
  modelo text not null references diagnostic_models(code) on delete restrict,
  versao_alma text not null,
  documento_1 jsonb not null default '{}'::jsonb,
  documento_2 jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists semanas (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references planos_acao(id) on delete cascade,
  numero integer not null,
  mes integer not null,
  fase text not null
    check (fase in ('fundamento', 'estrutura', 'escala', 'legado')),
  pilar text not null
    check (pilar in ('P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7')),
  versiculo text null,
  objetivo text not null,
  unlocked_at timestamptz null,
  iniciada_em timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plano_id, numero)
);

create table if not exists acoes_library (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  bloco text not null
    check (bloco in ('FIN', 'COM', 'LID', 'OPE', 'MET', 'PILAR', 'GERAL')),
  titulo text not null,
  descricao text not null,
  modelos_obrigatorios jsonb not null default '[]'::jsonb,
  modelos_condicionais jsonb not null default '{}'::jsonb,
  fase_inicio integer null,
  fase_fim integer null,
  versao_introducao text not null,
  definitiva boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tarefas_semana (
  id uuid primary key default gen_random_uuid(),
  semana_id uuid not null references semanas(id) on delete cascade,
  acao_codigo text null references acoes_library(codigo) on delete set null,
  descricao text not null,
  responsavel text null,
  meta text null,
  prioridade text not null default 'media'
    check (prioridade in ('baixa', 'media', 'alta', 'critica')),
  completada boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gates_semanais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  semana_id uuid not null references semanas(id) on delete cascade,
  semana_numero integer not null,
  gate_status text not null default 'locked'
    check (gate_status in ('locked', 'available', 'completed', 'overdue')),
  gate_timestamp timestamptz not null default now(),
  avancou_em timestamptz null,
  created_at timestamptz not null default now()
);

create unique index if not exists gates_semanais_user_semana_idx on gates_semanais (user_id, semana_id);

create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  semana_id uuid not null references semanas(id) on delete cascade,
  resposta_1 text not null,
  resposta_2 text not null,
  resposta_3 text not null,
  created_at timestamptz not null default now()
);

create table if not exists assinaturas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  plano text not null
    check (plano in ('light', 'pro')),
  status text not null
    check (status in ('trial', 'active', 'grace_period', 'expired', 'canceled')),
  store text not null
    check (store in ('mock', 'apple', 'google', 'stripe')),
  receipt_token text null,
  validade_ate timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists devocionais (
  id uuid primary key default gen_random_uuid(),
  semana_numero integer not null unique,
  titulo text not null,
  texto text not null,
  versiculo text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rag_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  source_type text not null
    check (source_type in ('docx', 'html', 'manual')),
  source_path text null,
  checksum text null,
  metadata jsonb not null default '{}'::jsonb,
  raw_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rag_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references rag_documents(id) on delete cascade,
  chunk_index integer not null,
  heading text null,
  content text not null,
  token_estimate integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  embedding jsonb null,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists rag_chunks_document_idx on rag_chunks (document_id, chunk_index);
