-- Migration 032: Corrigir duplicatas de usuário causadas por case mismatch no e-mail OAuth
--
-- Problema: usuários criados via diagnóstico (sem auth) têm email lowercase.
-- Quando fazem login com Google OAuth, o backend criava um segundo user com
-- o email no case retornado pelo Supabase (ex: "User@Gmail.com" vs "user@gmail.com"),
-- deixando o diagnóstico desvinculado do user autenticado.
--
-- Esta migration:
-- 1. Normaliza todos os emails da tabela users para lowercase
-- 2. Para pares de duplicatas, migra os dados do user "novo" (com auth_id)
--    para o user "antigo" (com diagnóstico vinculado) e remove o duplicado

-- Passo 1: Identificar e resolver duplicatas
-- Para cada par (lowercase_email), o user com diagnóstico é o "canônico";
-- o user com auth_id mas sem diagnóstico é o "duplicado".
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      u_diag.id    AS diag_user_id,
      u_auth.id    AS auth_user_id,
      u_auth.auth_id,
      u_auth.email AS auth_email
    FROM users u_auth
    JOIN users u_diag ON u_diag.email = lower(u_auth.email) AND u_diag.id != u_auth.id
    WHERE u_auth.email != lower(u_auth.email)
      AND u_auth.auth_id IS NOT NULL
      AND u_diag.auth_id IS NULL
  LOOP
    -- Transfere auth_id para o user canônico (que tem o diagnóstico)
    UPDATE users
    SET auth_id       = rec.auth_id,
        auth_provider = 'google'
    WHERE id = rec.diag_user_id;

    -- Migra assinaturas do user duplicado para o canônico
    UPDATE assinaturas
    SET user_id = rec.diag_user_id
    WHERE user_id = rec.auth_user_id;

    -- Migra onboarding_sessions
    UPDATE onboarding_sessions
    SET user_id = rec.diag_user_id
    WHERE user_id = rec.auth_user_id;

    -- Migra plano_acao_semanas
    UPDATE plano_acao_semanas
    SET user_id = rec.diag_user_id
    WHERE user_id = rec.auth_user_id;

    -- Remove o duplicado
    DELETE FROM users WHERE id = rec.auth_user_id;

    RAISE NOTICE 'Merged: auth_user=% → diag_user=% (email=%)', rec.auth_user_id, rec.diag_user_id, rec.auth_email;
  END LOOP;
END $$;

-- Passo 2: Normalizar todos os emails restantes para lowercase
UPDATE users
SET email = lower(email)
WHERE email != lower(email);
