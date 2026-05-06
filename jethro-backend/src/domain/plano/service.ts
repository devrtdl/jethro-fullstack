import type Anthropic from '@anthropic-ai/sdk';

import { getDbPool } from '../../lib/db.js';
import { getAnthropicClient } from '../../lib/anthropic.js';
import { loadAlmaContent } from '../../lib/alma-loader.js';
import { AppError } from '../../lib/errors.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS_INITIAL = 8000;
const MAX_TOKENS_SEMANA = 4000;
const ALMA_VERSION = 'v5.14';

const FASES: Record<number, string> = {
  1: 'fundamento', 2: 'fundamento', 3: 'fundamento', 4: 'fundamento', 5: 'fundamento',
  6: 'estrutura', 7: 'estrutura', 8: 'estrutura', 9: 'estrutura', 10: 'estrutura',
  11: 'escala', 12: 'escala', 13: 'escala', 14: 'escala', 15: 'escala',
  16: 'escala', 17: 'escala', 18: 'escala', 19: 'escala', 20: 'escala',
  21: 'legado', 22: 'legado', 23: 'legado', 24: 'legado',
};

const PILARES_POR_SEMANA: Record<number, string> = {
  1: 'P1', 2: 'P1', 3: 'P2', 4: 'P2', 5: 'P3', 6: 'P3',
  7: 'P4', 8: 'P4', 9: 'P5', 10: 'P5', 11: 'P6', 12: 'P6',
  13: 'P7', 14: 'P7', 15: 'P1', 16: 'P2', 17: 'P3', 18: 'P4',
  19: 'P5', 20: 'P6', 21: 'P7', 22: 'P1', 23: 'P2', 24: 'P7',
};

type SemanaOutline = {
  numero: number;
  nome: string;
  objetivo: string;
};

type SemanaCompleta = {
  numero: number;
  nome: string;
  objetivo: string;
  por_que_importa: string;
  versiculo: string | null;
  tarefas: Array<{
    descricao: string;
    prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  }>;
  indicador_conclusao: string;
  resultado_esperado: string;
};

type InitialPlanGerado = {
  semana_1: SemanaCompleta;
  semanas_restantes: SemanaOutline[];
};

type OnboardingRow = { id: string; modelo_confirmado: string; json_completo: Record<string, unknown> };

function buildStudentContext(diagnosticModel: string, j: Record<string, unknown>): string {
  const segmento     = j['area_negocio']            ?? 'Não informado';
  const equipa       = j['equipa']                  ?? 'Não informado';
  const tempoNeg     = j['tempo_negocio']           ?? 'Não informado';
  const meta         = j['meta_6_meses']            ?? 'Não informado';
  const problema     = j['maior_problema_percebido'] ?? '';
  const jaTentou     = j['ja_tentou']               ?? '';
  const impacto      = j['impacto_pessoal']         ?? '';
  const dores        = [problema, jaTentou, impacto].filter(Boolean).join(' | ') || 'Não informado';
  const ticket       = j['ticket_medio']            ? `Ticket médio: R$${j['ticket_medio']}` : '';
  const clientes     = j['clientes_ativos_total']   ? `Clientes activos: ${j['clientes_ativos_total']}` : '';
  const custoFixo    = j['custo_fixo_mensal']       ? `Custo fixo mensal: R$${j['custo_fixo_mensal']}` : '';
  const margem       = j['margem_estimada_pct']     ? `Margem estimada: ${j['margem_estimada_pct']}%` : '';
  const faturamento  = [ticket, clientes, custoFixo, margem].filter(Boolean).join(' | ') || 'Não informado';
  const canal        = j['canal_principal']         ?? '';
  const objeccao     = j['objeccao_principal']      ?? '';
  const observacoes  = [canal && `Canal principal: ${canal}`, objeccao && `Objecção principal: ${objeccao}`]
    .filter(Boolean).join(' | ') || 'Não informado';

  return `DADOS DO ALUNO:
Segmento: ${segmento}
Faturamento actual: ${faturamento}
Tamanho da equipa: ${equipa}
Momento do negócio: ${tempoNeg}
Principais dores: ${dores}
Objetivos: ${meta}
Modelo de diagnóstico: ${diagnosticModel}
Observações relevantes: ${observacoes}`;
}

