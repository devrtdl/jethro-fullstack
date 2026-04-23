import type { FastifyInstance } from 'fastify';

import { successResponse } from '../lib/api-response.js';
import { getDbPool } from '../lib/db.js';
import { userAuthPreHandler } from '../lib/user-auth.js';
import { generatePlano } from '../domain/plano/service.js';

export async function registerPlanoRoutes(app: FastifyInstance) {
  /**
   * POST /plano/generate
   * Gera o plano de 24 semanas com Claude + Alma + onboarding JSON.
   * Idempotente: se já existe plano, devolve o existente.
   */
  app.post('/plano/generate', { preHandler: userAuthPreHandler }, async (request) => {
    const userId = request.userId!;
    const result = await generatePlano(userId);
    return successResponse(result);
  });

  /**
   * GET /plano
   * Devolve o plano completo de 24 semanas com tarefas e estado de cada gate.
   */
  app.get('/plano', { preHandler: userAuthPreHandler }, async (request) => {
    const userId = request.userId!;
    const pool = getDbPool();

    const planoRow = await pool
      .query<{ id: string; modelo: string; documento_1: Record<string, unknown> }>(
        `SELECT id, modelo, documento_1 FROM planos_acao WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId]
      )
      .then((r) => r.rows[0] ?? null);

    if (!planoRow) {
      return successResponse(null);
    }

    // Carrega semanas com gate status e tarefas
    const semanas = await pool
      .query<{
        semana_id: string;
        numero: number;
        fase: string;
        objetivo: string;
        versiculo: string | null;
        gate_status: string;
        tarefas: { descricao: string; prioridade: string; completada: boolean }[];
      }>(
        `SELECT
           s.id AS semana_id,
           s.numero,
           s.fase,
           s.objetivo,
           s.versiculo,
           gs.gate_status,
           COALESCE(
             json_agg(
               json_build_object(
                 'descricao', t.descricao,
                 'prioridade', t.prioridade,
                 'completada', t.completada
               ) ORDER BY t.prioridade DESC, t.created_at ASC
             ) FILTER (WHERE t.id IS NOT NULL),
             '[]'
           ) AS tarefas
         FROM semanas s
         JOIN gates_semanais gs ON gs.semana_id = s.id AND gs.user_id = $1
         LEFT JOIN tarefas_semana t ON t.semana_id = s.id
         WHERE s.plano_id = $2
         GROUP BY s.id, s.numero, s.fase, s.objetivo, s.versiculo, gs.gate_status
         ORDER BY s.numero ASC`,
        [userId, planoRow.id]
      )
      .then((r) => r.rows);

    // Enriquece com campos extra do documento_1 (nome, por_que_importa, etc.)
    const doc1Semanas = (planoRow.documento_1 as { semanas?: Record<string, unknown>[] })?.semanas ?? [];
    const doc1ByNumero = new Map(doc1Semanas.map((s) => [s['numero'] as number, s]));

    const semanasEnriquecidas = semanas.map((s) => {
      const extra = doc1ByNumero.get(s.numero) ?? {};
      return {
        numero: s.numero,
        nome: extra['nome'] ?? null,
        objetivo: s.objetivo,
        por_que_importa: extra['por_que_importa'] ?? null,
        versiculo: s.versiculo,
        fase: s.fase,
        gate_status: s.gate_status,
        indicador_conclusao: extra['indicador_conclusao'] ?? null,
        resultado_esperado: extra['resultado_esperado'] ?? null,
        tarefas: s.tarefas,
      };
    });

    return successResponse({
      planoId: planoRow.id,
      modelo: planoRow.modelo,
      totalSemanas: semanasEnriquecidas.length,
      semanas: semanasEnriquecidas,
    });
  });
}
