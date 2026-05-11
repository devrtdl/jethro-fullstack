-- Novos campos por ação: título curto, descrição detalhada e critério de conclusão.
-- Idempotente. Planos antigos ficam com titulo/descricao/concluida_quando = NULL;
-- o campo texto continua a ser o texto de exibição principal.

ALTER TABLE tarefas_semana
  ADD COLUMN IF NOT EXISTS titulo          text NULL,
  ADD COLUMN IF NOT EXISTS descricao       text NULL,
  ADD COLUMN IF NOT EXISTS concluida_quando text NULL;
