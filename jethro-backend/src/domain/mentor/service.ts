import type Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.js';

import { getDbPool } from '../../lib/db.js';
import { getAnthropicClient } from '../../lib/anthropic.js';
import { loadAlmaContent } from '../../lib/alma-loader.js';
import {
  buscarFaqTier1,
  FAQ_POR_MODELO,
  MATERIAIS_TECNICOS,
  INSTRUCOES_IA,
  derivarFase,
  type ModelCode,
} from './faq-data.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_HISTORY = 20;
const MAX_TOKENS = 1024;

type MentorChatResult = {
  reply: string;
  sessionId: string;
};

type ContextRow = {
  modelo: string | null;
  json_completo: Record<string, unknown> | null;
  semana_numero: number | null;
  gate_status: string | null;
  email: string | null;
  semana_id: string | null;
};

function extrairNome(email: string | null, jsonCompleto: Record<string, unknown> | null): string {
  if (jsonCompleto) {
    const nome =
      (jsonCompleto['full_name'] as string | undefined) ??
      (jsonCompleto['nome'] as string | undefined) ??
      (jsonCompleto['name'] as string | undefined);
    if (nome) return nome;
  }
  if (email) {
    const local = email.split('@')[0] ?? '';
    return local.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return 'Empreendedor';
}

function formatarFaqModelo(modelo: string): string {
  if (!(modelo in FAQ_POR_MODELO)) return '';
  const items = FAQ_POR_MODELO[modelo as ModelCode];
  return items.map((item) => `P: ${item.q}\nR: ${item.a}`).join('\n\n');
}

export async function createMentorChat(
  userId: string,
  sessionId: string,
  userMessage: string
): Promise<MentorChatResult> {
  const pool = getDbPool();

  // Carrega contexto do utilizador
  const contextRow = await pool
    .query<ContextRow>(
      `SELECT
         COALESCE(os.modelo_confirmado, dr.modelo_identificado) AS modelo,
         os.json_completo,
         s.numero AS semana_numero,
         COALESCE(gs.gate_status, 'pendente') AS gate_status,
         u.email,
         s.semana_id
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
         SELECT pa.user_id, s.numero, gs.gate_status, s.id as semana_id
         FROM planos_acao pa
         JOIN semanas s ON s.plano_id = pa.id
         JOIN gates_semanais gs ON gs.semana_id = s.id
         WHERE pa.user_id = $1 AND gs.gate_status = 'available'
         ORDER BY s.numero ASC LIMIT 1
       ) s ON s.user_id = u.id
       LEFT JOIN gates_semanais gs ON gs.semana_id = s.semana_id
       WHERE u.id = $1`,
      [userId]
    )
    .then((r) => r.rows[0] ?? null);

  // Tier 1: FAQ match — responde sem chamar o Claude
  const tier1Answer = buscarFaqTier1(userMessage, contextRow?.modelo ?? null);
  if (tier1Answer) {
    await pool.query(
      `INSERT INTO mentor_messages (user_id, session_id, role, content) VALUES ($1, $2, 'user', $3), ($1, $2, 'assistant', $4)`,
      [userId, sessionId, userMessage, tier1Answer]
    );
    return { reply: tier1Answer, sessionId };
  }

  // Tier 2: Claude com contexto enriquecido

  const modelo = contextRow?.modelo ?? null;
  const semanaNumero = contextRow?.semana_numero ?? null;
  const gateStatus = contextRow?.gate_status ?? 'pendente';
  const nome = extrairNome(contextRow?.email ?? null, contextRow?.json_completo ?? null);
  const fase = semanaNumero != null ? derivarFase(semanaNumero) : null;

  const contextoLinhas: string[] = [
    `Contexto do utilizador:`,
    `Nome: ${nome}`,
    `Modelo diagnóstico: ${modelo ?? 'não identificado'}`,
    `Semana atual: ${semanaNumero != null ? `${semanaNumero} de 24` : 'não iniciada'}`,
    `Fase atual: ${fase ?? 'não iniciada'}`,
    `Gate status: ${gateStatus}`,
  ];

  if (modelo && modelo in FAQ_POR_MODELO) {
    const faqModelo = formatarFaqModelo(modelo);
    contextoLinhas.push('');
    contextoLinhas.push(`FAQ específico para o Modelo ${modelo}:`);
    contextoLinhas.push(faqModelo);
  }

  contextoLinhas.push('');
  contextoLinhas.push('Índice de materiais técnicos disponíveis:');
  contextoLinhas.push(MATERIAIS_TECNICOS);
  contextoLinhas.push('');
  contextoLinhas.push(INSTRUCOES_IA);

  const contextoEnriquecido = contextoLinhas.join('\n');

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

  // Chamada Claude com prompt caching na Alma + contexto enriquecido
  const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
    { type: 'text', text: alma },
    {
      type: 'text',
      text: contextoEnriquecido,
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
