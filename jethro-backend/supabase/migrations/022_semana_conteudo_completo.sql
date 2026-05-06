-- Armazena conteúdo por semana diretamente na tabela semanas.
-- Permite geração incremental: semana 1 completa no onboarding, restantes sob demanda.

ALTER TABLE semanas
  ADD COLUMN IF NOT EXISTS nome                text    NULL,
  ADD COLUMN IF NOT EXISTS por_que_importa     text    NULL,
  ADD COLUMN IF NOT EXISTS indicador_conclusao text    NULL,
  ADD COLUMN IF NOT EXISTS resultado_esperado  text    NULL,
  ADD COLUMN IF NOT EXISTS conteudo_completo   boolean NOT NULL DEFAULT false;
