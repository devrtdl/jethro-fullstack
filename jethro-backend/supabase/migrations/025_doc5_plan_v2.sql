-- Alinha o motor de planos ao Doc5 v2.0.
-- Mantem compatibilidade com planos antigos e habilita blocos/tags novos.

ALTER TABLE semanas
  ADD COLUMN IF NOT EXISTS bloco text NULL,
  ADD COLUMN IF NOT EXISTS tag text NULL;

ALTER TABLE tarefas_semana
  ADD COLUMN IF NOT EXISTS recurso_biblioteca text NULL;

CREATE TABLE IF NOT EXISTS plano_ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plano_id uuid NULL REFERENCES planos_acao(id) ON DELETE CASCADE,
  modelo text NOT NULL,
  prompt_tipo text NOT NULL CHECK (prompt_tipo IN ('A', 'B')),
  semana_numero integer NULL,
  tokens_entrada integer NOT NULL DEFAULT 0,
  tokens_saida integer NOT NULL DEFAULT 0,
  cache_read_input_tokens integer NOT NULL DEFAULT 0,
  cache_creation_input_tokens integer NOT NULL DEFAULT 0,
  custo_estimado_usd numeric(12, 6) NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plano_ai_usage_user_created_idx
  ON plano_ai_usage (user_id, created_at DESC);

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT c.conname
    INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = current_schema()
    AND t.relname = 'semanas'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%fase%'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE semanas DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = current_schema()
      AND t.relname = 'semanas'
      AND c.conname = 'semanas_fase_doc5_check'
  ) THEN
    ALTER TABLE semanas
      ADD CONSTRAINT semanas_fase_doc5_check
      CHECK (fase IN ('fundamento', 'estrutura', 'controlo', 'crescimento', 'escala', 'legado'));
  END IF;
END $$;

UPDATE semanas
SET tag = CASE fase
  WHEN 'fundamento' THEN 'Fundamento'
  WHEN 'estrutura' THEN 'Estrutura'
  WHEN 'controlo' THEN 'Controlo'
  WHEN 'crescimento' THEN 'Crescimento'
  WHEN 'escala' THEN 'Escala'
  WHEN 'legado' THEN 'Legado'
  ELSE tag
END
WHERE tag IS NULL;