function buildInitialPlanPrompt(
  diagnosticModel: string,
  onboardingJson: Record<string, unknown>
): string {
  const ctx = buildStudentContext(diagnosticModel, onboardingJson);

  return `TAREFA:
Criar um Plano de Ação Estratégico de 24 semanas para um aluno de mentoria empresarial, com base no diagnóstico realizado, nas informações do negócio, nos problemas declarados e no contexto real do aluno.

${ctx}

OBJETIVO DO PLANO:
O plano não deve ser motivacional, genérico ou teórico. Ele deve funcionar como um mapa prático de transformação do negócio e da liderança do aluno, conduzindo-o de desorganização, inconsistência ou estagnação para clareza, estrutura, execução, crescimento e governo.

CONTEXTO DE ENTRADA:
Considere obrigatoriamente os seguintes elementos para personalizar o plano:
- Modelo de diagnóstico do aluno
- Problemas declarados
- Momento actual do negócio
- Faturamento/receita
- Equipa actual
- Gargalos operacionais, comerciais, financeiros ou de liderança
- Objectivos desejados pelo aluno
- Grau de maturidade do negócio
- Capacidade real de execução do aluno

LÓGICA DA JORNADA DAS 24 SEMANAS:

BLOCO 1 — DIRECÇÃO E FUNDAMENTO (Semanas 1 a 5)
Foco: clareza do momento actual, diagnóstico, visão, posicionamento, propósito, prioridades, primeiros ajustes urgentes

BLOCO 2 — ESTRUTURA E ORGANIZAÇÃO (Semanas 6 a 10)
Foco: organização da operação, processos básicos, rotina mínima de gestão, papéis e responsabilidades, agenda do líder

BLOCO 3 — CONTROLO E CORRECÇÃO (Semanas 11 a 15)
Foco: clareza financeira, indicadores, análise de números, identificação de desperdícios, correcções comerciais/operacionais, decisão baseada em dados

BLOCO 4 — CRESCIMENTO E MULTIPLICAÇÃO (Semanas 16 a 20)
Foco: aumento de capacidade, melhoria comercial, produtividade, expansão com base sólida, rentabilidade, experiência do cliente

BLOCO 5 — GOVERNO, CONSOLIDAÇÃO E LEGADO (Semanas 21 a 24)
Foco: liderança madura, cultura, consistência, autonomia da equipa, visão de longo prazo, sustentabilidade, impacto e legado

REGRAS DE PROGRESSÃO:
- O plano deve mostrar progressão lógica entre semanas — uma semana prepara a próxima
- Antes de escalar, estruture. Antes de estruturar, clarifique. Antes de delegar, organize. Antes de crescer, controle

REGRAS DE QUALIDADE:
- O plano deve parecer feito sob medida para este aluno, não um modelo pronto reciclado
- Não use linguagem vaga, abstracta ou excessivamente espiritualizada
- O tom deve ser estratégico, claro, firme e aplicável
- As tarefas devem respeitar a realidade e o tamanho actual do negócio
- O plano deve corrigir causas-raiz, não apenas sintomas

FORMATO DE SAÍDA (JSON puro, sem markdown, sem texto antes ou depois):
- Semana 1: conteúdo COMPLETO (todos os campos abaixo)
- Semanas 2 a 24: apenas { numero, nome, objetivo }

{
  "semana_1": {
    "numero": 1,
    "nome": "Nome da semana",
    "objetivo": "1 frase estratégica e específica",
    "por_que_importa": "Parágrafo explicando a lógica estratégica desta etapa",
    "versiculo": "Livro X:Y — texto do versículo",
    "tarefas": [
      { "descricao": "Tarefa concreta e mensurável", "prioridade": "alta" }
    ],
    "indicador_conclusao": "Como saber praticamente se a semana foi cumprida",
    "resultado_esperado": "Ganho concreto gerado ao final da execução"
  },
  "semanas_restantes": [
    { "numero": 2, "nome": "Nome da semana 2", "objetivo": "Objectivo da semana 2" },
    { "numero": 3, "nome": "Nome da semana 3", "objetivo": "Objectivo da semana 3" },
    ...
    { "numero": 24, "nome": "Nome da semana 24", "objetivo": "Objectivo da semana 24" }
  ]
}`;
}

