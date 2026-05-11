import type { FastifyInstance } from 'fastify';

import { successResponse } from '../lib/api-response.js';
import { getDbPool } from '../lib/db.js';
import { userAuthPreHandler } from '../lib/user-auth.js';
import { initiateGeneratePlano, getPlanoStatus } from '../domain/plano/service.js';
import { AppError } from '../lib/errors.js';


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
        titulo: string | null;
        versiculo_ancora: string | null;
        versiculo_texto: string | null;
        por_que_importa: string | null;
        indicador_sucesso: string | null;
        materiais_biblioteca: string[] | null;
        conteudo_completo: boolean;
        gate_status: string;
        acoes: { id: string; texto: string; ordem: number | null; completada: boolean; tag: string | null }[];
      }>(
        `SELECT
           s.id AS semana_id,
           s.numero,
           s.fase,
           s.bloco,
           s.tag,
           s.objetivo,
           s.titulo,
           s.versiculo_ancora,
           s.versiculo_texto,
           s.por_que_importa,
           s.indicador_sucesso,
           s.materiais_biblioteca,
           s.conteudo_completo,
           gs.gate_status,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', t.id,
                 'texto', t.texto,
                 'ordem', t.ordem,
                 'completada', t.completada,
                 'tag', t.tag
               ) ORDER BY t.ordem ASC NULLS LAST, t.created_at ASC
             ) FILTER (WHERE t.id IS NOT NULL),
             '[]'
           ) AS acoes
         FROM semanas s
         JOIN gates_semanais gs ON gs.semana_id = s.id AND gs.user_id = $1
         LEFT JOIN tarefas_semana t ON t.semana_id = s.id
         WHERE s.plano_id = $2
         GROUP BY s.id, s.numero, s.fase, s.bloco, s.tag, s.objetivo, s.titulo,
                  s.versiculo_ancora, s.versiculo_texto, s.por_que_importa,
                  s.indicador_sucesso, s.materiais_biblioteca,
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
        titulo: s.titulo,
        objetivo: s.objetivo,
        por_que_importa: s.por_que_importa,
        versiculo_ancora: s.versiculo_ancora,
        versiculo_texto: s.versiculo_texto,
        fase: s.fase,
        bloco: s.bloco,
        tag: s.tag,
        gate_status: s.gate_status,
        status: s.gate_status === 'available' || s.gate_status === 'completed' ? 'ativa' : 'bloqueada',
        indicador_sucesso: s.indicador_sucesso,
        materiais_biblioteca: s.materiais_biblioteca,
        conteudo_completo: s.conteudo_completo,
        acoes: s.acoes,
      })),
    });
  });

  /**
   * PATCH /plano/tarefa/:tarefaId
   * Marca uma tarefa como completada (ou reverte). A tarefa deve pertencer a um plano do utilizador.
   */
  app.patch('/plano/tarefa/:tarefaId', { preHandler: userAuthPreHandler }, async (request) => {
    const userId = request.userId!;
    const { tarefaId } = request.params as { tarefaId: string };
    const { completada } = request.body as { completada: boolean };

    if (typeof completada !== 'boolean') {
      throw new AppError('Campo "completada" é obrigatório e deve ser boolean.', 400, 'INVALID_BODY');
    }

    const pool = getDbPool();

    const result = await pool.query<{ id: string }>(
      `UPDATE tarefas_semana t
       SET completada = $1, updated_at = now()
       FROM semanas s
       JOIN planos_acao pa ON pa.id = s.plano_id
       WHERE t.id = $2
         AND t.semana_id = s.id
         AND pa.user_id = $3
       RETURNING t.id`,
      [completada, tarefaId, userId]
    );

    if (result.rowCount === 0) {
      throw new AppError('Tarefa não encontrada ou sem permissão.', 404, 'TAREFA_NOT_FOUND');
    }

    return successResponse({ updated: true, completada });
  });
}
