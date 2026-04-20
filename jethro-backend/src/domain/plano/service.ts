import type Anthropic from '@anthropic-ai/sdk';

import { getDbPool } from '../../lib/db.js';
import { getAnthropicClient } from '../../lib/anthropic.js';
import { loadAlmaContent } from '../../lib/alma-loader.js';
import { AppError } from '../../lib/errors.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 8096;
const ALMA_VERSION = 'v5.14';

const FASES: Record<number, string> = {
  1: 'fundamento', 2: 'fundamento', 3: 'fundamento', 4: 'fundamento', 5: 'fundamento', 6: 'fundamento',
  7: 'estrutura', 8: 'estrutura', 9: 'estrutura', 10: 'estrutura', 11: 'estrutura', 12: 'estrutura',
  13: 'escala', 14: 'escala', 15: 'escala', 16: 'escala', 17: 'escala', 18: 'escala',
  19: 'legado', 20: 'legado', 21: 'legado', 22: 'legado', 23: 'legado', 24: 'legado',
};

const PILARES_POR_SEMANA: Record<number, string> = {
  1: 'P1', 2: 'P1', 3: 'P2', 4: 'P2', 5: 'P3', 6: 'P3',
  7: 'P4', 8: 'P4', 9: 'P5', 10: 'P5', 11: 'P6', 12: 'P6',
  13: 'P7', 14: 'P7', 15: 'P1', 16: 'P2', 17: 'P3', 18: 'P4',
  19: 'P5', 20: 'P6', 21: 'P7', 22: 'P1', 23: 'P2', 24: 'P7',
};

type SemanaGerada = {
  numero: number;
  objetivo: string;
  versiculo: string | null;
  tarefas: Array<{
    descricao: string;
    prioridade: 'baixa' | 'media' | 'alta' | 'critica';
    acao_codigo: string | null;
  }>;
};

type PlanoGerado = {
  semanas: SemanaGerada[];
};

function buildPlanPrompt(
  diagnosticModel: string,
  onboardingJson: Record<string, unknown>
): string {
  const json = JSON.stringify(onboardingJson, null, 2);

  return `Você é o Jethro, mentor PBN. Com base no diagnóstico e onboarding abaixo, crie um plano de ação estruturado de 24 semanas para este empresário.

MODELO DIAGNÓSTICO: ${diagnosticModel}

DADOS DO ONBOARDING:
${json}

INSTRUÇÕES:
- Gere exactamente 24 semanas
- Cada semana deve ter: objetivo claro (1 frase), versículo bíblico relacionado, e 2-4 tarefas práticas
- As tarefas devem ser acções concretas e mensuráveis, adaptadas ao modelo ${diagnosticModel}
- Semanas 1-6: fase fundamento (bases do negócio)
- Semanas 7-12: fase estrutura (sistemas e processos)
- Semanas 13-18: fase escala (crescimento)
- Semanas 19-24: fase legado (sustentabilidade e impacto)
- Prioridades das tarefas: baixa / media / alta / critica
- Adapte ao contexto real: modelo diagnóstico, problemas declarados, receita, equipa

FORMATO DE RESPOSTA (JSON puro, sem markdown):
{
  "semanas": [
    {
      "numero": 1,
      "objetivo": "...",
      "versiculo": "Livro X:Y",
      "tarefas": [
        { "descricao": "...", "prioridade": "alta", "acao_codigo": null },
        { "descricao": "...", "prioridade": "media", "acao_codigo": null }
      ]
    }
  ]
}

Responda APENAS com o JSON. Sem texto antes ou depois.`;
}

export async function generatePlano(userId: string): Promise<{ planoId: string }> {
  const pool = getDbPool();

  // Verifica onboarding completo
  const onboardingRow = await pool
    .query<{ id: string; modelo_confirmado: string; json_completo: Record<string, unknown> }>(
      `SELECT id, modelo_confirmado, json_completo
       FROM onboarding_sessions WHERE user_id = $1 AND status = 'completed'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    )
    .then((r) => r.rows[0] ?? null);

  if (!onboardingRow) {
    throw new AppError('Onboarding não concluído.', 400, 'ONBOARDING_REQUIRED');
  }

  // Verifica se já tem plano activo
  const planoExistente = await pool
    .query<{ id: string }>(
      `SELECT id FROM planos_acao WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    )
    .then((r) => r.rows[0] ?? null);

  if (planoExistente) {
    return { planoId: planoExistente.id };
  }

  const { modelo_confirmado: diagnosticModel, json_completo: onboardingJson } = onboardingRow;
  const alma = loadAlmaContent();

  // Chamada Claude com Alma cacheada
  const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
    { type: 'text', text: alma },
    { type: 'text', text: 'Você é o Jethro, mentor do Programa Bases do Negócio (PBN). Gere planos de acção estruturados, práticos e espirituais para empresários cristãos.' },
  ];

  (systemBlocks[0] as unknown as { cache_control: { type: string } }).cache_control = {
    type: 'ephemeral',
  };

  const prompt = buildPlanPrompt(diagnosticModel, onboardingJson as Record<string, unknown>);

  const response = await getAnthropicClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemBlocks,
    messages: [{ role: 'user', content: prompt }],
  });

  const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '';

  let planoGerado: PlanoGerado;
  try {
    // Remove possíveis blocos markdown se Claude os incluir
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    planoGerado = JSON.parse(cleaned) as PlanoGerado;
  } catch {
    throw new AppError('Erro ao interpretar plano gerado.', 500, 'PLAN_PARSE_ERROR');
  }

  if (!Array.isArray(planoGerado.semanas) || planoGerado.semanas.length !== 24) {
    throw new AppError('Plano gerado inválido — número de semanas incorreto.', 500, 'PLAN_INVALID');
  }

  // Persiste o plano numa transação
  const client = await pool.connect();
  let planoId: string;

  try {
    await client.query('BEGIN');

    const planoResult = await client.query<{ id: string }>(
      `INSERT INTO planos_acao (user_id, onboarding_id, modelo, versao_alma, documento_1, documento_2)
       VALUES ($1, $2, $3, $4, $5::jsonb, '{}'::jsonb)
       RETURNING id`,
      [userId, onboardingRow.id, diagnosticModel, ALMA_VERSION, JSON.stringify(planoGerado)]
    );

    planoId = planoResult.rows[0]!.id;

    for (const semana of planoGerado.semanas) {
      const n = semana.numero;
      const fase = FASES[n] ?? 'fundamento';
      const pilar = PILARES_POR_SEMANA[n] ?? 'P1';

      const semanaResult = await client.query<{ id: string }>(
        `INSERT INTO semanas (plano_id, numero, mes, fase, pilar, versiculo, objetivo)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          planoId,
          n,
          Math.ceil(n / 4),
          fase,
          pilar,
          semana.versiculo ?? null,
          semana.objetivo,
        ]
      );

      const semanaId = semanaResult.rows[0]!.id;

      for (const tarefa of semana.tarefas) {
        await client.query(
          `INSERT INTO tarefas_semana (semana_id, descricao, prioridade, acao_codigo)
           VALUES ($1, $2, $3, $4)`,
          [semanaId, tarefa.descricao, tarefa.prioridade, tarefa.acao_codigo ?? null]
        );
      }

      // Gate: semana 1 = available, resto = locked
      await client.query(
        `INSERT INTO gates_semanais (user_id, semana_id, semana_numero, gate_status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, semana_id) DO NOTHING`,
        [userId, semanaId, n, n === 1 ? 'available' : 'locked']
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return { planoId };
}