function buildSemanaFullPrompt(
  semanaNumero: number,
  semanaNome: string,
  semanaObjetivo: string,
  diagnosticModel: string,
  onboardingJson: Record<string, unknown>,
  todasSemanas: SemanaOutline[]
): string {
  const ctx = buildStudentContext(diagnosticModel, onboardingJson);

  const outlineText = todasSemanas
    .map((s) => `Semana ${s.numero}: "${s.nome}" — ${s.objetivo}`)
    .join('\n');

  return `TAREFA:
Expandir a Semana ${semanaNumero} do Plano de Ação Estratégico de 24 semanas do aluno abaixo.

${ctx}

VISÃO GERAL DO PLANO (24 semanas):
${outlineText}

SEMANA A EXPANDIR: Semana ${semanaNumero} — "${semanaNome}"
Objectivo: ${semanaObjetivo}

Gera o conteúdo completo desta semana, mantendo coerência com o contexto do aluno e com as semanas anteriores e seguintes do plano.

REGRAS:
- Tarefas concretas, aplicáveis e mensuráveis (2 a 4 tarefas)
- Prioridades: baixa / media / alta / critica
- Versículo bíblico que reforce a direcção estratégica desta etapa
- Indicador de conclusão prático e verificável
- Resultado esperado em 1 frase com ganho concreto

FORMATO DE SAÍDA (JSON puro, sem markdown, sem texto antes ou depois):
{
  "numero": ${semanaNumero},
  "nome": "nome da semana",
  "objetivo": "objectivo da semana",
  "por_que_importa": "Parágrafo explicando a lógica estratégica desta etapa",
  "versiculo": "Livro X:Y — texto do versículo",
  "tarefas": [
    { "descricao": "Tarefa concreta e mensurável", "prioridade": "alta" }
  ],
  "indicador_conclusao": "Como saber praticamente se a semana foi cumprida",
  "resultado_esperado": "Ganho concreto gerado ao final da execução"
}`;
}

// ── Inicia a geração (retorna imediatamente) ──────────────────────────────
export async function initiateGeneratePlano(
  userId: string
): Promise<{ status: 'generating' | 'ready'; planoId: string }> {
  const pool = getDbPool();

  const onboardingRow = await pool
    .query<OnboardingRow>(
      `SELECT id, modelo_confirmado, json_completo
       FROM onboarding_sessions WHERE user_id = $1 AND status = 'completed'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    )
    .then((r) => r.rows[0] ?? null);

  if (!onboardingRow) {
    throw new AppError('Onboarding não concluído.', 400, 'ONBOARDING_REQUIRED');
  }

  const existing = await pool
    .query<{ id: string; status: string }>(
      `SELECT id, status FROM planos_acao WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    )
    .then((r) => r.rows[0] ?? null);

  if (existing?.status === 'ready') return { status: 'ready', planoId: existing.id };
  if (existing?.status === 'generating') return { status: 'generating', planoId: existing.id };

  if (existing?.status === 'error') {
    await pool.query('DELETE FROM planos_acao WHERE id = $1', [existing.id]);
  }

  const planoResult = await pool
    .query<{ id: string }>(
      `INSERT INTO planos_acao
         (user_id, onboarding_id, modelo, versao_alma, documento_1, documento_2, status)
       VALUES ($1, $2, $3, $4, '{}'::jsonb, '{}'::jsonb, 'generating')
       RETURNING id`,
      [userId, onboardingRow.id, onboardingRow.modelo_confirmado, ALMA_VERSION]
    )
    .then((r) => r.rows[0]!);

  void runGeneratePlanoBackground(userId, planoResult.id, onboardingRow);

  return { status: 'generating', planoId: planoResult.id };
}

