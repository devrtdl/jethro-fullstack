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
  // Retorna as perguntas do onboarding filtradas pelo contexto diagnóstico do usuário
  app.get('/onboarding/questions', { preHandler: userAuthPreHandler }, async (request) => {
    const userId = request.userId!;
    const pool = getDbPool();

    // Carrega diagnóstico mais recente do usuário para filtrar perguntas condicionais
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

      // Perguntas com showIfAnswer são filtradas no frontend (dependem de respostas do onboarding)
      // O backend só aplica filtros baseados em dados do diagnóstico
      const showIf = m.showIf as Record<string, unknown> | undefined;
      if (!showIf) return true; // condicional mas sem showIf diagnóstico → frontend gere

      // Filtro por modelo diagnóstico
      if (Array.isArray(showIf.diagnosticModel)) {
        if (!diagnosticModel) return false;
        if (!(showIf.diagnosticModel as string[]).includes(diagnosticModel)) return false;
      }

      // Filtro por faturamento mínimo
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

    const isPreReceita = revenueLevel === 'A';

    const adapted = filtered
      .filter((q) => {
        // Esconder O7A2 (recorrentes) quando usuário ainda não fatura
        if (isPreReceita && q.code === 'onb_o7a2_recorrentes') return false;
        return true;
      })
      .map((q) => {
        // Adaptar label de O7A para linguagem de pré-receita
        if (isPreReceita && q.code === 'onb_o7a_clientes') {
          return {
            ...q,
            label: 'Quantas pessoas já demonstraram interesse ou foram atendidas de alguma forma?',
          };
        }
        return q;
      });

    return successResponse(adapted);
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

      // Carrega modelo e respostas do diagnóstico mais recente
      const diagRow = await pool
        .query<{ id: string; modelo_identificado: string; q11_faturamento: string | null; answers_by_code: Record<string, string> }>(
          `SELECT id, modelo_identificado, q11_faturamento, answers_by_code FROM diagnostico_respostas
           WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [userId]
        )
        .then((r) => r.rows[0] ?? null);

      if (!diagRow) {
        throw new AppError('Diagnostico necessario para completar o onboarding.', 400, 'DIAGNOSTIC_REQUIRED');
      }

      const diagnosticModel = diagRow.modelo_identificado;
      const diagAnswers = diagRow?.answers_by_code ?? {};

      const jsonCompleto = buildOnboardingJson(
        answers as Record<string, string | number | boolean | null>,
        diagnosticModel,
        diagRow.q11_faturamento
      );

      // Enriquece com campos que só existem no diagnóstico
      const faseLabelMap: Record<string, string> = {
        A: 'Ideia (pré-início)', B: 'Início (0-1 ano)',
        C: 'Em crescimento (1-3 anos)', D: 'Consolidado (3+ anos)',
      };
      jsonCompleto.area_negocio = (diagAnswers['q2_area_atuacao'] as string | undefined) ?? null;
      jsonCompleto.tempo_negocio = diagAnswers['q5_fase_negocio']
        ? (faseLabelMap[diagAnswers['q5_fase_negocio']] ?? diagAnswers['q5_fase_negocio'])
        : null;

      const newSession = await pool
        .query<{ id: string }>(
          `INSERT INTO onboarding_sessions
             (user_id, diagnostico_id, modelo_confirmado, json_completo, sem_dre_flag, sem_empresa_flag, equipa_comercial_count, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed')
           RETURNING id`,
          [
            userId,
            diagRow.id,
            diagnosticModel,
            jsonCompleto,
            jsonCompleto.sem_dre_flag,
            false,
            jsonCompleto.equipa_comercial_count ?? 0,
          ]
        )
        .then((r) => r.rows[0]!);
      const sessionId = newSession.id;

      return successResponse({ sessionId, modeloConfirmado: diagnosticModel, json: jsonCompleto });
    }
  );

  // Lê o JSON de onboarding do usuário autenticado
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
