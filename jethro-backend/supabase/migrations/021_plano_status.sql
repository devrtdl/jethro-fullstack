-- Adiciona status de geração ao planos_acao para suporte a polling assíncrono.
-- Registos existentes recebem status='ready' (já gerados).

ALTER TABLE planos_acao
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ready'
    CHECK (status IN ('generating', 'ready', 'error')),
  ADD COLUMN IF NOT EXISTS error_message text NULL;

CREATE INDEX IF NOT EXISTS planos_acao_user_status_idx ON planos_acao (user_id, status);