// ── Retorna o status atual do plano ──────────────────────────────────────
export async function getPlanoStatus(
  userId: string
): Promise<{ status: 'not_started' | 'generating' | 'ready' | 'error'; planoId?: string; error?: string }> {
  const pool = getDbPool();
  const row = await pool
    .query<{ id: string; status: string; error_message: string | null }>(
      `SELECT id, status, error_message FROM planos_acao WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    )
    .then((r) => r.rows[0] ?? null);

  if (!row) return { status: 'not_started' };

  return {
    status: row.status as 'generating' | 'ready' | 'error',
    planoId: row.status === 'ready' ? row.id : undefined,
    error: row.error_message ?? undefined,
  };
}

// ── Expande uma semana específica com conteúdo completo ───────────────────
export async function generateSemanaCompleta(semanaId: string): Promise<void> {
  const pool = getDbPool();

  const semanaRow = await pool
    .query<{ numero: number; plano_id: string; nome: string | null; objetivo: string }>(
      `SELECT numero, plano_id, nome, objetivo FROM semanas WHERE id = $1`,
      [semanaId]
    )
    .then((r) => r.rows[0] ?? null);

  if (!semanaRow) return;

  const planoRow = await pool
    .query<{ modelo: string; onboarding_id: string }>(
      `SELECT modelo, onboarding_id FROM planos_acao WHERE id = $1`,
      [semanaRow.plano_id]
    )
    .then((r) => r.rows[0] ?? null);

  if (!planoRow) return;

  const onbRow = await pool
    .query<{ json_completo: Record<string, unknown> }>(
      `SELECT json_completo FROM onboarding_sessions WHERE id = $1`,
      [planoRow.onboarding_id]
    )
    .then((r) => r.rows[0] ?? null);

  if (!onbRow) return;

  const todasSemanas = await pool
    .query<{ numero: number; nome: string | null; objetivo: string }>(
      `SELECT numero, nome, objetivo FROM semanas WHERE plano_id = $1 ORDER BY numero ASC`,
      [semanaRow.plano_id]
    )
    .then((r) => r.rows);

  let alma: string;
  try {
    alma = loadAlmaContent();
  } catch (err) {
    console.error(`[generateSemanaCompleta] ALMA load error for semana ${semanaId}:`, err);
    return;
  }

  const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
    { type: 'text', text: alma },
    { type: 'text', text: 'Você é o Jethro, mentor do Programa Bases do Negócio (PBN). Gere conteúdo estratégico, prático e espiritual para empresários cristãos.' },
  ];
  (systemBlocks[0] as unknown as { cache_control: { type: string } }).cache_control = { type: 'ephemeral' };

  const outlines: SemanaOutline[] = todasSemanas.map((s) => ({
    numero: s.numero,
    nome: s.nome ?? '',
    objetivo: s.objetivo,
  }));

  const prompt = buildSemanaFullPrompt(
    semanaRow.numero,
    semanaRow.nome ?? '',
    semanaRow.objetivo,
    planoRow.modelo,
    onbRow.json_completo,
    outlines
  );

  let response: Anthropic.Messages.Message;
  try {
    response = await getAnthropicClient().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS_SEMANA,
      system: systemBlocks,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    console.error(`[generateSemanaCompleta] AI call error for semana ${semanaId}:`, err);
    return;
  }

  const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '';

  let semanaGerada: SemanaCompleta;
  try {
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    semanaGerada = JSON.parse(cleaned) as SemanaCompleta;
  } catch {
    console.error(`[generateSemanaCompleta] JSON parse error for semana ${semanaId}:`, rawText.slice(0, 300));
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE semanas
       SET por_que_importa = $1, versiculo = $2, indicador_conclusao = $3, resultado_esperado = $4, conteudo_completo = true
       WHERE id = $5`,
      [
        semanaGerada.por_que_importa ?? null,
        semanaGerada.versiculo ?? null,
        semanaGerada.indicador_conclusao ?? null,
        semanaGerada.resultado_esperado ?? null,
        semanaId,
      ]
    );

    await client.query(`DELETE FROM tarefas_semana WHERE semana_id = $1`, [semanaId]);

    for (const tarefa of semanaGerada.tarefas ?? []) {
      await client.query(
        `INSERT INTO tarefas_semana (semana_id, descricao, prioridade, acao_codigo)
         VALUES ($1, $2, $3, $4)`,
        [semanaId, tarefa.descricao, tarefa.prioridade, null]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`[generateSemanaCompleta] DB error for semana ${semanaId}:`, err);
  } finally {
    client.release();
  }
}

