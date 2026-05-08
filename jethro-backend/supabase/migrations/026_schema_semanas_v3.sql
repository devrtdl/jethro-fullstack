-- Alinha schema de semanas e tarefas_semana ao Doc5 v2.1.
-- Idempotente: cada operação verifica o estado real antes de executar.
-- Cenários suportados:
--   A) Fresh install (022 já usa nomes finais) — nada a fazer nos RENAMEs
--   B) DB legado com nome/indicador_conclusao — renomeia para titulo/indicador_sucesso
--   C) DB prod pós-rename manual onde 022 re-adicionou colunas antigas — dropa o duplicado

-- ── semanas: nome → titulo ────────────────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'semanas' AND column_name = 'nome'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'semanas' AND column_name = 'titulo'
    ) THEN
      -- Ambas existem: titulo já é o nome final, descarta nome
      ALTER TABLE semanas DROP COLUMN nome;
    ELSE
      ALTER TABLE semanas RENAME COLUMN nome TO titulo;
    END IF;
  END IF;
END $$;

-- ── semanas: indicador_conclusao → indicador_sucesso ─────────────────────────

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'semanas' AND column_name = 'indicador_conclusao'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'semanas' AND column_name = 'indicador_sucesso'
    ) THEN
      ALTER TABLE semanas DROP COLUMN indicador_conclusao;
    ELSE
      ALTER TABLE semanas RENAME COLUMN indicador_conclusao TO indicador_sucesso;
    END IF;
  END IF;
END $$;

-- ── semanas: novos campos ─────────────────────────────────────────────────────

ALTER TABLE semanas
  ADD COLUMN IF NOT EXISTS versiculo_ancora    text NULL,
  ADD COLUMN IF NOT EXISTS versiculo_texto     text NULL,
  ADD COLUMN IF NOT EXISTS materiais_biblioteca jsonb NULL;

-- Migra versiculo existente para os dois novos campos (só se versiculo ainda existir).
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'semanas' AND column_name = 'versiculo'
  ) THEN
    UPDATE semanas
    SET
      versiculo_ancora = TRIM(SPLIT_PART(REPLACE(versiculo, ' - ', ' — '), ' — ', 1)),
      versiculo_texto  = CASE
        WHEN POSITION(' — ' IN REPLACE(versiculo, ' - ', ' — ')) > 0
        THEN TRIM(SUBSTRING(
               REPLACE(versiculo, ' - ', ' — ')
               FROM POSITION(' — ' IN REPLACE(versiculo, ' - ', ' — ')) + 3
             ))
        ELSE NULL
      END
    WHERE versiculo IS NOT NULL;
  END IF;
END $$;

ALTER TABLE semanas DROP COLUMN IF EXISTS resultado_esperado;
ALTER TABLE semanas DROP COLUMN IF EXISTS versiculo;

-- ── tarefas_semana: descricao → texto ────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'tarefas_semana' AND column_name = 'descricao'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'tarefas_semana' AND column_name = 'texto'
    ) THEN
      ALTER TABLE tarefas_semana DROP COLUMN descricao;
    ELSE
      ALTER TABLE tarefas_semana RENAME COLUMN descricao TO texto;
    END IF;
  END IF;
END $$;

-- ── tarefas_semana: recurso_biblioteca → tag ─────────────────────────────────

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'tarefas_semana' AND column_name = 'recurso_biblioteca'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'tarefas_semana' AND column_name = 'tag'
    ) THEN
      ALTER TABLE tarefas_semana DROP COLUMN recurso_biblioteca;
    ELSE
      ALTER TABLE tarefas_semana RENAME COLUMN recurso_biblioteca TO tag;
    END IF;
  END IF;
END $$;

ALTER TABLE tarefas_semana
  ADD COLUMN IF NOT EXISTS ordem integer NULL;

ALTER TABLE tarefas_semana DROP COLUMN IF EXISTS prioridade;
