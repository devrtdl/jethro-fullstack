import type Anthropic from '@anthropic-ai/sdk';

import { getDbPool } from '../../lib/db.js';
import { getAnthropicClient } from '../../lib/anthropic.js';
import { loadAlmaContent } from '../../lib/alma-loader.js';
import { AppError } from '../../lib/errors.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 32000;
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

type SemanaGerada = {
  numero: number;
  nome: string;
  objetivo: string;
  por_que_importa: string;
  versiculo: string | null;
  tarefas: Array<{
    descricao: string;
    prioridade: 'baixa' | 'media' | 'alta' | 'critica';
    acao_codigo: string | null;
  }>;
  indicador_conclusao: string;
  resultado_esperado: string;
};

type PlanoGerado = {
  semanas: SemanaGerada[];
};

function buildPlanPrompt(
  diagnosticModel: string,
  onboardingJson: Record<string, unknown>
): string {
  const j = onboardingJson;

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

  return `TAREFA:
Criar um Plano de Ação Estratégico de 24 semanas para um aluno de mentoria empresarial, com base no diagnóstico realizado, nas informações do negócio, nos problemas declarados e no contexto real do aluno.

DADOS DO ALUNO:
Segmento: ${segmento}
Faturamento actual: ${faturamento}
Tamanho da equipa: ${equipa}
Momento do negócio: ${tempoNeg}
Principais dores: ${dores}
Objetivos: ${meta}
Modelo de diagnóstico: ${diagnosticModel}
Observações relevantes: ${observacoes}

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

ESTRUTURA OBRIGATÓRIA:
Gere exactamente 24 semanas. Cada semana deve conter:
1. Nome da semana
2. Objectivo estratégico da semana — 1 frase clara, específica e directa
3. Por que esta semana importa — 1 parágrafo explicando a lógica estratégica daquela etapa
4. Versículo bíblico — deve reforçar a direcção estratégica, não ser genérico ou forçado
5. Tarefas práticas — entre 2 e 4 tarefas concretas, aplicáveis e mensuráveis; nada genérico como "melhorar liderança" ou "crescer nas vendas"
6. Prioridade de cada tarefa — use apenas: baixa / media / alta / critica
7. Indicador de conclusão — como saber, de forma prática, se a semana foi cumprida
8. Resultado esperado — 1 frase mostrando o ganho concreto gerado ao final

REGRAS DE QUALIDADE:
- O plano deve parecer feito sob medida para este aluno, não um modelo pronto reciclado
- Não use linguagem vaga, abstracta ou excessivamente espiritualizada
- O tom deve ser estratégico, claro, firme e aplicável
- As tarefas devem respeitar a realidade e o tamanho actual do negócio
- Se o negócio for pequeno, não proponha estrutura de empresa grande
- Se houver baixa maturidade de gestão, comece pelo essencial antes de avançar
- O plano deve corrigir causas-raiz, não apenas sintomas
- Não repetir tarefas com palavras diferentes em semanas diferentes
- Pense como um mentor estratégico experiente, não como um gerador de listas

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

CAMADA EXTRA DE FIDELIDADE AO MÉTODO:
Ao construir o plano, trabalhe com estes eixos distribuídos ao longo das 24 semanas:
- Clareza de direcção
- Alinhamento entre talento, chamado e negócio
- Validação e ajuste do modelo
- Estruturação do negócio sobre bases sólidas
- Clareza financeira
- Multiplicação com ordem
- Conexão com princípios bíblicos aplicados ao mundo empresarial

TRAVA DE QUALIDADE:
Se alguma semana estiver genérica, superficial, repetitiva, desconectada do diagnóstico ou sem lógica de progressão, reescreva antes de entregar.
Não entregue um plano "bonito". Entregue um plano utilizável.

FORMATO DE SAÍDA (JSON puro, sem markdown, sem texto antes ou depois):
{
  "semanas": [
    {
      "numero": 1,
      "nome": "Nome da semana",
      "objetivo": "1 frase estratégica e específica",
      "por_que_importa": "Parágrafo explicando a lógica estratégica desta etapa",
      "versiculo": "Livro X:Y — texto do versículo",
      "tarefas": [
        { "descricao": "Tarefa concreta e mensurável", "prioridade": "alta", "acao_codigo": null }
      ],
      "indicador_conclusao": "Como saber praticamente se a semana foi cumprida",
      "resultado_esperado": "Ganho concreto gerado ao final da execução"
    }
  ]
}`;
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

  let alma: string;
  try {
    alma = loadAlmaContent();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new AppError(`Conteúdo ALMA não encontrado: ${detail}`, 500, 'ALMA_LOAD_ERROR');
  }

  // Chamada Claude com Alma cacheada
  const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
    { type: 'text', text: alma },
    { type: 'text', text: 'Você é o Jethro, mentor do Programa Bases do Negócio (PBN). Gere planos de acção estruturados, práticos e espirituais para empresários cristãos.' },
  ];

  (systemBlocks[0] as unknown as { cache_control: { type: string } }).cache_control = {
    type: 'ephemeral',
  };

  const prompt = buildPlanPrompt(diagnosticModel, onboardingJson as Record<string, unknown>);

  let response: Anthropic.Messages.Message;
  try {
    response = await getAnthropicClient().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemBlocks,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new AppError(`Erro na chamada ao modelo de IA: ${detail}`, 502, 'AI_CALL_ERROR');
  }

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
          [semanaId, tarefa.descricao, tarefa.prioridade, null]
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
    const detail = error instanceof Error ? error.message : String(error);
    throw new AppError(`Erro ao persistir plano: ${detail}`, 500, 'PLAN_PERSIST_ERROR');
  } finally {
    client.release();
  }

  return { planoId };
}
