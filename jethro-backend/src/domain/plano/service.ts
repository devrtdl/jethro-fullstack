import type Anthropic from '@anthropic-ai/sdk';

import { getDbPool } from '../../lib/db.js';
import { getAnthropicClient } from '../../lib/anthropic.js';
import { loadAlmaContent } from '../../lib/alma-loader.js';
import { filterAlmaForModel, type AcaoAlma } from '../../lib/alma-filter.js';
import { AppError } from '../../lib/errors.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS_INITIAL = 8000;
const MAX_TOKENS_SEMANA = 4000;
const ALMA_VERSION = 'v5.14-doc5-v2';
const INPUT_COST_PER_MILLION_USD = 3;
const OUTPUT_COST_PER_MILLION_USD = 15;

const FASES: Record<number, string> = {
  1: 'fundamento', 2: 'fundamento', 3: 'fundamento', 4: 'fundamento', 5: 'fundamento',
  6: 'estrutura', 7: 'estrutura', 8: 'estrutura', 9: 'estrutura', 10: 'estrutura',
  11: 'controlo', 12: 'controlo', 13: 'controlo', 14: 'controlo', 15: 'controlo',
  16: 'crescimento', 17: 'crescimento', 18: 'crescimento', 19: 'crescimento', 20: 'crescimento',
  21: 'legado', 22: 'legado', 23: 'legado', 24: 'legado',
};

const TAGS_POR_SEMANA: Record<number, string> = {
  1: 'Fundamento', 2: 'Fundamento', 3: 'Fundamento', 4: 'Fundamento', 5: 'Fundamento',
  6: 'Estrutura', 7: 'Estrutura', 8: 'Estrutura', 9: 'Estrutura', 10: 'Estrutura',
  11: 'Controlo', 12: 'Controlo', 13: 'Controlo', 14: 'Controlo', 15: 'Controlo',
  16: 'Crescimento', 17: 'Crescimento', 18: 'Crescimento', 19: 'Crescimento', 20: 'Crescimento',
  21: 'Legado', 22: 'Legado', 23: 'Legado', 24: 'Legado',
};

const BLOCOS_POR_MODELO: Record<string, string[]> = {
  D: ['Estancar e Diagnosticar', 'Reorganizar Finanças', 'Controlar e Corrigir', 'Reconstruir com Base', 'Sustentabilidade e Governo'],
  E: ['Definir e Validar', 'Construir a Oferta', 'Primeiros Clientes', 'Escalar com Método', 'Consistência e Governo'],
  C: ['Diagnóstico de Valor', 'Posicionamento e Preço Justo', 'Controlo e Margem Real', 'Crescimento com Preço Correto', 'Autoridade e Legado'],
  F: ['Diagnóstico de Canal', 'Estrutura Comercial', 'Diversificação e Controlo', 'Motor de Aquisição', 'Governo e Multiplicação'],
  G: ['Diagnóstico Operacional', 'Processos e Delegação', 'Controlo e Padrão', 'Escala com Sistema', 'Governo e Autonomia'],
  H: ['Mapa de Centralização', 'Delegação Estruturada', 'Liderança e Indicadores', 'Crescimento sem Gargalo', 'Governo Pessoal e Legado'],
  B: ['Diagnóstico do Platô', 'Destravar o Crescimento', 'Novos Canais e Controlo', 'Expansão com Base', 'Consolidação e Legado'],
  X: ['Inventário de Alavancas', 'Blindagem Operacional', 'Escala Controlada', 'Multiplicação com Sistema', 'Governo e Próximo Nível'],
  A: ['Clareza e Prioridade', 'Organização Mínima', 'Controlo e Direção', 'Crescimento com Foco', 'Governo e Propósito'],
};

const BLOCOS_PADRAO = BLOCOS_POR_MODELO.A as [string, string, string, string, string];

const PILARES_POR_SEMANA: Record<number, string> = {
  1: 'P1', 2: 'P1', 3: 'P2', 4: 'P2', 5: 'P3', 6: 'P3',
  7: 'P4', 8: 'P4', 9: 'P5', 10: 'P5', 11: 'P6', 12: 'P6',
  13: 'P7', 14: 'P7', 15: 'P1', 16: 'P2', 17: 'P3', 18: 'P4',
  19: 'P5', 20: 'P6', 21: 'P7', 22: 'P1', 23: 'P2', 24: 'P7',
};

