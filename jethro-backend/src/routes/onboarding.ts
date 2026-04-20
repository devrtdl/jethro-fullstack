import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { successResponse } from '../lib/api-response.js';
import { getDbPool } from '../lib/db.js';
import { AppError } from '../lib/errors.js';
import { userAuthPreHandler } from '../lib/user-auth.js';
import { buildOnboardingJson } from '../domain/onboarding/service.js';

const onboardingSubmitSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
});

export async function registerOnboardingRoutes(app: FastifyInstance) {
  // Retorna todas as perguntas do onboarding (para o frontend renderizar o formulário)
  app.get('/onboarding/questions', async () => {
    const pool = getDbPool();
    const rows = await pool
      .query(
        `SELECT code, order_index, label, helper_text, question_type, is_required, options, metadata
         FROM diagnostic_questions
         WHERE metadata->>'form' = 'onboarding'
         ORDER BY order_index ASC`
      )
      .then((r) => r.rows);
    return successResponse(rows);
  });


  app.post(
    '/onboarding/submit',
    { preHandler: userAuthPreHandler },
    async (request) => {
      const userId = request.userId!;
      const { answers } = onboardingSubmitSchema.parse(request.body);

      const pool = getDbPool();

      // Verifica assinatura activa
      const subscription = await pool
        .query<{ status: string }>(
          `SELECT status FROM assinaturas
           WHERE user_id = $1 AND status IN ('trial', 'active', 'grace_period')
           ORDER BY created_at DESC LIMIT 1`,
          [userId]
        )
        .then((r) => r.rows[0] ?? null);

      if (!subscription) {
        throw new AppError(
          'Assinatura activa necessaria para completar o onboarding.',
          403,
          'SUBSCRIPTION_REQUIRED'
        );
      }

      // Carrega modelo do diagnóstico mais recente
      const diagRow = await pool
        .query<{ modelo_diagnostico: string }>(
          `SELECT modelo_diagnostico FROM diagnostico_respostas
           WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [userId]
        )
        .then((r) => r.rows[0] ?? null);

      const diagnosticModel = diagRow?.modelo_diagnostico ?? 'A';

      const jsonCompleto = buildOnboardingJson(
        answers as Record<string, string | number | boolean | null>,
        diagnosticModel
      );

      // Persiste na onboarding_session mais recente ou cria nova
      const sessionRow = await pool
        .query<{ id: string }>(
          `SELECT id FROM onboarding_sessions WHERE user_id = $1
           ORDER BY created_at DESC LIMIT 1`,
          [userId]
        )
        .then((r) => r.rows[0] ?? null);

      let sessionId: string;

      if (sessionRow) {
        await pool.query(
          `UPDATE onboarding_sessions SET
             json_completo = $1,
             modelo_confirmado = $2,
             sem_dre_flag = $3,
             sem_empresa_flag = $4,
             equipa_comercial_count = $5,
             status = 'completed'
           WHERE id = $6`,
          [
            jsonCompleto,
            diagnosticModel,
            jsonCompleto.sem_dre_flag,
            false,
            jsonCompleto.equipa_comercial_count ?? 0,
            sessionRow.id,
          ]
        );
        sessionId = sessionRow.id;
      } else {
        const newSession = await pool
          .query<{ id: string }>(
            `INSERT INTO onboarding_sessions
               (user_id, modelo_confirmado, json_completo, sem_dre_flag, sem_empresa_flag, equipa_comercial_count, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'completed')
             RETURNING id`,
            [
              userId,
              diagnosticModel,
              jsonCompleto,
              jsonCompleto.sem_dre_flag,
              false,
              jsonCompleto.equipa_comercial_count ?? 0,
            ]
          )
          .then((r) => r.rows[0]!);
        sessionId = newSession.id;
      }

      return successResponse({ sessionId, modeloConfirmado: diagnosticModel, json: jsonCompleto });
    }
  );

  // Lê o JSON de onboarding do utilizador autenticado
  app.get(
    '/onboarding/summary',
    { preHandler: userAuthPreHandler },
    async (request) => {
      const userId = request.userId!;
      const pool = getDbPool();

      const row = await pool
        .query<{ id: string; modelo_confirmado: string; json_completo: unknown; status: string }>(
          `SELECT id, modelo_confirmado, json_completo, status
           FROM onboarding_sessions WHERE user_id = $1
           ORDER BY created_at DESC LIMIT 1`,
          [userId]
        )
        .then((r) => r.rows[0] ?? null);

      if (!row) {
        throw new AppError('Onboarding nao encontrado.', 404, 'ONBOARDING_NOT_FOUND');
      }

      return successResponse(row);
    }
  );
}
