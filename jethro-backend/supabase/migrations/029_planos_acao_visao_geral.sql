-- Campos de Visão Geral gerados pela IA (Prompt A).
-- tagline, introducao, diagnostico_geral, fundamento_biblico aparecem na aba Visão Geral do plano.
-- negocio e data_geracao são metadados exibidos no cabeçalho do plano.

ALTER TABLE planos_acao
  ADD COLUMN IF NOT EXISTS tagline          text    NULL,
  ADD COLUMN IF NOT EXISTS introducao       text    NULL,
  ADD COLUMN IF NOT EXISTS diagnostico_geral jsonb  NULL,
  ADD COLUMN IF NOT EXISTS fundamento_biblico jsonb NULL,
  ADD COLUMN IF NOT EXISTS negocio          text    NULL,
  ADD COLUMN IF NOT EXISTS data_geracao     date    NULL;
