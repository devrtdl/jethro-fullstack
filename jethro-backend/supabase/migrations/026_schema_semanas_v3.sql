-- Alinha schema de semanas e tarefas_semana ao Doc5 v2.1.
-- Renomeia campos, divide versículo, move materiais para nível de semana.

-- ── semanas ──────────────────────────────────────────────────────────────────

ALTER TABLE semanas RENAME COLUMN nome               TO titulo;
ALTER TABLE semanas RENAME COLUMN indicador_conclusao TO indicador_sucesso;

ALTER TABLE semanas
  ADD COLUMN IF NOT EXISTS versiculo_ancora    text NULL,
  ADD COLUMN IF NOT EXISTS versiculo_texto     text NULL,
  ADD COLUMN IF NOT EXISTS materiais_biblioteca jsonb NULL;

-- Migra versiculo existente para os dois novos campos.
-- Formato esperado: "Livro X:Y — texto" ou "Livro X:Y - texto"
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

ALTER TABLE semanas DROP COLUMN IF EXISTS resultado_esperado;
ALTER TABLE semanas DROP COLUMN IF EXISTS versiculo;

-- ── tarefas_semana ────────────────────────────────────────────────────────────

ALTER TABLE tarefas_semana RENAME COLUMN descricao         TO texto;
ALTER TABLE tarefas_semana RENAME COLUMN recurso_biblioteca TO tag;

ALTER TABLE tarefas_semana
  ADD COLUMN IF NOT EXISTS ordem integer NULL;

ALTER TABLE tarefas_semana DROP COLUMN IF EXISTS prioridade;
