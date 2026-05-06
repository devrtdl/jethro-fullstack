import type { FastifyInstance } from 'fastify';

import { successResponse } from '../lib/api-response.js';
import { getDbPool } from '../lib/db.js';
import { userAuthPreHandler } from '../lib/user-auth.js';
import { generateSemanaCompleta } from '../domain/plano/service.js';

export async function registerUserRoutes(app: FastifyInstance) {
  /**
   * GET /user/flow-status
   * Retorna em que passo do fluxo o utilizador se encontra.
   */
  app.get('/user/flow-status', { preHandler: userAuthPreHandler }, async (request) => {
    const userId = request.userId!;
    const pool = getDbPool();

    const [diagRow, subRow, onbRow, planRow] = await Promise.all([
      pool.query('SELECT id FROM diagnostico_respostas WHERE user_id = $1 LIMIT 1', [userId]),
      pool.query(
        `SELECT status FROM assinaturas WHERE user_id = $1 AND status IN ('trial','active','grace_period') LIMIT 1`,
        [userId]
      ),
      pool.query(
        `SELECT id FROM onboarding_sessions WHERE user_id = $1 AND status = 'completed' LIMIT 1`,
        [userId]
      ),
      pool.query(`SELECT id FROM planos_acao WHERE user_id = $1 AND status = 'ready' LIMIT 1`, [userId]),
    ]);

    return successResponse({
      hasDiagnostic: diagRow.rows.length > 0,
      hasSubscription: subRow.rows.length > 0,
      hasOnboarding: onbRow.rows.length > 0,
      hasPlan: planRow.rows.length > 0,
    });
  });

  /**
   * GET /home
   * Dados necessários para a tab Início do app:
   * - devocional da semana actual
   * - KPIs do onboarding (ticker, clientes, receita)
   * - plano actual (semana, objectivo, tarefas)
   * - gate de avanço (horas registadas, status)
   * - modelo diagnóstico
   */
  app.get('/home', { preHandler: userAuthPreHandler }, async (request) => {
    const userId = request.userId!;
    const pool = getDbPool();

    // Carrega tudo em paralelo
    const [onboardingRow, planoRow, diagnosticoRow] = await Promise.all([
      pool
        .query<{ modelo_confirmado: string; json_completo: Record<string, unknown> }>(
          `SELECT modelo_confirmado, json_completo
           FROM onboarding_sessions WHERE user_id = $1 AND status = 'completed'
           ORDER BY created_at DESC LIMIT 1`,
          [userId]
        )
        .then((r) => r.rows[0] ?? null),

      pool
        .query<{
          plano_id: string;
          semana_id: string;
          semana_numero: number;
          fase: string;
          pilar: string;
          objetivo: string;
          gate_status: string;
          avancou_em: string | null;
        }>(
          `SELECT pa.id AS plano_id, s.id AS semana_id, s.numero AS semana_numero,
                  s.fase, s.pilar, s.objetivo, gs.gate_status, gs.avancou_em
           FROM planos_acao pa
           JOIN semanas s ON s.plano_id = pa.id
           JOIN gates_semanais gs ON gs.semana_id = s.id AND gs.user_id = pa.user_id
           WHERE pa.user_id = $1 AND gs.gate_status IN ('available', 'completed')
           ORDER BY s.numero ASC LIMIT 1`,
          [userId]
        )
        .then((r) => r.rows[0] ?? null),

      pool
        .query<{ modelo_identificado: string }>(
          `SELECT modelo_identificado FROM diagnostico_respostas
           WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [userId]
        )
        .then((r) => r.rows[0] ?? null),
    ]);

    const modelo =
      onboardingRow?.modelo_confirmado ?? diagnosticoRow?.modelo_identificado ?? null;
    const json = onboardingRow?.json_completo ?? null;

    // Devocional da semana actual (ou semana 1 se sem plano)
    const semanaNumero = planoRow?.semana_numero ?? 1;
    const devocionalRow = await pool
      .query<{ titulo: string; texto: string; versiculo: string }>(
        `SELECT titulo, texto, versiculo FROM devocionais WHERE semana_numero = $1`,
        [semanaNumero]
      )
      .then((r) => r.rows[0] ?? null);

    // Tarefas da semana actual
    const tarefas = planoRow
      ? await pool
          .query<{ descricao: string; prioridade: string; completada: boolean }>(
            `SELECT descricao, prioridade, completada
             FROM tarefas_semana WHERE semana_id = $1
             ORDER BY prioridade DESC, created_at ASC`,
            [planoRow.semana_id]
          )
          .then((r) => r.rows)
      : [];

    // Horas registadas: cada check-in = 1 dia de trabalho = 24h (gate abre com 5 check-ins / 120h)
    const checkInData = planoRow
      ? await pool
          .query<{ count: number; today_done: boolean }>(
            `SELECT
               COUNT(*)::int AS count,
               EXISTS(
                 SELECT 1 FROM check_ins
                 WHERE user_id = $1 AND semana_id = $2
                 AND created_at::date = CURRENT_DATE
               ) AS today_done
             FROM check_ins WHERE user_id = $1 AND semana_id = $2`,
            [userId, planoRow.semana_id]
          )
          .then((r) => r.rows[0] ?? { count: 0, today_done: false })
      : { count: 0, today_done: false };

    const horasRegistadas = checkInData.count * 24;

    return successResponse({
      modelo,
      devocional: devocionalRow,
      plano: planoRow
        ? {
            semanaNumero: planoRow.semana_numero,
            fase: planoRow.fase,
            pilar: planoRow.pilar,
            objetivo: planoRow.objetivo,
            gateStatus: planoRow.gate_status,
            horasRegistadas,
            horasNecessarias: 120,
            checkInsCount: checkInData.count,
            checkInsNecessarios: 5,
            todayCheckedIn: checkInData.today_done,
            tarefas,
          }
        : null,
      kpis: json
        ? {
            receitaAtual: json['receita_atual'] ?? null,
            ticketMedio: json['ticket_medio'] ?? null,
            clientesAtivos: json['clientes_ativos_total'] ?? null,
          }
        : null,
      onboardingCompleto: !!onboardingRow,
    });
  });

  /**
   * GET /diagnostic/latest
   * Último resultado de diagnóstico do utilizador autenticado.
   */
  app.get('/diagnostic/latest', { preHandler: userAuthPreHandler }, async (request) => {
    const userId = request.userId!;
    const pool = getDbPool();

    const row = await pool
      .query<{
        id: string;
        modelo_identificado: string;
        q11_faturamento: string | null;
        score: number | null;
        created_at: string;
        payload_raw: unknown;
      }>(
        `SELECT dr.id, dr.modelo_identificado, dr.q11_faturamento, dr.score, dr.created_at,
                dr.payload_raw
         FROM diagnostico_respostas dr
         WHERE dr.user_id = $1
         ORDER BY dr.created_at DESC LIMIT 1`,
        [userId]
      )
      .then((r) => r.rows[0] ?? null);

    if (!row) {
      return successResponse(null);
    }

    // Carrega mensagem do modelo
    const msgRow = await pool
      .query<{
        block_1_title: string;
        block_1_body: string;
        block_2_title: string;
        block_2_body: string;
        cta_label: string;
        scripture_verse: string | null;
        scripture_text: string | null;
      }>(
        `SELECT block_1_title, block_1_body, block_2_title, block_2_body, cta_label,
                scripture_verse, scripture_text
         FROM diagnostic_messages
         WHERE model_code = $1 AND variant = 'v1'`,
        [row.modelo_identificado]
      )
      .then((r) => r.rows[0] ?? null);

    return successResponse({
      id: row.id,
      modelo: row.modelo_identificado,
      faturamento: row.q11_faturamento,
      score: row.score,
      createdAt: row.created_at,
      mensagem: msgRow,
    });
  });

  /**
   * POST /check-in
   * Regista um dia de trabalho para a semana actual.
   * Apenas 1 check-in por dia por semana (idempotente dentro do mesmo dia).
   * Body: { cumpriu: boolean, nota?: string }
   */
  app.post<{ Body: { cumpriu: boolean; nota?: string } }>(
    '/check-in',
    { preHandler: userAuthPreHandler },
    async (request) => {
      const userId = request.userId!;
      const { cumpriu, nota = '' } = request.body ?? {};
      const pool = getDbPool();

      // Encontra a semana actual com gate available
      const semanaRow = await pool
        .query<{ semana_id: string; semana_numero: number }>(
          `SELECT s.id AS semana_id, s.numero AS semana_numero
           FROM planos_acao pa
           JOIN semanas s ON s.plano_id = pa.id
           JOIN gates_semanais gs ON gs.semana_id = s.id AND gs.user_id = pa.user_id
           WHERE pa.user_id = $1 AND gs.gate_status = 'available'
           ORDER BY s.numero ASC LIMIT 1`,
          [userId]
        )
        .then((r) => r.rows[0] ?? null);

      if (!semanaRow) {
        return successResponse({ skipped: true, reason: 'no_active_week' });
      }

      // Verifica se já fez check-in hoje
      const todayExists = await pool
        .query<{ exists: boolean }>(
          `SELECT EXISTS(
             SELECT 1 FROM check_ins
             WHERE user_id = $1 AND semana_id = $2 AND created_at::date = CURRENT_DATE
           ) AS exists`,
          [userId, semanaRow.semana_id]
        )
        .then((r) => r.rows[0]?.exists ?? false);

      if (todayExists) {
        return successResponse({ skipped: true, reason: 'already_done_today' });
      }

      await pool.query(
        `INSERT INTO check_ins (user_id, semana_id, resposta_1, resposta_2, resposta_3)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          semanaRow.semana_id,
          cumpriu ? 'sim' : 'nao',
          '24',
          nota ?? '',
        ]
      );

      // Conta total de check-ins para esta semana
      const total = await pool
        .query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM check_ins
           WHERE user_id = $1 AND semana_id = $2`,
          [userId, semanaRow.semana_id]
        )
        .then((r) => r.rows[0]?.count ?? 1);

      return successResponse({
        skipped: false,
        semanaNumero: semanaRow.semana_numero,
        checkInsCount: total,
        gateDesbloqueado: total >= 5,
      });
    }
  );

  /**
   * POST /gate/advance
   * Avança para a próxima semana se as condições forem cumpridas (>= 5 check-ins).
   * Marca a semana actual como 'completed' e a próxima como 'available'.
   */
  app.post(
    '/gate/advance',
    { preHandler: userAuthPreHandler },
    async (request) => {
      const userId = request.userId!;
      const pool = getDbPool();

      // Semana actual com gate available
      const currentRow = await pool
        .query<{ semana_id: string; plano_id: string; semana_numero: number }>(
          `SELECT s.id AS semana_id, s.plano_id, s.numero AS semana_numero
           FROM planos_acao pa
           JOIN semanas s ON s.plano_id = pa.id
           JOIN gates_semanais gs ON gs.semana_id = s.id AND gs.user_id = pa.user_id
           WHERE pa.user_id = $1 AND gs.gate_status = 'available'
           ORDER BY s.numero ASC LIMIT 1`,
          [userId]
        )
        .then((r) => r.rows[0] ?? null);

      if (!currentRow) {
        return successResponse({ advanced: false, reason: 'no_active_week' });
      }

      // Verifica condição: >= 5 check-ins
      const checkInCount = await pool
        .query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM check_ins
           WHERE user_id = $1 AND semana_id = $2`,
          [userId, currentRow.semana_id]
        )
        .then((r) => r.rows[0]?.count ?? 0);

      if (checkInCount < 5) {
        return successResponse({
          advanced: false,
          reason: 'insufficient_checkins',
          checkInsCount: checkInCount,
          required: 5,
        });
      }

      // Encontra a próxima semana
      const nextRow = await pool
        .query<{ semana_id: string; semana_numero: number }>(
          `SELECT s.id AS semana_id, s.numero AS semana_numero
           FROM semanas s
           WHERE s.plano_id = $1 AND s.numero = $2`,
          [currentRow.plano_id, currentRow.semana_numero + 1]
        )
        .then((r) => r.rows[0] ?? null);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Marca semana actual como completed
        await client.query(
          `UPDATE gates_semanais SET gate_status = 'completed', avancou_em = NOW()
           WHERE user_id = $1 AND semana_id = $2`,
          [userId, currentRow.semana_id]
        );

        // Desbloqueia próxima semana (se existir)
        if (nextRow) {
          await client.query(
            `UPDATE gates_semanais SET gate_status = 'available', gate_timestamp = NOW()
             WHERE user_id = $1 AND semana_id = $2`,
            [userId, nextRow.semana_id]
          );
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

      // Dispara geração do conteúdo completo da próxima semana em background
      if (nextRow) {
        void generateSemanaCompleta(nextRow.semana_id).catch((err) =>
          console.error('[gate/advance] generateSemanaCompleta error:', err)
        );
      }

      return successResponse({
        advanced: true,
        semanaAnterior: currentRow.semana_numero,
        proximaSemana: nextRow?.semana_numero ?? null,
        programaConcluido: !nextRow,
      });
    }
  );
}