// ── Geração inicial — corre em background ────────────────────────────────
async function runGeneratePlanoBackground(
  userId: string,
  planoId: string,
  onboardingRow: OnboardingRow
): Promise<void> {
  const pool = getDbPool();

  const markError = async (msg: string) => {
    await pool
      .query(`UPDATE planos_acao SET status = 'error', error_message = $1 WHERE id = $2`, [msg, planoId])
      .catch(() => {});
  };

  const { modelo_confirmado: diagnosticModel, json_completo: onboardingJson } = onboardingRow;

  let alma: string;
  try {
    alma = loadAlmaContent();
  } catch (err) {
    await markError(`Conteúdo ALMA não encontrado: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
    { type: 'text', text: alma },
    { type: 'text', text: 'Você é o Jethro, mentor do Programa Bases do Negócio (PBN). Gere planos de acção estruturados, práticos e espirituais para empresários cristãos.' },
  ];
  (systemBlocks[0] as unknown as { cache_control: { type: string } }).cache_control = { type: 'ephemeral' };

  const prompt = buildInitialPlanPrompt(diagnosticModel, onboardingJson as Record<string, unknown>);

  let response: Anthropic.Messages.Message;
  try {
    response = await getAnthropicClient().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS_INITIAL,
      system: systemBlocks,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    await markError(`Erro na chamada ao modelo de IA: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  const rawText = response.content[0]?.type === 'text' ? response.content[0].text : '';

  let planoGerado: InitialPlanGerado;
  try {
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    planoGerado = JSON.parse(cleaned) as InitialPlanGerado;
  } catch {
    await markError('Erro ao interpretar resposta da IA (JSON inválido).');
    return;
  }

  const s1 = planoGerado.semana_1;
  const restantes = planoGerado.semanas_restantes;

  if (!s1 || typeof s1.objetivo !== 'string') {
    await markError('Semana 1 ausente ou inválida na resposta da IA.');
    return;
  }
  if (!Array.isArray(restantes) || restantes.length !== 23) {
    await markError(`Número inválido de semanas restantes: ${restantes?.length ?? 0} (esperado 23)`);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Semana 1 — conteúdo completo
    const s1Result = await client.query<{ id: string }>(
      `INSERT INTO semanas (plano_id, numero, mes, fase, pilar, versiculo, objetivo, nome, por_que_importa, indicador_conclusao, resultado_esperado, conteudo_completo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true) RETURNING id`,
      [
        planoId, 1, 1,
        FASES[1] ?? 'fundamento',
        PILARES_POR_SEMANA[1] ?? 'P1',
        s1.versiculo ?? null,
        s1.objetivo,
        s1.nome ?? null,
        s1.por_que_importa ?? null,
        s1.indicador_conclusao ?? null,
        s1.resultado_esperado ?? null,
      ]
    );
    const semana1Id = s1Result.rows[0]!.id;

    for (const tarefa of s1.tarefas ?? []) {
      await client.query(
        `INSERT INTO tarefas_semana (semana_id, descricao, prioridade, acao_codigo)
         VALUES ($1, $2, $3, $4)`,
        [semana1Id, tarefa.descricao, tarefa.prioridade, null]
      );
    }

    await client.query(
      `INSERT INTO gates_semanais (user_id, semana_id, semana_numero, gate_status)
       VALUES ($1, $2, $3, 'available')
       ON CONFLICT (user_id, semana_id) DO NOTHING`,
      [userId, semana1Id, 1]
    );

    // Semanas 2-24 — apenas esboço
    for (const outline of restantes) {
      const n = outline.numero;
      const fase = FASES[n] ?? 'fundamento';
      const pilar = PILARES_POR_SEMANA[n] ?? 'P1';

      const semanaResult = await client.query<{ id: string }>(
        `INSERT INTO semanas (plano_id, numero, mes, fase, pilar, objetivo, nome, conteudo_completo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, false) RETURNING id`,
        [planoId, n, Math.ceil(n / 4), fase, pilar, outline.objetivo, outline.nome ?? null]
      );

      const semanaId = semanaResult.rows[0]!.id;

      await client.query(
        `INSERT INTO gates_semanais (user_id, semana_id, semana_numero, gate_status)
         VALUES ($1, $2, $3, 'locked')
         ON CONFLICT (user_id, semana_id) DO NOTHING`,
        [userId, semanaId, n]
      );
    }

    await client.query(
      `UPDATE planos_acao SET status = 'ready' WHERE id = $1`,
      [planoId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    await markError(`Erro ao persistir plano: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    client.release();
  }
}
