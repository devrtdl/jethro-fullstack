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
  // Retorna as perguntas do onboarding filtradas pelo contexto diagnóstico do utilizador
  app.get('/onboarding/questions', { preHandler: userAuthPreHandler }, async (request) => {
    const userId = request.userId!;
    const pool = getDbPool();

    // Carrega diagnóstico mais recente do utilizador para filtrar perguntas condicionais
    const diagRow = await pool
      .query<{
        modelo_identificado: string;
        q11_faturamento: string | null;
        answers_by_code: Record<string, string>;
      }>(
        `SELECT modelo_identificado, q11_faturamento, answers_by_code
         FROM diagnostico_respostas WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      )
      .then((r) => r.rows[0] ?? null);

    const diagnosticModel = diagRow?.modelo_identificado ?? null;
    const revenueLevel = diagRow?.q11_faturamento ?? null;
    const diagAnswers = diagRow?.answers_by_code ?? {};

    // Mapeamento: A < B < C < D < E (revenue bands)
    const revenueBands = ['A', 'B', 'C', 'D', 'E'];
    function revenueAtLeast(min: string): boolean {
      if (!revenueLevel) return false;
      return revenueBands.indexOf(revenueLevel) >= revenueBands.indexOf(min);
    }

    const allRows = await pool
      .query<{
        code: string;
        order_index: number;
        label: string;
        helper_text: string | null;
        question_type: string;
        is_required: boolean;
        options: unknown;
        metadata: Record<string, unknown>;
      }>(
        `SELECT code, order_index, label, helper_text, question_type, is_required, options, metadata
         FROM diagnostic_questions
         WHERE metadata->>'form' = 'onboarding'
         ORDER BY order_index ASC`
      )
      .then((r) => r.rows);

    const filtered = allRows.filter((q) => {
      const m = q.metadata;

      // Não condicional → sempre exibir
      if (!m.conditional) return true;

      const showIf = m.showIf as Record<string, unknown> | undefined;
      if (!showIf) return true;

      // Filtro por modelo diagnóstico
      if (Array.isArray(showIf.diagnosticModel)) {
        if (!diagnosticModel) return false;
        if (!(showIf.diagnosticModel as string[]).includes(diagnosticModel)) return false;
      }

      // Filtro por faturamento mínimo (ex: OB-10, OB-13)
      if (typeof showIf.diagnosticRevenueMin === 'string') {
        if (!revenueAtLeast(showIf.diagnosticRevenueMin as string)) return false;
      }

      // Filtro por resposta diagnóstica (ex: OB-11 → q_precificacao)
      if (typeof showIf.diagnosticAnswerSlug === 'string') {
        const slug = showIf.diagnosticAnswerSlug as string;
        const allowed = showIf.diagnosticAnswerValues as string[] | undefined;
        const answer = diagAnswers[slug] ?? null;
        if (allowed && !allowed.includes(answer ?? '')) return false;
      }

      // Excluir modelos específicos
      if (Array.isArray(showIf.excludeModels) && diagnosticModel) {
        if ((showIf.excludeModels as string[]).includes(diagnosticModel)) return false;
      }

      return true;
    });

    return successResponse(filtered);
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
        .query<{ modelo_identificado: string }>(
          `SELECT modelo_identificado FROM diagnostico_respostas
           WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [userId]
        )
        .then((r) => r.rows[0] ?? null);

      const diagnosticModel = diagRow?.modelo_identificado ?? 'A';

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
