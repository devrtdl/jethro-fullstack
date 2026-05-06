import type { FastifyInstance } from 'fastify';

import { successResponse } from '../lib/api-response.js';
import { getDbPool } from '../lib/db.js';
import { userAuthPreHandler } from '../lib/user-auth.js';
import { initiateGeneratePlano, getPlanoStatus } from '../domain/plano/service.js';


export async function registerPlanoRoutes(app: FastifyInstance) {
  /**
   * POST /plano/generate
   * Gera o plano de 24 semanas com Claude + Alma + onboarding JSON.
   * Idempotente para a rodada atual: se já existe plano para o último onboarding, devolve o existente.
   */
  app.post('/plano/generate', { preHandler: userAuthPreHandler }, async (request) => {
    const userId = request.userId!;
    const result = await initiateGeneratePlano(userId);
    return successResponse(result);
  });

  /**
   * GET /plano/status
   * Retorna o status de geração do plano: not_started | generating | ready | error
   */
  app.get('/plano/status', { preHandler: userAuthPreHandler }, async (request) => {
    const userId = request.userId!;
    const result = await getPlanoStatus(userId);
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
      .query<{ id: string; modelo: string }>(
        `SELECT pa.id, pa.modelo
         FROM planos_acao pa
         JOIN (
           SELECT id FROM onboarding_sessions
           WHERE user_id = $1 AND status = 'completed'
           ORDER BY created_at DESC LIMIT 1
         ) os ON os.id = pa.onboarding_id
         WHERE pa.user_id = $1 AND pa.status = 'ready'
         ORDER BY pa.created_at DESC LIMIT 1`,
        [userId]
      )
      .then((r) => r.rows[0] ?? null);

    if (!planoRow) {
      return successResponse(null);
    }

    // Carrega semanas com gate status, tarefas e conteúdo completo
    const semanas = await pool
      .query<{
        semana_id: string;
        numero: number;
        fase: string;
        bloco: string | null;
        tag: string | null;
        objetivo: string;
        nome: string | null;
        versiculo: string | null;
        por_que_importa: string | null;
        indicador_conclusao: string | null;
        resultado_esperado: string | null;
        conteudo_completo: boolean;
        gate_status: string;
        tarefas: { descricao: string; prioridade: string; completada: boolean; recurso_biblioteca: string | null }[];
      }>(
        `SELECT
           s.id AS semana_id,
           s.numero,
           s.fase,
           s.bloco,
           s.tag,
           s.objetivo,
           s.nome,
           s.versiculo,
           s.por_que_importa,
           s.indicador_conclusao,
           s.resultado_esperado,
           s.conteudo_completo,
           gs.gate_status,
           COALESCE(
             json_agg(
               json_build_object(
                 'descricao', t.descricao,
                 'prioridade', t.prioridade,
                 'completada', t.completada,
                 'recurso_biblioteca', t.recurso_biblioteca
               ) ORDER BY t.prioridade DESC, t.created_at ASC
             ) FILTER (WHERE t.id IS NOT NULL),
             '[]'
           ) AS tarefas
         FROM semanas s
         JOIN gates_semanais gs ON gs.semana_id = s.id AND gs.user_id = $1
         LEFT JOIN tarefas_semana t ON t.semana_id = s.id
         WHERE s.plano_id = $2
         GROUP BY s.id, s.numero, s.fase, s.bloco, s.tag, s.objetivo, s.nome, s.versiculo,
                  s.por_que_importa, s.indicador_conclusao, s.resultado_esperado,
                  s.conteudo_completo, gs.gate_status
         ORDER BY s.numero ASC`,
        [userId, planoRow.id]
      )
      .then((r) => r.rows);

    return successResponse({
      planoId: planoRow.id,
      modelo: planoRow.modelo,
      totalSemanas: semanas.length,
      semanas: semanas.map((s) => ({
        numero: s.numero,
        nome: s.nome,
        objetivo: s.objetivo,
        por_que_importa: s.por_que_importa,
        versiculo: s.versiculo,
        fase: s.fase,
        bloco: s.bloco,
        tag: s.tag,
        gate_status: s.gate_status,
        indicador_conclusao: s.indicador_conclusao,
        resultado_esperado: s.resultado_esperado,
        conteudo_completo: s.conteudo_completo,
        tarefas: s.tarefas,
      })),
    });
  });
}
