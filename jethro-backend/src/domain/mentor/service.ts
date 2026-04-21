import type Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.js';

import { getDbPool } from '../../lib/db.js';
import { getAnthropicClient } from '../../lib/anthropic.js';
import { loadAlmaContent } from '../../lib/alma-loader.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_HISTORY = 20;
const MAX_TOKENS = 1024;

type MentorChatResult = {
  reply: string;
  sessionId: string;
};

export async function createMentorChat(
  userId: string,
  sessionId: string,
  userMessage: string
): Promise<MentorChatResult> {
  const pool = getDbPool();

  // Carrega contexto do utilizador
  const contextRow = await pool
    .query<{ modelo: string; json_completo: Record<string, unknown> | null; semana_numero: number | null }>(
      `SELECT
         COALESCE(os.modelo_confirmado, dr.modelo_identificado) AS modelo,
         os.json_completo,
         s.numero AS semana_numero
       FROM users u
       LEFT JOIN (
         SELECT modelo_confirmado, json_completo, user_id
         FROM onboarding_sessions WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 1
       ) os ON os.user_id = u.id
       LEFT JOIN (
         SELECT modelo_identificado, user_id
         FROM diagnostico_respostas WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 1
       ) dr ON dr.user_id = u.id
       LEFT JOIN (
         SELECT pa.user_id, s.numero
         FROM planos_acao pa
         JOIN semanas s ON s.plano_id = pa.id
         JOIN gates_semanais gs ON gs.semana_id = s.id
         WHERE pa.user_id = $1 AND gs.gate_status = 'available'
         ORDER BY s.numero ASC LIMIT 1
       ) s ON s.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    )
    .then((r) => r.rows[0] ?? null);

  const contextoLead = contextRow
    ? [
        contextRow.modelo && `Modelo diagnóstico: ${contextRow.modelo}`,
        contextRow.semana_numero && `Semana activa no plano: ${contextRow.semana_numero} de 24`,
        contextRow.json_completo && `Dados do onboarding: ${JSON.stringify(contextRow.json_completo)}`,
      ]
        .filter(Boolean)
        .join('\n')
    : 'Utilizador sem contexto de plano activo.';

  // Histórico da sessão
  const historyRows = await pool
    .query<{ role: string; content: string }>(
      `SELECT role, content FROM mentor_messages
       WHERE user_id = $1 AND session_id = $2
       ORDER BY created_at ASC
       LIMIT ${MAX_HISTORY}`,
      [userId, sessionId]
    )
    .then((r) => r.rows);

  const history: MessageParam[] = historyRows.map((row) => ({
    role: row.role as 'user' | 'assistant',
    content: row.content,
  }));

  history.push({ role: 'user', content: userMessage });

  const alma = loadAlmaContent();

  // Chamada Claude com prompt caching na Alma
  const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
    { type: 'text', text: alma },
    {
      type: 'text',
      text: `Contexto do lead:\n${contextoLead}\n\nResponde como o Jethro — mentor PBN. Directo, cuidador, espiritual. Sem rodeios. Máximo 3 parágrafos.`,
    },
  ];

  // Prompt caching: marca o primeiro bloco (Alma) como ephemeral
  (systemBlocks[0] as unknown as { cache_control: { type: string } }).cache_control = {
    type: 'ephemeral',
  };

  const response = await getAnthropicClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemBlocks,
    messages: history,
  });

  const firstBlock = response.content[0];
  const reply = firstBlock?.type === 'text' ? firstBlock.text : '';

  // Persiste as mensagens
  await pool.query(
    `INSERT INTO mentor_messages (user_id, session_id, role, content) VALUES
     ($1, $2, 'user', $3),
     ($1, $2, 'assistant', $4)`,
    [userId, sessionId, userMessage, reply]
  );

  return { reply, sessionId };
}