type SemanaOutline = {
  numero: number;
  bloco?: string;
  tag?: string;
  nome: string;
  objetivo: string;
};

type SemanaCompleta = {
  numero: number;
  bloco?: string;
  tag?: string;
  nome: string;
  objetivo: string;
  por_que_importa: string;
  versiculo: string | null;
  tarefas: Array<{
    descricao: string;
    prioridade: 'baixa' | 'media' | 'alta' | 'critica';
    recurso_biblioteca?: string | null;
  }>;
  indicador_conclusao: string;
  resultado_esperado: string;
};

type InitialPlanGerado = {
  semana_1: SemanaCompleta;
  semanas_restantes: SemanaOutline[];
};

type OnboardingRow = { id: string; modelo_confirmado: string; json_completo: Record<string, unknown> };
type TarefaPrioridade = 'baixa' | 'media' | 'alta' | 'critica';

function normalizePrioridade(value: unknown): TarefaPrioridade {
  const normalized = String(value ?? 'media')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

  if (normalized === 'baixa' || normalized === 'baixo') return 'baixa';
  if (normalized === 'media' || normalized === 'medio') return 'media';
  if (normalized === 'alta' || normalized === 'alto') return 'alta';
  if (normalized === 'critica' || normalized === 'critico' || normalized === 'urgente') return 'critica';
  return 'media';
}

