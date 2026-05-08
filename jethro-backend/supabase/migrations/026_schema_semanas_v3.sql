-- Alinha schema de semanas e tarefas_semana ao Doc5 v2.1.
-- Renomeia campos, divide versículo, move materiais para nível de semana.
-- Idempotente: todos os RENAMEs verificam se a coluna-fonte ainda existe.

-- ── semanas ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='semanas' AND column_name='nome') THEN
    ALTER TABLE semanas RENAME COLUMN nome TO titulo;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='semanas' AND column_name='indicador_conclusao') THEN
    ALTER TABLE semanas RENAME COLUMN indicador_conclusao TO indicador_sucesso;
  END IF;
END $$;

ALTER TABLE semanas
  ADD COLUMN IF NOT EXISTS versiculo_ancora    text NULL,
  ADD COLUMN IF NOT EXISTS versiculo_texto     text NULL,
  ADD COLUMN IF NOT EXISTS materiais_biblioteca jsonb NULL;

-- Migra versiculo existente para os dois novos campos (só se versiculo ainda existir).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='semanas' AND column_name='versiculo') THEN
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

-- ── tarefas_semana ────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tarefas_semana' AND column_name='descricao') THEN
    ALTER TABLE tarefas_semana RENAME COLUMN descricao TO texto;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tarefas_semana' AND column_name='recurso_biblioteca') THEN
    ALTER TABLE tarefas_semana RENAME COLUMN recurso_biblioteca TO tag;
  END IF;
END $$;

ALTER TABLE tarefas_semana
  ADD COLUMN IF NOT EXISTS ordem integer NULL;

ALTER TABLE tarefas_semana DROP COLUMN IF EXISTS prioridade;
