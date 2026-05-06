-- Otimiza leituras da rodada atual de onboarding após passarmos a manter histórico.

CREATE INDEX IF NOT EXISTS onboarding_sessions_user_status_created_idx
  ON onboarding_sessions (user_id, status, created_at DESC);