async function recordAiUsage(
  userId: string,
  planoId: string,
  promptTipo: 'A' | 'B',
  semanaNumero: number | null,
  response: Anthropic.Messages.Message
): Promise<void> {
  const usage = response.usage;
  const inputTokens = usage.input_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
  const cacheCreationTokens = usage.cache_creation_input_tokens ?? 0;
  const custoEstimado =
    ((inputTokens + cacheCreationTokens) / 1_000_000) * INPUT_COST_PER_MILLION_USD +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION_USD;

  await getDbPool()
    .query(
      `INSERT INTO plano_ai_usage
         (user_id, plano_id, modelo, prompt_tipo, semana_numero, tokens_entrada,
          tokens_saida, cache_read_input_tokens, cache_creation_input_tokens, custo_estimado_usd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        planoId,
        MODEL,
        promptTipo,
        semanaNumero,
        inputTokens,
        outputTokens,
        cacheReadTokens,
        cacheCreationTokens,
        custoEstimado,
      ]
    )
    .catch((err) => {
      console.error('[recordAiUsage] failed:', err);
    });
}

function buildStudentContext(diagnosticModel: string, j: Record<string, unknown>): string {
  return JSON.stringify(
    {
      modelo_diagnostico: diagnosticModel,
      ...j,
    },
    null,
    2
  );
}

function blocoIndexForSemana(numero: number): number {
  if (numero <= 5) return 0;
  if (numero <= 10) return 1;
  if (numero <= 15) return 2;
  if (numero <= 20) return 3;
  return 4;
}

function blocoForSemana(modelo: string, numero: number): string {
  const blocos = (BLOCOS_POR_MODELO[modelo] ?? BLOCOS_PADRAO) as [string, string, string, string, string];
  return blocos[blocoIndexForSemana(numero)] ?? BLOCOS_PADRAO[0];
}

function tagForSemana(numero: number): string {
  return TAGS_POR_SEMANA[numero] ?? 'Fundamento';
}

function faseFromTag(tag: string | undefined, numero: number): string {
  const normalized = String(tag ?? tagForSemana(numero))
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  if (normalized.includes('estrutura')) return 'estrutura';
  if (normalized.includes('controlo') || normalized.includes('controle')) return 'controlo';
  if (normalized.includes('crescimento')) return 'crescimento';
  if (normalized.includes('legado')) return 'legado';
  if (normalized.includes('escala')) return numero >= 16 && numero <= 20 ? 'crescimento' : 'controlo';
  return FASES[numero] ?? 'fundamento';
}

function buildPlanSystemPrompt(): string {
  return `IDENTIDADE E PAPEL:
Você é o Jethro, mentor empresarial cristão criado pelo Rogério Teixeira com base no Método PBN (Princípios Bíblicos para Negócios). Você não é um assistente genérico. Você é o Rogério: fala como ele, pensa como ele, prescreve como ele. O tom é de mentor sênior: direto, cuidador, espiritual, sem rodeios e sem motivação vazia. A Palavra de Deus entra como sabedoria prática, nunca como julgamento moral.

REGRAS ABSOLUTAS:
1. Nunca inventar números. Use sempre o faturamento_medio_3m declarado no onboarding. Nunca recalcule faturamento multiplicando ticket_medio por clientes_ativos_total. Se faturamento_medio_3m = 0, adapte tarefas para registrar investimento e listar interessados.
2. Nunca use "aluno". Use sempre o nome do empreendedor ou "empreendedor".
3. Versículos fixos por bloco: Fundamento/S1-S5 = Provérbios 27:23; Estrutura/S6-S10 = Êxodo 18:17-18; Controlo/S11-S15 = Salmo 119:105; Crescimento/S16-S20 = Lucas 16:10; Legado/S21-S24 = Mateus 25:21.
4. Tags por bloco: S1-S5 = Fundamento; S6-S10 = Estrutura; S11-S15 = Controlo; S16-S20 = Crescimento; S21-S24 = Legado. Nunca use "Escala" para todas.
5. Regras condicionais obrigatórias: dividas_fornecedores > 0 ou dividas > 0 gera renegociação em S2/S3; inadimplencia = frequente gera cobrança em S2/S3; dependencia_plataforma alta gera risco em S1 e diversificação antes da S10; Q18 modelo D/E + empreendedor solo gera carga horária antes do bloco 4; concentracao_receita alta gera mitigação em S3/S4.
6. S1 específica por modelo: D = sangramento; E = ponto de partida; C = gap de preço; F = dependência de canal; G = dependência operacional; H = centralização; B = platô; X = alavancas; A = priorização de caos.
7. Use os nomes de blocos personalizados por modelo informados no prompt do usuário.
8. Se ticket_medio = 0, não use como base de cálculo. A tarefa deve definir quanto cobrar pelo primeiro pacote.
9. Referencie materiais da Biblioteca no campo recurso_biblioteca em cada tarefa, usando T01-T12 ou materiais específicos do modelo quando fizer sentido.
10. AÇÕES E METÁFORAS DA ALMA (consultar primeiro, nunca ignorar)
A seção "AÇÕES ALMA PRIORIZADAS" contém ações escritas pelo mentor Rogério Teixeira, pré-selecionadas para este modelo. A seção "METÁFORAS ALMA" contém metáforas bíblicas e empresariais curadas pelo mentor.
FLUXO OBRIGATÓRIO para cada tarefa do plano:
PASSO 1: Verificar se existe ação em "AÇÕES ALMA PRIORIZADAS" que corresponda à necessidade da semana. Se existir — usar a descrição e linguagem da ação como base, personalizando com os dados do empreendedor.
PASSO 2: Independente de ter encontrado ação ou não, verificar "METÁFORAS ALMA" e incluir metáforas relevantes no campo por_que_importa ou na descrição das tarefas.
PASSO 3: SOMENTE se "AÇÕES ALMA PRIORIZADAS" não contiver NENHUMA ação relevante (0 ações) E "METÁFORAS ALMA" não contiver NENHUMA metáfora aplicável (0 metáforas) — a IA cria ações e linguagem próprias, mantendo o tom do mentor.
REGRAS DA ALMA: NUNCA substituir uma ação da Alma por versão genérica. NUNCA ignorar as ações priorizadas se contiverem ações relevantes. Metáforas da Alma TÊM PRIORIDADE sobre metáforas inventadas. Quando a IA criar ação nova, manter o mesmo nível de concretude e tom das ações da Alma. A Alma NÃO é limitante — a IA pode e deve criar ações novas quando necessário, mas SEMPRE consultando a Alma primeiro.

TOM:
Direto, cuidador, espiritual. Use "a gente" nas partes conversacionais. Celebre antes de corrigir. Números primeiro.`;
}

function buildRemainingWeeksExample(diagnosticModel: string): string {
  return Array.from({ length: 23 }, (_, index) => {
    const numero = index + 2;
    return `    { "numero": ${numero}, "bloco": "${blocoForSemana(diagnosticModel, numero)}", "tag": "${tagForSemana(numero)}", "nome": "Nome da semana ${numero}", "objetivo": "Objetivo da semana ${numero}" }`;
  }).join(',\n');
}

function buildInitialPlanPrompt(
  diagnosticModel: string,
  onboardingJson: Record<string, unknown>,
  acoes: AcaoAlma[],
  metaforas: string[]
): string {
  const ctx = buildStudentContext(diagnosticModel, onboardingJson);
  const blocos = (BLOCOS_POR_MODELO[diagnosticModel] ?? BLOCOS_PADRAO) as [string, string, string, string, string];

  const acoesAlmaBlock = acoes.length > 0
    ? `\nAÇÕES ALMA PRIORIZADAS (distribua ao longo do plano):\n${acoes.map((a) => `• [${a.codigo}] ${a.nome}: ${a.descricao}`).join('\n')}\n`
    : '';

  const metaforasAlmaBlock = metaforas.length > 0
    ? `\nMETÁFORAS ALMA (use pelo menos uma no plano):\n${metaforas.map((m) => `• ${m}`).join('\n')}\n`
    : '';

  return `TAREFA:
Gerar a estrutura completa do Plano de Ação de 24 semanas com base no diagnóstico e onboarding do empreendedor. A Semana 1 deve ser gerada completa. As Semanas 2 a 24 devem ser geradas apenas com número, bloco, tag, nome da semana e objetivo estratégico.

CONTEXTO DO EMPREENDEDOR:
${ctx}

BLOCOS PERSONALIZADOS DO MODELO ${diagnosticModel}:
1. ${blocos[0]} (S1-S5, tag Fundamento)
2. ${blocos[1]} (S6-S10, tag Estrutura)
3. ${blocos[2]} (S11-S15, tag Controlo)
4. ${blocos[3]} (S16-S20, tag Crescimento)
5. ${blocos[4]} (S21-S24, tag Legado)
${acoesAlmaBlock}${metaforasAlmaBlock}
FORMATO DE SAÍDA (JSON puro, sem markdown, sem texto antes ou depois):
{
  "semana_1": {
    "numero": 1,
    "bloco": "${blocoForSemana(diagnosticModel, 1)}",
    "tag": "Fundamento",
    "nome": "Nome da semana",
    "objetivo": "1 frase estratégica e específica",
    "por_que_importa": "Parágrafo explicando a lógica estratégica desta etapa",
    "versiculo": "Provérbios 27:23 — texto do versículo",
    "tarefas": [
      { "descricao": "Tarefa concreta e mensurável", "prioridade": "alta", "recurso_biblioteca": "T01" }
    ],
    "indicador_conclusao": "Como saber praticamente se a semana foi cumprida",
    "resultado_esperado": "Ganho concreto gerado ao final da execução"
  },
  "semanas_restantes": [
${buildRemainingWeeksExample(diagnosticModel)}
  ]
}`;
}

function buildSemanaFullPrompt(
  semanaNumero: number,
  semanaBloco: string,
  semanaTag: string,
  semanaNome: string,
  semanaObjetivo: string,
  diagnosticModel: string,
  onboardingJson: Record<string, unknown>,
  todasSemanas: SemanaOutline[],
  acoes: AcaoAlma[],
  metaforas: string[]
): string {
  const ctx = buildStudentContext(diagnosticModel, onboardingJson);

  const outlineText = todasSemanas
    .map((s) => `Semana ${s.numero}: bloco="${s.bloco ?? blocoForSemana(diagnosticModel, s.numero)}"; tag="${s.tag ?? tagForSemana(s.numero)}"; nome="${s.nome}" — ${s.objetivo}`)
    .join('\n');
  const semana = {
    numero: semanaNumero,
    bloco: semanaBloco,
    tag: semanaTag,
    nome: semanaNome,
    objetivo: semanaObjetivo,
  };

  const acoesAlmaBlock = acoes.length > 0
    ? `\nAÇÕES ALMA DISPONÍVEIS PARA ESTA SEMANA (use as relevantes para o contexto):\n${acoes.map((a) => `• [${a.codigo}] ${a.nome}: ${a.descricao}`).join('\n')}\n`
    : '';

  const metaforasAlmaBlock = metaforas.length > 0
    ? `\nMETÁFORAS ALMA (use se enriquecer a lógica da semana):\n${metaforas.map((m) => `• ${m}`).join('\n')}\n`
    : '';

  return `TAREFA:
Gerar o conteúdo completo de UMA semana do Plano de Ação.

CONTEXTO DO EMPREENDEDOR:
${ctx}

VISÃO GERAL DO PLANO (24 semanas):
${outlineText}

SEMANA A GERAR:
${JSON.stringify(semana, null, 2)}
${acoesAlmaBlock}${metaforasAlmaBlock}
Gere o conteúdo completo desta semana, mantendo coerência com o contexto do empreendedor e com as semanas anteriores e seguintes do plano.

REGRAS:
1. Use dados declarados: faturamento_medio_3m, custo_fixo_mensal, ticket_medio, clientes_ativos_total. Se faturamento_medio_3m = 0, adapte para pré-receita.
2. Use nome do empreendedor, nunca "aluno".
3. Use o versículo fixo do bloco: Fundamento = Provérbios 27:23; Estrutura = Êxodo 18:17-18; Controlo = Salmo 119:105; Crescimento = Lucas 16:10; Legado = Mateus 25:21.
4. Respeite dados condicionais: dívidas, inadimplência, plataforma, carga horária e concentração.
5. Referencie materiais da Biblioteca no campo recurso_biblioteca.
6. Tarefas concretas, aplicáveis e mensuráveis (2 a 4 tarefas). Prioridades: baixa / media / alta / critica.
7. Celebre progresso antes de prescrever.

FORMATO DE SAÍDA (JSON puro, sem markdown, sem texto antes ou depois):
{
  "numero": ${semanaNumero},
  "bloco": "${semana.bloco}",
  "tag": "${semana.tag}",
  "nome": "nome da semana",
  "objetivo": "objetivo da semana",
  "por_que_importa": "Parágrafo explicando a lógica estratégica desta etapa",
  "versiculo": "Livro X:Y — texto do versículo fixo do bloco",
  "tarefas": [
    { "descricao": "Tarefa concreta e mensurável", "prioridade": "alta", "recurso_biblioteca": "T01" }
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
      `SELECT id, status FROM planos_acao
       WHERE user_id = $1 AND onboarding_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [userId, onboardingRow.id]
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

  const onboardingRow = await pool
    .query<{ id: string }>(
      `SELECT id FROM onboarding_sessions
       WHERE user_id = $1 AND status = 'completed'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    )
    .then((r) => r.rows[0] ?? null);

  if (!onboardingRow) return { status: 'not_started' };

  const row = await pool
    .query<{ id: string; status: string; error_message: string | null }>(
      `SELECT id, status, error_message FROM planos_acao
       WHERE user_id = $1 AND onboarding_id = $2
       ORDER BY created_at DESC LIMIT 1`,
      [userId, onboardingRow.id]
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
    .query<{ numero: number; plano_id: string; bloco: string | null; tag: string | null; nome: string | null; objetivo: string }>(
      `SELECT numero, plano_id, bloco, tag, nome, objetivo FROM semanas WHERE id = $1`,
      [semanaId]
    )
    .then((r) => r.rows[0] ?? null);

  if (!semanaRow) return;

  const planoRow = await pool
    .query<{ user_id: string; modelo: string; onboarding_id: string }>(
      `SELECT user_id, modelo, onboarding_id FROM planos_acao WHERE id = $1`,
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
    .query<{ numero: number; bloco: string | null; tag: string | null; nome: string | null; objetivo: string }>(
      `SELECT numero, bloco, tag, nome, objetivo FROM semanas WHERE plano_id = $1 ORDER BY numero ASC`,
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
    { type: 'text', text: buildPlanSystemPrompt() },
  ];
  (systemBlocks[0] as unknown as { cache_control: { type: string } }).cache_control = { type: 'ephemeral' };

  const outlines: SemanaOutline[] = todasSemanas.map((s) => ({
    numero: s.numero,
    bloco: s.bloco ?? blocoForSemana(planoRow.modelo, s.numero),
    tag: s.tag ?? tagForSemana(s.numero),
    nome: s.nome ?? '',
    objetivo: s.objetivo,
  }));

  const { acoes: acoesB, metaforas: metaforasB } = filterAlmaForModel(planoRow.modelo, onbRow.json_completo);

  const prompt = buildSemanaFullPrompt(
    semanaRow.numero,
    semanaRow.bloco ?? blocoForSemana(planoRow.modelo, semanaRow.numero),
    semanaRow.tag ?? tagForSemana(semanaRow.numero),
    semanaRow.nome ?? '',
    semanaRow.objetivo,
    planoRow.modelo,
    onbRow.json_completo,
    outlines,
    acoesB,
    metaforasB
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
  await recordAiUsage(planoRow.user_id, semanaRow.plano_id, 'B', semanaRow.numero, response);

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
       SET bloco = $1, tag = $2, fase = $3, por_que_importa = $4, versiculo = $5,
           indicador_conclusao = $6, resultado_esperado = $7, conteudo_completo = true
       WHERE id = $8`,
      [
        semanaGerada.bloco ?? semanaRow.bloco ?? blocoForSemana(planoRow.modelo, semanaRow.numero),
        semanaGerada.tag ?? semanaRow.tag ?? tagForSemana(semanaRow.numero),
        faseFromTag(semanaGerada.tag ?? semanaRow.tag ?? undefined, semanaRow.numero),
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
        `INSERT INTO tarefas_semana (semana_id, descricao, prioridade, acao_codigo, recurso_biblioteca)
         VALUES ($1, $2, $3, $4, $5)`,
        [semanaId, tarefa.descricao, normalizePrioridade(tarefa.prioridade), null, tarefa.recurso_biblioteca ?? null]
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
    { type: 'text', text: buildPlanSystemPrompt() },
  ];
  (systemBlocks[0] as unknown as { cache_control: { type: string } }).cache_control = { type: 'ephemeral' };

  const { acoes: acoesA, metaforas: metaforasA } = filterAlmaForModel(diagnosticModel, onboardingJson as Record<string, unknown>);
  const prompt = buildInitialPlanPrompt(diagnosticModel, onboardingJson as Record<string, unknown>, acoesA, metaforasA);

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
  await recordAiUsage(userId, planoId, 'A', null, response);

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
      `INSERT INTO semanas (plano_id, numero, mes, fase, pilar, bloco, tag, versiculo, objetivo, nome, por_que_importa, indicador_conclusao, resultado_esperado, conteudo_completo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true) RETURNING id`,
      [
        planoId, 1, 1,
        faseFromTag(s1.tag, 1),
        PILARES_POR_SEMANA[1] ?? 'P1',
        s1.bloco ?? blocoForSemana(diagnosticModel, 1),
        s1.tag ?? tagForSemana(1),
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
        `INSERT INTO tarefas_semana (semana_id, descricao, prioridade, acao_codigo, recurso_biblioteca)
         VALUES ($1, $2, $3, $4, $5)`,
        [semana1Id, tarefa.descricao, normalizePrioridade(tarefa.prioridade), null, tarefa.recurso_biblioteca ?? null]
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
      const fase = faseFromTag(outline.tag, n);
      const pilar = PILARES_POR_SEMANA[n] ?? 'P1';
      const bloco = outline.bloco ?? blocoForSemana(diagnosticModel, n);
      const tag = outline.tag ?? tagForSemana(n);

      const semanaResult = await client.query<{ id: string }>(
        `INSERT INTO semanas (plano_id, numero, mes, fase, pilar, bloco, tag, objetivo, nome, conteudo_completo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false) RETURNING id`,
        [planoId, n, Math.ceil(n / 4), fase, pilar, bloco, tag, outline.objetivo, outline.nome ?? null]
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
