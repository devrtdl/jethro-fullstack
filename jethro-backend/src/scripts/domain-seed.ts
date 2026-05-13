import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import type { PoolClient } from 'pg';

import { getDbPool } from '../lib/db.js';

type DiagnosticQuestionSeed = {
  code: string;
  orderIndex: number;
  label: string;
  helperText?: string;
  questionType: 'text' | 'textarea' | 'email' | 'phone' | 'single_select' | 'money_range' | 'number' | 'range_with_optional' | 'multi_select' | 'team_slots';
  isRequired?: boolean;
  isInternal?: boolean;
  validation?: Record<string, unknown>;
  options?: Array<{ label: string; value: string }>;
  metadata?: Record<string, unknown>;
};

type DiagnosticModelSeed = {
  code: string;
  name: string;
  title: string;
  summary: string;
  priorityOrder: number;
  rootCause: string;
  pillars: string[];
  triggerRules: string[];
};

type DiagnosticMessageSeed = {
  modelCode: string;
  variant: `v${number}`;
  block1Title: string;
  block1Body: string;
  rootCause?: string;
  palavraIntro?: string;
  scriptureVerse?: string;
  scriptureText?: string;
  block2Title: string;
  block2Body: string;
  ctaLabel: string;
};

type RogerioQuoteSeed = {
  code: string;
  category: 'diagnostic' | 'alma' | 'principle' | 'sales' | 'leadership' | 'finance';
  quoteText: string;
  sourceLabel: string;
  modelCode?: string;
};

type ActionSeed = {
  codigo: string;
  bloco: 'FIN' | 'COM' | 'LID' | 'OPE' | 'MET' | 'PILAR' | 'GERAL';
  titulo: string;
  descricao: string;
  modelosObrigatorios?: string[];
  modelosCondicionais?: Record<string, unknown>;
  faseInicio?: number;
  faseFim?: number;
  versaoIntroducao: string;
  definitiva?: boolean;
  metadata?: Record<string, unknown>;
};

type DevotionalSeed = {
  semanaNumero: number;
  titulo: string;
  texto: string;
  versiculo: string;
  metadata?: Record<string, unknown>;
};

const diagnosticQuestions: DiagnosticQuestionSeed[] = [
  {
    code: 'q1_nome_completo',
    orderIndex: 1,
    label: 'Qual é o seu nome e sobrenome?',
    questionType: 'text',
    validation: { minLength: 3, minWords: 2, pattern: "^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$" },
  },
  {
    code: 'q2_area_atuacao',
    orderIndex: 2,
    label: 'Qual é a área de atuação do seu negócio?',
    questionType: 'text',
    validation: { minLength: 3, maxLength: 100 },
  },
  {
    code: 'q3_whatsapp',
    orderIndex: 3,
    label: 'Qual é o seu número de WhatsApp?',
    helperText: 'Usado para detectar o país e adaptar as faixas de faturamento.',
    questionType: 'phone',
    validation: { minLength: 10 },
  },
  {
    code: 'q4_email',
    orderIndex: 4,
    label: 'Qual é o seu endereço de email?',
    questionType: 'email',
    validation: { maxLength: 150 },
  },
  {
    code: 'q5_fase_negocio',
    orderIndex: 5,
    label: 'Qual é a fase do seu negócio?',
    questionType: 'single_select',
    options: [
      { label: 'Ideia', value: 'A' },
      { label: 'Início (0-1 ano)', value: 'B' },
      { label: 'Em crescimento (1-3 anos)', value: 'C' },
      { label: 'Consolidado (3+ anos)', value: 'D' },
    ],
  },
  {
    code: 'q6_conexao_dons',
    orderIndex: 6,
    label: 'Você sente que seu negócio está conectado com seus dons e talentos?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, totalmente', value: 'A' },
      { label: 'Parcialmente', value: 'B' },
      { label: 'Não, ainda não', value: 'C' },
    ],
  },
  {
    code: 'q7_proposito_negocio',
    orderIndex: 7,
    label: 'Você sabe exatamente qual é o propósito do seu negócio e como ele entrega valor?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, muito claro', value: 'A' },
      { label: 'Tenho ideia, mas não está definido', value: 'B' },
      { label: 'Não tenho clareza', value: 'C' },
    ],
  },
  {
    code: 'q8_estrutura_negocio',
    orderIndex: 8,
    label: 'Seu negócio tem estrutura sólida, com visão de futuro e planejamento estratégico?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, bem estruturado', value: 'A' },
      { label: 'Em desenvolvimento', value: 'B' },
      { label: 'Ainda não', value: 'C' },
    ],
  },
  {
    code: 'q9_organizacao_financeira',
    orderIndex: 9,
    label: 'Como você enxerga a organização financeira do seu negócio?',
    questionType: 'single_select',
    options: [
      { label: 'Estruturada', value: 'A' },
      { label: 'Básica', value: 'B' },
      { label: 'Desorganizada / Confusa', value: 'C' },
    ],
  },
  {
    code: 'q10_formalizacao',
    orderIndex: 10,
    label: 'Qual é a classificação da formalização do seu negócio?',
    questionType: 'single_select',
    options: [
      { label: 'Informal', value: 'informal' },
      { label: 'Formalizada / empresa registrada', value: 'formalizada' },
      { label: 'Empresa de médio ou grande porte', value: 'medio_grande_porte' },
      { label: 'Ainda não comecei', value: 'nao_comecou' },
      { label: 'Outro', value: 'outro' },
    ],
  },
  {
    code: 'q11_faturamento_mensal',
    orderIndex: 11,
    label: 'Qual é o faturamento médio mensal do seu negócio?',
    helperText: 'A moeda é exibida de acordo com o país detectado no WhatsApp.',
    questionType: 'money_range',
    validation: { source: 'country_dynamic' },
  },
  {
    code: 'q_precificacao',
    orderIndex: 12,
    label: 'Você sente que cobra o valor justo pelo que entrega?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, cobro o valor que merece', value: 'A' },
      { label: 'Às vezes cobro abaixo do valor real', value: 'B' },
      { label: 'Frequentemente cobro abaixo do que entrego', value: 'C' },
    ],
  },
  {
    code: 'q12_lucro_crescimento',
    orderIndex: 13,
    label: 'Você sente que o seu negócio está gerando lucro e crescendo?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, crescendo', value: 'A' },
      { label: 'Estável, sem crescimento', value: 'B' },
      { label: 'Não, estamos regredindo', value: 'C' },
    ],
  },
  {
    code: 'q13_objetivo_futuro',
    orderIndex: 14,
    label: 'Onde você deseja estar com seu negócio nos próximos 6 a 12 meses?',
    questionType: 'textarea',
    validation: { minLength: 20, maxLength: 500 },
  },
  {
    code: 'q14_desafios',
    orderIndex: 15,
    label: 'Quais são os 3 maiores desafios que você está enfrentando hoje no seu negócio?',
    questionType: 'textarea',
    validation: { minLength: 20, maxLength: 600 },
  },
  {
    code: 'q15_canal_aquisicao',
    orderIndex: 16,
    label: 'Como a maioria dos seus clientes chega até você hoje?',
    questionType: 'single_select',
    options: [
      { label: 'Rede social orgânica', value: 'A' },
      { label: 'Indicação', value: 'B' },
      { label: 'Rede social com tráfego pago', value: 'D' },
      { label: 'Google Ads', value: 'E' },
      { label: 'Uso vários canais', value: 'C' },
    ],
  },
  {
    code: 'q16_capacidade_operacional',
    orderIndex: 17,
    label: 'Se o seu número de clientes dobrasse amanhã, o que aconteceria?',
    questionType: 'single_select',
    options: [
      { label: 'Daria conta normalmente', value: 'A' },
      { label: 'Precisaria reorganizar algumas partes', value: 'B' },
      { label: 'A operação entraria em colapso', value: 'C' },
    ],
  },
  {
    code: 'q17_horas_semana',
    orderIndex: 18,
    label: 'Quantas horas por semana você dedica ao seu negócio?',
    questionType: 'single_select',
    options: [
      { label: 'Menos de 10h', value: 'A' },
      { label: '10-20h', value: 'B' },
      { label: '20-40h', value: 'C' },
      { label: '40-60h', value: 'D' },
      { label: 'Mais de 60h', value: 'E' },
    ],
  },
  {
    code: 'q18_status_empresa',
    orderIndex: 19,
    label: 'Em que estado real está a sua empresa ou produto hoje?',
    helperText: 'Pergunta adicionada no motor v2.4 para separar validação de pré-início.',
    questionType: 'single_select',
    options: [
      { label: 'Ainda não comecei', value: 'A' },
      { label: 'Já tenho empresa ou produto em desenvolvimento', value: 'B' },
      { label: 'Tenho a ideia, mas ainda não estruturei', value: 'C' },
      { label: 'Estou parado entre ideia e execução', value: 'D' },
    ],
    metadata: { assumption: 'Pergunta inferida a partir do motor v2.4; confirmar wording final com o cliente.' },
  },
];

// ─── PERGUNTAS DO ONBOARDING (order_index 100+) ───────────────────────────────
// Armazenadas em diagnostic_questions com prefixo onb_ e metadata.form='onboarding'
// showIf gates são avaliados pelo frontend; backend ignora respostas de perguntas ocultas

const onboardingQuestions: DiagnosticQuestionSeed[] = [
  // FASE 1 — Abertura e Contexto (universal)
  // ─── ONBOARDING v2.0 ─────────────────────────────────────────────────────────
  // FASE 1 — Contexto e Situação
  {
    code: 'onb_o1_dedicacao',
    orderIndex: 100,
    label: 'Além do seu negócio, você tem outra fonte de renda hoje?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Só o meu negócio', value: 'A' },
      { label: 'Emprego CLT + negócio', value: 'B' },
      { label: 'Outro negócio paralelo', value: 'C' },
      { label: 'Renda do cônjuge complementa', value: 'D' },
    ],
    metadata: { form: 'onboarding', phase: '1', fields: ['regime_dedicacao'] },
  },
  {
    code: 'onb_o2_equipa_total',
    orderIndex: 101,
    label: 'Quantas pessoas trabalham contigo hoje (incluindo tu)?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Só eu', value: '1' },
      { label: '2 a 3 pessoas', value: '3' },
      { label: '4 a 10 pessoas', value: '7' },
      { label: '11 a 20 pessoas', value: '15' },
      { label: '21 a 50 pessoas', value: '35' },
      { label: 'Mais de 50', value: '60' },
    ],
    metadata: { form: 'onboarding', phase: '1', fields: ['equipa_total'] },
  },
  {
    code: 'onb_o2a_equipa_comercial',
    orderIndex: 102,
    label: 'Dessas, quantas trabalham com vendas ou atendimento?',
    questionType: 'single_select',
    options: [
      { label: 'Nenhuma (só eu vendo)', value: '0' },
      { label: '1 pessoa', value: '1' },
      { label: '2 a 3 pessoas', value: '2' },
      { label: '4 a 10 pessoas', value: '5' },
      { label: 'Mais de 10', value: '12' },
    ],
    metadata: {
      form: 'onboarding', phase: '1', fields: ['equipa_comercial_count'],
      conditional: true,
      showIfAnswer: { code: 'onb_o2_equipa_total', op: 'neq', value: '1' },
    },
  },
  {
    code: 'onb_o2b_equipa_detalhada',
    orderIndex: 103,
    label: 'Quem são as pessoas-chave da sua equipe?',
    helperText: 'Até 5 pessoas — escreve o nome (opcional) e selecciona a função.',
    questionType: 'team_slots',
    options: [
      { label: 'Vendas', value: 'vendas' },
      { label: 'Financeiro', value: 'financeiro' },
      { label: 'Operação', value: 'operacao' },
      { label: 'Atendimento', value: 'atendimento' },
      { label: 'Admin', value: 'admin' },
      { label: 'Outro', value: 'outro' },
    ],
    metadata: {
      form: 'onboarding', phase: '1', fields: ['equipa_detalhada'],
      conditional: true,
      showIfAnswer: { code: 'onb_o2_equipa_total', op: 'neq', value: '1' },
      maxSlots: 5,
    },
  },
  {
    code: 'onb_o2c_ativo_fisico',
    orderIndex: 104,
    label: 'Tens espaço físico para atender clientes?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Sim, espaço próprio', value: 'A' },
      { label: 'Sim, alugado ou partilhado', value: 'B' },
      { label: 'Não, trabalho em casa', value: 'C' },
      { label: 'Não, serviço no local do cliente', value: 'D' },
    ],
    metadata: { form: 'onboarding', phase: '1', fields: ['ativo_fisico'] },
  },
  {
    code: 'onb_o3_meta',
    orderIndex: 105,
    label: 'Qual faturamento mensal queres alcançar nos próximos 6 meses?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Manter o atual', value: 'A' },
      { label: 'R$10 mil', value: 'B' },
      { label: 'R$20 mil', value: 'C' },
      { label: 'R$50 mil', value: 'D' },
      { label: 'R$100 mil', value: 'E' },
      { label: 'Acima de R$100 mil', value: 'F' },
    ],
    metadata: { form: 'onboarding', phase: '1', fields: ['meta_6_meses'] },
  },
  {
    code: 'onb_o3a_problema',
    orderIndex: 106,
    label: 'Para isso, o que precisa mudar primeiro na sua opinião?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Vender mais', value: 'A' },
      { label: 'Cobrar melhor', value: 'B' },
      { label: 'Organizar finanças', value: 'C' },
      { label: 'Montar equipe', value: 'D' },
      { label: 'Ter mais tempo', value: 'E' },
      { label: 'Ter mais clareza de direção', value: 'F' },
    ],
    metadata: { form: 'onboarding', phase: '1', fields: ['maior_problema_percebido'] },
  },
  // FASE 3A — Financeiro
  {
    code: 'onb_o4_faturamento',
    orderIndex: 120,
    label: 'Qual foi o faturamento médio dos últimos 3 meses?',
    helperText: 'Selecione a faixa. Você pode adicionar o valor exato abaixo.',
    questionType: 'range_with_optional',
    isRequired: true,
    options: [
      { label: 'Menos de R$5k', value: 'A' },
      { label: 'R$5k – R$10k', value: 'B' },
      { label: 'R$10k – R$20k', value: 'C' },
      { label: 'R$20k – R$50k', value: 'D' },
      { label: 'R$50k – R$100k', value: 'E' },
      { label: 'Acima de R$100k', value: 'F' },
      { label: 'Não sei', value: 'G' },
    ],
    metadata: { form: 'onboarding', phase: '3a', fields: ['faturamento_medio_3m'] },
  },
  {
    code: 'onb_o4a_sobra',
    orderIndex: 121,
    label: 'No final do mês, o que costuma sobrar?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Nada ou quase nada', value: 'A' },
      { label: 'Sobra pouco', value: 'B' },
      { label: 'Sobra razoável', value: 'C' },
      { label: 'Sobra bem', value: 'D' },
      { label: 'Não sei — não tenho controle', value: 'E' },
    ],
    metadata: { form: 'onboarding', phase: '3a', fields: ['o_que_sobra'] },
  },
  {
    code: 'onb_o4b_recebimento',
    orderIndex: 122,
    label: 'Como recebes da maioria dos clientes?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'À vista', value: 'A' },
      { label: 'Transferência bancária', value: 'B' },
      { label: 'Cartão (à vista para mim)', value: 'C' },
      { label: 'Parcelado', value: 'D' },
      { label: 'Boleto com prazo', value: 'E' },
      { label: 'Misto', value: 'F' },
    ],
    metadata: { form: 'onboarding', phase: '3a', fields: ['modelo_recebimento'] },
  },
  {
    code: 'onb_o5_separacao',
    orderIndex: 123,
    label: 'As contas do negócio estão separadas das pessoais?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Sim, totalmente', value: 'A' },
      { label: 'Parcialmente', value: 'B' },
      { label: 'Não, uso a mesma conta', value: 'C' },
    ],
    metadata: { form: 'onboarding', phase: '3a', fields: ['separacao_pf_pj'] },
  },
  {
    code: 'onb_o5a_prolabore',
    orderIndex: 124,
    label: 'Tiras um salário fixo (pró-labore)?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Sim, valor fixo todo mês', value: 'A' },
      { label: 'Tiro o que sobra', value: 'B' },
      { label: 'Não tiro', value: 'C' },
    ],
    metadata: { form: 'onboarding', phase: '3a', fields: ['pro_labore'] },
  },
  {
    code: 'onb_o6_custos',
    orderIndex: 125,
    label: 'Quanto gastas por mês para manter o negócio?',
    helperText: 'Selecione a faixa. Você pode adicionar o valor exato abaixo.',
    questionType: 'range_with_optional',
    isRequired: true,
    options: [
      { label: 'Menos de R$3k', value: 'A' },
      { label: 'R$3k – R$8k', value: 'B' },
      { label: 'R$8k – R$15k', value: 'C' },
      { label: 'R$15k – R$30k', value: 'D' },
      { label: 'R$30k – R$60k', value: 'E' },
      { label: 'Acima de R$60k', value: 'F' },
      { label: 'Não sei', value: 'G' },
    ],
    metadata: { form: 'onboarding', phase: '3a', fields: ['custo_fixo_mensal'] },
  },
  {
    code: 'onb_o6a_dre',
    orderIndex: 126,
    label: 'Você tem controle financeiro mensal (DRE, planilha)?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Sim, acompanho todo mês', value: 'A' },
      { label: 'Tenho planilha mas não atualizo', value: 'B' },
      { label: 'Só o que meu contador envia', value: 'C' },
      { label: 'Não tenho nenhum controle', value: 'D' },
    ],
    metadata: { form: 'onboarding', phase: '3a', fields: ['sem_dre_flag'] },
  },
  // FASE 3B — Comercial
  {
    code: 'onb_o7_canal',
    orderIndex: 133,
    label: 'Qual o principal canal de vendas?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Rede social orgânica', value: 'A' },
      { label: 'Indicação', value: 'B' },
      { label: 'Rede social com tráfego pago', value: 'C' },
      { label: 'Google Ads', value: 'D' },
      { label: 'Uso vários canais', value: 'E' },
    ],
    metadata: { form: 'onboarding', phase: '3b', fields: ['canal_principal'] },
  },
  {
    code: 'onb_o7a_clientes',
    orderIndex: 134,
    label: 'Quantos clientes ativos você tem (compraram nos últimos 12 meses)?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: '1 a 5', value: 'A' },
      { label: '6 a 15', value: 'B' },
      { label: '16 a 30', value: 'C' },
      { label: '31 a 50', value: 'D' },
      { label: 'Mais de 50', value: 'E' },
      { label: 'Não sei', value: 'F' },
    ],
    metadata: { form: 'onboarding', phase: '3b', fields: ['clientes_ativos_total'] },
  },
  {
    code: 'onb_o7a2_recorrentes',
    orderIndex: 135,
    label: 'Desses, quantos compram mais de 1x por ano?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Nenhum', value: 'A' },
      { label: '1 a 5', value: 'B' },
      { label: '6 a 15', value: 'C' },
      { label: 'Mais de 15', value: 'D' },
      { label: 'Não sei', value: 'E' },
    ],
    metadata: { form: 'onboarding', phase: '3b', fields: ['clientes_recorrentes'] },
  },
  {
    code: 'onb_o7b_ticket',
    orderIndex: 136,
    label: 'Qual o valor médio que cada cliente paga (ticket)?',
    helperText: 'Selecione a faixa. Você pode adicionar o valor exato abaixo.',
    questionType: 'range_with_optional',
    isRequired: true,
    options: [
      { label: 'Menos de R$100', value: 'A' },
      { label: 'R$100 – R$500', value: 'B' },
      { label: 'R$500 – R$1.500', value: 'C' },
      { label: 'R$1.500 – R$5.000', value: 'D' },
      { label: 'Mais de R$5.000', value: 'E' },
      { label: 'Varia muito', value: 'F' },
    ],
    metadata: { form: 'onboarding', phase: '3b', fields: ['ticket_medio'] },
  },
  {
    code: 'onb_o7c_audiencia',
    orderIndex: 137,
    label: 'Tens presença activa em redes sociais (publicas 1x/semana)?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Sim, posto regularmente', value: 'A' },
      { label: 'Tenho perfil mas posto pouco', value: 'B' },
      { label: 'Não tenho presença digital', value: 'C' },
    ],
    metadata: { form: 'onboarding', phase: '3b', fields: ['audiencia_digital_status'] },
  },
  {
    code: 'onb_o7d_seguidores',
    orderIndex: 138,
    label: 'Quantos seguidores no principal canal digital?',
    questionType: 'single_select',
    options: [
      { label: 'Menos de 500', value: 'A' },
      { label: '500 – 2.000', value: 'B' },
      { label: '2.000 – 10.000', value: 'C' },
      { label: 'Mais de 10.000', value: 'D' },
    ],
    metadata: {
      form: 'onboarding', phase: '3b', fields: ['audiencia_tamanho'],
      conditional: true,
      showIfAnswer: { code: 'onb_o7c_audiencia', op: 'neq', value: 'C' },
    },
  },
  {
    code: 'onb_o8_conversao',
    orderIndex: 139,
    label: 'De cada 10 interessados, quantos viram clientes?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: '1 ou 2', value: 'A' },
      { label: '3 ou 4', value: 'B' },
      { label: '5 ou 6', value: 'C' },
      { label: '7 ou mais', value: 'D' },
      { label: 'Não sei', value: 'E' },
    ],
    metadata: { form: 'onboarding', phase: '3b', fields: ['conversao_de_10'] },
  },
  {
    code: 'onb_o8a_objeccao',
    orderIndex: 140,
    label: 'Principal razão que clientes dão para NÃO comprar?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Está caro', value: 'A' },
      { label: 'Vou pensar (e some)', value: 'B' },
      { label: 'Já tem alguém que faz', value: 'C' },
      { label: 'Não entendeu o que ofereço', value: 'D' },
      { label: 'Não chega gente suficiente', value: 'E' },
      { label: 'Outro', value: 'F' },
    ],
    metadata: { form: 'onboarding', phase: '3b', fields: ['objeccao_principal'] },
  },
  {
    code: 'onb_o8b_sazonalidade',
    orderIndex: 141,
    label: 'O negócio tem meses fortes e fracos?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Sim, bem definidos', value: 'A' },
      { label: 'Um pouco', value: 'B' },
      { label: 'Não, estável o ano todo', value: 'C' },
      { label: 'Não sei', value: 'D' },
    ],
    metadata: { form: 'onboarding', phase: '3b', fields: ['sazonalidade_flag'] },
  },
  // FASE 3C — Diagnóstico Pessoal
  {
    code: 'onb_o10_tentou',
    orderIndex: 145,
    label: 'Você já tentou resolver esse problema antes? (pode selecionar vários)',
    questionType: 'multi_select',
    isRequired: true,
    options: [
      { label: 'Contratei marketing/tráfego', value: 'A' },
      { label: 'Fiz curso ou mentoria', value: 'B' },
      { label: 'Tentei reorganizar sozinho', value: 'C' },
      { label: 'Contratei funcionário', value: 'D' },
      { label: 'Nunca tentei', value: 'E' },
      { label: 'Outro', value: 'F' },
    ],
    metadata: { form: 'onboarding', phase: '3c', fields: ['ja_tentou'] },
  },
  {
    code: 'onb_o11_impacto',
    orderIndex: 146,
    label: 'Se o negócio estiver onde precisa em 6 meses, o que muda na sua vida pessoal?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Mais tempo com a família', value: 'A' },
      { label: 'Liberdade financeira', value: 'B' },
      { label: 'Menos pressão e ansiedade', value: 'C' },
      { label: 'Investir no que acredito (ministério)', value: 'D' },
      { label: 'Parar de trabalhar tanto', value: 'E' },
      { label: 'Outro', value: 'F' },
    ],
    metadata: { form: 'onboarding', phase: '3c', fields: ['impacto_pessoal'] },
  },
  {
    code: 'onb_o14_dividas',
    orderIndex: 147,
    label: 'Tens dívidas de curto prazo (cheque especial, cartão, empréstimos)?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Não', value: 'A' },
      { label: 'Sim, menos de R$5k', value: 'B' },
      { label: 'Sim, R$5k a R$20k', value: 'C' },
      { label: 'Sim, mais de R$20k', value: 'D' },
      { label: 'Prefiro não informar', value: 'E' },
    ],
    metadata: { form: 'onboarding', phase: '3c', fields: ['dividas_curto_prazo'] },
  },
  // OB — Contexto Expandido (condicionais baseadas em respostas do onboarding)
  {
    code: 'onb_ob09_equipe',
    orderIndex: 150,
    label: 'Qual o maior desafio com a sua equipe?',
    questionType: 'single_select',
    options: [
      { label: 'Encontrar gente boa', value: 'A' },
      { label: 'Treinar e manter padrão', value: 'B' },
      { label: 'Equipa sem iniciativa', value: 'C' },
      { label: 'Rotatividade alta', value: 'D' },
      { label: 'Sem desafio de momento', value: 'E' },
    ],
    metadata: {
      form: 'onboarding', phase: 'ob', conditional: true, fields: ['equipe_desafio'],
      showIfAnswer: { code: 'onb_o2_equipa_total', op: 'neq', value: '1' },
    },
  },
  {
    code: 'onb_ob10_concentracao',
    orderIndex: 151,
    label: 'Os teus 3 maiores clientes representam +50% do faturamento?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, dependo de poucos', value: 'A' },
      { label: 'Mais ou menos (30-40%)', value: 'B' },
      { label: 'Não, bem distribuído', value: 'C' },
      { label: 'Não sei', value: 'D' },
    ],
    metadata: {
      form: 'onboarding', phase: 'ob', conditional: true, fields: ['concentracao_receita'],
      showIfAnswer: { code: 'onb_o7a_clientes', op: 'in', values: ['A', 'B'] },
    },
  },
  {
    code: 'onb_ob11_subpreco',
    orderIndex: 152,
    label: 'Quando cobras abaixo do mercado, qual o motivo?',
    questionType: 'single_select',
    options: [
      { label: 'Medo de perder o cliente', value: 'A' },
      { label: 'A concorrência cobra menos', value: 'B' },
      { label: 'O cliente pechincha sempre', value: 'C' },
      { label: 'Não sei calcular o preço certo', value: 'D' },
      { label: 'Faço por relacionamento/ministério', value: 'E' },
    ],
    metadata: {
      form: 'onboarding', phase: 'ob', conditional: true, fields: ['razao_subpreco'],
      showIf: { diagnosticAnswerSlug: 'precificacao', diagnosticAnswerValues: ['B', 'C'] },
    },
  },
  {
    code: 'onb_ob12_socio',
    orderIndex: 153,
    label: 'Tens sócio no negócio?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Não', value: 'A' },
      { label: 'Sim, funciona bem', value: 'B' },
      { label: 'Sim, temos divergências', value: 'C' },
      { label: 'Sim, é da família', value: 'D' },
    ],
    metadata: { form: 'onboarding', phase: 'ob', fields: ['tem_socio'] },
  },
  {
    code: 'onb_ob13_inadimplencia',
    orderIndex: 154,
    label: 'Tens problemas com clientes que atrasam pagamento?',
    questionType: 'single_select',
    options: [
      { label: 'Não', value: 'A' },
      { label: 'Às vezes (10-20%)', value: 'B' },
      { label: 'Sim, frequente (+30%)', value: 'C' },
      { label: 'Grave — impacta o caixa todo mês', value: 'D' },
    ],
    metadata: {
      form: 'onboarding', phase: 'ob', conditional: true, fields: ['inadimplencia_nivel'],
      showIfAnswer: { code: 'onb_o4b_recebimento', op: 'neq', value: 'A' },
    },
  },
  {
    code: 'onb_ob14_plataforma',
    orderIndex: 155,
    label: 'Se a plataforma onde vendes caísse amanhã, o que acontecia?',
    questionType: 'single_select',
    options: [
      { label: 'Perdia quase todos os clientes', value: 'A' },
      { label: 'Perdia uma parte', value: 'B' },
      { label: 'Não impactaria muito', value: 'C' },
      { label: 'Não dependo de uma única plataforma', value: 'D' },
    ],
    metadata: {
      form: 'onboarding', phase: 'ob', conditional: true, fields: ['dependencia_plataforma'],
      showIfAnswer: { code: 'onb_o7_canal', op: 'in', values: ['A', 'C', 'D'] },
    },
  },
  // FASE 4 — Bloco C/D: Financeiro aprofundado
  {
    code: 'onb_o12_precificacao',
    orderIndex: 160,
    label: 'Sabes quanto custa produzir/entregar cada produto ou serviço?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, tenho claro', value: 'A' },
      { label: 'Mais ou menos', value: 'B' },
      { label: 'Não, nunca calculei', value: 'C' },
    ],
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['precificacao_intuitiva'],
      showIf: { diagnosticModel: ['C', 'D'] },
    },
  },
  {
    code: 'onb_o13_dividas_forn',
    orderIndex: 161,
    label: 'Tens dívidas com fornecedores ou pagamentos atrasados?',
    questionType: 'single_select',
    options: [
      { label: 'Não', value: 'A' },
      { label: 'Sim, menos de R$10k', value: 'B' },
      { label: 'Sim, R$10k a R$50k', value: 'C' },
      { label: 'Sim, mais de R$50k', value: 'D' },
    ],
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['dividas_fornecedores'],
      showIf: { diagnosticModel: ['C', 'D'] },
    },
  },
  {
    code: 'onb_o15_clareza_custos',
    orderIndex: 162,
    label: 'Se precisasses cortar 20% dos custos, sabias onde cortar?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, sei exactamente', value: 'A' },
      { label: 'Teria que analisar', value: 'B' },
      { label: 'Não faço ideia', value: 'C' },
    ],
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['clareza_custos'],
      showIf: { diagnosticModel: ['C', 'D'] },
    },
  },
  // FASE 4 — Bloco A/B: Clareza de oferta e posicionamento
  {
    code: 'onb_o16_clareza_pos',
    orderIndex: 164,
    label: 'Consegues explicar em 1 frase o que fazes e para quem?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, tenho claro', value: 'A' },
      { label: 'Mais ou menos', value: 'B' },
      { label: 'Não consigo', value: 'C' },
    ],
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['clareza_posicionamento'],
      showIf: { diagnosticModel: ['A', 'B'] },
    },
  },
  {
    code: 'onb_o17_num_ofertas',
    orderIndex: 165,
    label: 'Quantas ofertas/serviços diferentes você tem hoje?',
    questionType: 'single_select',
    options: [
      { label: '1 principal', value: 'A' },
      { label: '2 a 3', value: 'B' },
      { label: '4 a 5', value: 'C' },
      { label: 'Mais de 5 (faço de tudo um pouco)', value: 'D' },
    ],
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['numero_ofertas'],
      showIf: { diagnosticModel: ['A', 'B'] },
    },
  },
  {
    code: 'onb_o18_oferta_principal',
    orderIndex: 166,
    label: 'Qual oferta dá mais resultado (receita ou satisfação)? Descreve em 1 frase.',
    questionType: 'text',
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['oferta_principal'],
      showIf: { diagnosticModel: ['A', 'B'] },
    },
  },
  // FASE 4 — Bloco G: Operação e processos
  {
    code: 'onb_o19_dependencia_dono',
    orderIndex: 168,
    label: 'Das actividades do dia a dia, quantas só tu sabes fazer?',
    questionType: 'single_select',
    options: [
      { label: 'Quase tudo', value: 'A' },
      { label: 'Metade', value: 'B' },
      { label: 'Poucas', value: 'C' },
    ],
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['dependencia_dono_pct'],
      showIf: { diagnosticModel: ['G'] },
    },
  },
  {
    code: 'onb_o20_processos',
    orderIndex: 169,
    label: 'Tens processos documentados (mesmo que simples)?',
    questionType: 'single_select',
    options: [
      { label: 'Não, tudo na cabeça', value: 'A' },
      { label: 'Tenho alguns mas ninguém segue', value: 'B' },
      { label: 'Sim, os principais estão documentados', value: 'C' },
    ],
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['processos_documentados'],
      showIf: { diagnosticModel: ['G'] },
    },
  },
  {
    code: 'onb_o21_ferias',
    orderIndex: 170,
    label: 'Se tirasses 2 semanas de férias, o que para?',
    questionType: 'single_select',
    options: [
      { label: 'Quase nada', value: 'A' },
      { label: 'Algumas coisas', value: 'B' },
      { label: 'Tudo', value: 'C' },
    ],
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['teste_ferias'],
      showIf: { diagnosticModel: ['G'] },
    },
  },
  // FASE 4 — Bloco H: Liderança e governo pessoal
  {
    code: 'onb_o22_metas_equipa',
    orderIndex: 172,
    label: 'Cada pessoa da equipe sabe a meta desta semana?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, com clareza', value: 'A' },
      { label: 'Mais ou menos', value: 'B' },
      { label: 'Ninguém tem meta clara', value: 'C' },
    ],
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['clareza_metas_equipe'],
      showIf: { diagnosticModel: ['H'] },
    },
  },
  {
    code: 'onb_o22a_decisoes',
    orderIndex: 173,
    label: 'Quais decisões ainda passam por você?',
    questionType: 'single_select',
    options: [
      { label: 'Poucas', value: 'A' },
      { label: 'Metade', value: 'B' },
      { label: 'Quase tudo', value: 'C' },
    ],
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['decisoes_centralizadas'],
      showIf: { diagnosticModel: ['H'] },
    },
  },
  // FASE 4 — Bloco E/F: Posicionamento e aquisição
  {
    code: 'onb_o24_posicionamento',
    orderIndex: 175,
    label: 'As pessoas entendem o que fazes e para quem? Descreve em 1 frase.',
    questionType: 'text',
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['posicionamento_1_frase'],
      showIf: { diagnosticModel: ['E', 'F'] },
    },
  },
  {
    code: 'onb_o25_gap_ticket',
    orderIndex: 176,
    label: 'Quanto podias cobrar com o posicionamento certo?',
    questionType: 'single_select',
    options: [
      { label: 'Mesmo valor', value: 'A' },
      { label: '1.5x mais', value: 'B' },
      { label: '2-3x mais', value: 'C' },
      { label: 'Não sei', value: 'D' },
    ],
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['gap_ticket'],
      showIf: { diagnosticModel: ['E', 'F'] },
    },
  },
  // FASE 4 — Bloco X: Pronto para Escalar (NOVO v2.0)
  {
    code: 'onb_o26_capacidade_invest',
    orderIndex: 178,
    label: 'Terias capacidade de investir em crescimento nos próximos 3 meses?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, tenho reserva', value: 'A' },
      { label: 'Pouco', value: 'B' },
      { label: 'Não', value: 'C' },
    ],
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['capacidade_investimento'],
      showIf: { diagnosticModel: ['X'] },
    },
  },
  {
    code: 'onb_o27_processos_x',
    orderIndex: 179,
    label: 'Os processos principais estão documentados?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, os principais', value: 'A' },
      { label: 'Alguns ainda na cabeça', value: 'B' },
      { label: 'Não, tudo depende de mim', value: 'C' },
    ],
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['processos_documentados'],
      showIf: { diagnosticModel: ['X'] },
    },
  },
  {
    code: 'onb_o28_barreira_escala',
    orderIndex: 180,
    label: 'O que mais te impede de crescer hoje?',
    questionType: 'single_select',
    options: [
      { label: 'Não sei por onde escalar', value: 'A' },
      { label: 'Não tenho equipe suficiente', value: 'B' },
      { label: 'Não tenho tempo', value: 'C' },
      { label: 'Não sei se o mercado aguenta', value: 'D' },
      { label: 'Só falta um plano estruturado', value: 'E' },
    ],
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['barreira_escala'],
      showIf: { diagnosticModel: ['X'] },
    },
  },
  {
    code: 'onb_o29_mentoria',
    orderIndex: 181,
    label: 'Você já teve ou tem mentoria individual para o negócio?',
    questionType: 'single_select',
    options: [
      { label: 'Nunca tive', value: 'A' },
      { label: 'Já tive', value: 'B' },
      { label: 'Tenho atualmente', value: 'C' },
    ],
    metadata: {
      form: 'onboarding', phase: '4', conditional: true, fields: ['experiencia_mentoria'],
      showIf: { diagnosticModel: ['X'] },
    },
  },
  // FASE 6 — Fechamento
  {
    code: 'onb_o23_tipo_oferta',
    orderIndex: 185,
    label: 'Qual o tipo principal de oferta do seu negócio?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Serviço por projeto', value: 'A' },
      { label: 'Serviço recorrente (mensal)', value: 'B' },
      { label: 'Produto físico', value: 'C' },
      { label: 'Produto digital', value: 'D' },
      { label: 'Misto', value: 'E' },
    ],
    metadata: { form: 'onboarding', phase: '6', fields: ['tipo_oferta_principal'] },
  },
  {
    code: 'onb_o23a_recorrencia',
    orderIndex: 186,
    label: 'Tens fonte de receita recorrente (mensalidade, contrato)?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Sim, maior parte da receita', value: 'A' },
      { label: 'Sim, mas é pequena parte', value: 'B' },
      { label: 'Não, cada venda é única', value: 'C' },
      { label: 'Não, mas quero criar', value: 'D' },
    ],
    metadata: { form: 'onboarding', phase: '6', fields: ['receita_recorrente'] },
  },
  {
    code: 'onb_o23b_margem',
    orderIndex: 187,
    label: 'A oferta principal tem margem boa ou apertada?',
    questionType: 'single_select',
    isRequired: true,
    options: [
      { label: 'Boa', value: 'A' },
      { label: 'Razoável', value: 'B' },
      { label: 'Apertada', value: 'C' },
      { label: 'Não sei', value: 'D' },
    ],
    metadata: { form: 'onboarding', phase: '6', fields: ['margem_oferta_principal'] },
  },
  {
    code: 'onb_o23c_nota',
    orderIndex: 188,
    label: 'Tens algo importante que não perguntámos?',
    helperText: 'Campo opcional — deixa em branco se não houver.',
    questionType: 'text',
    metadata: { form: 'onboarding', phase: '6', fields: ['nota_adicional'] },
  },
];

const diagnosticModels: DiagnosticModelSeed[] = [
  {
    code: 'E',
    name: 'Modelo E',
    title: 'Começou, Mas o Mercado Ainda Não Respondeu',
    summary: 'Já existe movimento, mas ainda não há validação forte de mercado nem estrutura comercial confiável.',
    priorityOrder: 1,
    rootCause: 'Negócio em fase inicial, com validação fraca ou ainda dependente do círculo próximo.',
    pillars: ['P1', 'P2', 'P3'],
    triggerRules: ["Q11 = 'A' and Q18 = 'B'", "Q5 <= 'B' and Q11 = 'B' and Q15 = 'A'"],
  },
  {
    code: 'G',
    name: 'Modelo G',
    title: 'A Operação Não Aguenta Crescer',
    summary: 'O negócio vende, mas a estrutura não suporta crescimento sem caos, atrasos ou quebra de qualidade.',
    priorityOrder: 2,
    rootCause: 'Capacidade operacional insuficiente para sustentar escala.',
    pillars: ['P4', 'P6', 'P5'],
    triggerRules: ["Q11 >= 'C' and Q16 = 'C'"],
  },
  {
    code: 'D',
    name: 'Modelo D',
    title: 'Fatura, Mas Não Sobra',
    summary: 'Existe receita, porém o negócio opera com margem ruim, prejuízo ou crescimento que não sobra no caixa.',
    priorityOrder: 3,
    rootCause: 'Vazamento financeiro e estrutura econômica frágil.',
    pillars: ['P5', 'P4', 'P6'],
    triggerRules: ["Q11 >= 'B' and Q12 = 'C'"],
  },
  {
    code: 'H',
    name: 'Modelo H',
    title: 'Sem Você, Nada Anda',
    summary: 'O negócio depende excessivamente do fundador, que trabalha demais e centraliza tudo.',
    priorityOrder: 4,
    rootCause: 'Falta de governo pessoal, delegação e rotina de decisão.',
    pillars: ['P1', 'P4', 'P6'],
    triggerRules: ["Q17 = 'D' and Q11 >= 'B'", "Ajustar quando a escala final de horas for confirmada no app"],
  },
  {
    code: 'A',
    name: 'Modelo A',
    title: 'Negócio Sem Rumo — Várias Frentes Abertas',
    summary: 'Há caos financeiro, pouca estrutura e ausência de direção clara. O negócio precisa recomeçar pela base.',
    priorityOrder: 5,
    rootCause: 'Caos de gestão com falta de clareza e governo semanal.',
    pillars: ['P5', 'P3', 'P4'],
    triggerRules: ["Q9 = 'C' and Q8 in ['B','C'] and Q12 in ['B','C'] and (Q6 = 'C' or Q7 = 'C')"],
  },
  {
    code: 'F',
    name: 'Modelo F',
    title: 'Vende Bem, Mas Não Sabe Trazer o Próximo Cliente',
    summary: 'O negócio depende de indicação ou boca a boca e não possui um sistema previsível de aquisição.',
    priorityOrder: 6,
    rootCause: 'Ausência de motor comercial estruturado.',
    pillars: ['P6', 'P2', 'P5'],
    triggerRules: ["Q11 >= 'B' and Q15 = 'A' and Q12 in ['B','C']"],
  },
  {
    code: 'C',
    name: 'Modelo C',
    title: 'Entrega Bem, Cobra Mal',
    summary: 'Existe alinhamento de propósito, mas falta modelo econômico e sistema para transformar isso em prosperidade sustentável.',
    priorityOrder: 7,
    rootCause: 'Boa intenção sem tradução operacional e financeira suficiente.',
    pillars: ['P3', 'P5', 'P2'],
    triggerRules: ["Q6 in ['A','B'] and Q7 in ['A','B'] and Q9 in ['B','C'] and Q12 in ['B','C']"],
  },
  {
    code: 'B',
    name: 'Modelo B',
    title: 'Base Sólida, Faturamento Estagnado',
    summary: 'A operação funciona, mas o crescimento parou. O negócio precisa de multiplicação e sistema de aquisição.',
    priorityOrder: 8,
    rootCause: 'Ausência de motor de crescimento e esteira de oferta.',
    pillars: ['P6', 'P2', 'P4'],
    triggerRules: ["Q9 in ['A','B'] and Q8 in ['A','B'] and Q11 >= 'B' and Q12 = 'B' and Q15 <> 'A'"],
  },
  {
    code: 'X',
    name: 'Modelo X',
    title: 'Pronto para Escalar — Negócio Funcional em Ascensão',
    summary: 'Negócio que funciona, cresce e tem base sólida — precisa de sistema de multiplicação para ir ao próximo nível.',
    priorityOrder: 9,
    rootCause: 'Negócio pronto para escalar — falta mapa de multiplicação + blindagem operacional.',
    pillars: ['P4', 'P6', 'P7'],
    triggerRules: ["Q11 >= 'B' and Q12 in ['A','B'] and Q13 = 'A' and Q9 in ['A','B'] and Q8 in ['A','B']"],
  },
];

const diagnosticMessages: DiagnosticMessageSeed[] = [
  // ─── MODELO A — Negócio Travado + Financeiro Bagunçado + Sem Visão ───────────
  {
    modelCode: 'A',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      'Há um momento — geralmente à noite, depois que todo mundo foi embora ou dormiu — em que você para e olha para o que construiu.\n\n' +
      'E sente aquela mistura estranha: orgulho de ter chegado até aqui. E uma inquietação que não passa. Você não fala sobre isso. Continua. Mas a sensação fica.\n\n' +
      'O Jethro identificou o que essa sensação está tentando te dizer.\n\n' +
      '[NOME], isso não é fraqueza. É o seu discernimento — funcionando.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Financeiro confuso — o dinheiro entra, circula e some antes de você entender o que aconteceu\n' +
      '→ Decisões no feeling — sem painel, sem ritmo, cada semana começa como se fosse a primeira\n' +
      '→ Sem rota — você trabalha muito, mas não sabe exatamente para onde está indo',
    rootCause: 'caos financeiro + ausência de direção + falta de governo semanal',
    palavraIntro: 'Deus é Deus de ordem — e onde há desordem, a prosperidade não pousa.',
    scriptureVerse: '1 Coríntios 14:40',
    scriptureText: '"Mas tudo deve ser feito com ordem e propriedade."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'E aqui está o que ninguém te diz:\n' +
      'O custo disso não é só financeiro.\n' +
      '⚠ É a conversa que você evita ter em casa — porque o negócio não está onde deveria\n' +
      '⚠ É a oração que começa com pedido e termina com culpa silenciosa\n' +
      '⚠ É o testemunho que deveria inspirar — e que você ainda não consegue dar\n' +
      '⚠ É o chamado que você sente sendo adiado — mês após mês\n\n' +
      '"Sem visão o povo perece." — Provérbios 29:18\n' +
      'Não é poesia. É diagnóstico.\n\n' +
      "Você vai continuar chamando isso de 'fase'... ou vai agir antes que vire destino?",
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'A',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      'Tem um número que você evita olhar.\n\n' +
      'Não porque não sabe onde está — mas porque sabe o que vai ver. E ver confirma o que você ainda não quer admitir em voz alta.\n\n' +
      'Esse comportamento tem um nome. E o Jethro o reconhece com precisão.\n\n' +
      '[NOME], o problema não é o mercado. É o espelho.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Números que você adia olhar — porque sabe que não vai gostar\n' +
      '→ Decisões tomadas na emoção do mês, não na inteligência do plano\n' +
      '→ Um negócio que sobrevive — mas que você sabe, lá no fundo, que não está avançando',
    rootCause: 'ausência de painel de governo + falta de cadência estratégica',
    palavraIntro: 'Prosperidade sem governo vira ansiedade. Deus quer te ver prosperar com paz — e isso exige ordem.',
    scriptureVerse: 'Provérbios 21:5',
    scriptureText: '"Os planos do diligente levam à abundância, assim como a pressa leva à pobreza."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O que poucos percebem a tempo:\n' +
      'O risco aqui não é quebrar de repente. É pior.\n' +
      '⚠ Gestor reativo → desgaste → família que sente o peso sem entender a origem\n' +
      '⚠ Fé com esforço, mas sem fruto visível → a dúvida que ninguém ouve, mas todos sentem\n' +
      '⚠ Anos que passam no mesmo ciclo — e a sensação crescente de que o tempo está cobrando\n' +
      '⚠ O chamado que existia vai ficando mais distante — e você vai chamando isso de realidade\n\n' +
      '"Onde não há visão profética, o povo se solta." — Provérbios 29:18\n\n' +
      'Você quer continuar sendo governado pelo mês... ou quer aprender a governar o mês?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'A',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      'Você já disse para si mesmo: "é só essa fase passar."\n\n' +
      'Você diz isso há quanto tempo?\n\n' +
      'Não é julgamento. É a pergunta que o Jethro precisa fazer — porque a resposta muda tudo.\n\n' +
      '[NOME], você está construindo em cima de areia — e uma parte de você já sabe disso.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Sem clareza financeira: o dinheiro entra, sai e some sem rastro\n' +
      '→ Sem plano real: você reage ao que aparece, não ao que planejou\n' +
      '→ Sem rota de 90 dias: cada mês começa como se o anterior não tivesse acontecido',
    rootCause: 'gestão reativa disfarçada de dedicação',
    palavraIntro: 'Jetro disse a Moisés: "Você vai se esgotar." Essa palavra é para você hoje.',
    scriptureVerse: 'Êxodo 18:18',
    scriptureText: '"Você e o povo que está com você vão se esgotar, pois o trabalho é pesado demais para você; não conseguirá realizá-lo sozinho."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O que está em jogo — e não é só o negócio:\n' +
      '⚠ Sua saúde emocional — o desgaste silencioso que ninguém nomeia mas todo mundo sente em você\n' +
      '⚠ Sua presença em casa — você está lá fisicamente, mas a cabeça está sempre no negócio\n' +
      '⚠ Seu chamado — o que Deus depositou em você merece fundamento real, não areia\n' +
      '⚠ Seu testemunho — empreendedor cristão que não prospera não inspira. E você sabe disso.\n\n' +
      '"O prudente vê o perigo e se refugia, mas o inexperiente segue em frente e sofre as consequências." — Provérbios 22:3\n\n' +
      'Você vai esperar a conta chegar... ou vai escolher sabedoria agora?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },

  // ─── MODELO B — Negócio Saudável, Mas Travado no Platô ──────────────────────
  {
    modelCode: 'B',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      'Há um momento — quando você vê outro negócio crescendo, talvez menor que o seu, talvez com menos qualidade — em que uma pergunta passa rápido pela sua cabeça.\n\n' +
      'Você não fala em voz alta. Mas a pergunta fica: "Por que eles estão crescendo e eu estou no mesmo lugar?"\n\n' +
      'O Jethro identificou a resposta.\n\n' +
      '[NOME], você construiu algo que funciona. Agora precisa de algo que multiplica.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ O crescimento travou — mesma receita, mesmos clientes, mesmos canais\n' +
      '→ Você sente que "está tudo certo... menos o avanço"\n' +
      '→ O esforço aumentou, mas o resultado não acompanhou',
    rootCause: 'falta de motor de multiplicação — aquisição + oferta + recorrência + metas',
    palavraIntro: 'Talentos enterrados não honram quem os deu. O Senhor espera fruto — não só preservação.',
    scriptureVerse: 'Mateus 25:27',
    scriptureText: '"Devia, portanto, ter depositado o meu dinheiro nos bancos, para que, quando eu voltasse, o recebesse com juros."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O que acontece com quem fica no platô por muito tempo:\n' +
      'O platô parece seguro. Mas tem um custo que vai além dos números:\n' +
      '⚠ Seu custo fixo sobe — mesmo sem crescer; a margem corrói em silêncio\n' +
      '⚠ A animação que tinha no começo foi sumindo — e você sente, mas não nomeia\n' +
      '⚠ Em casa, a pergunta não dita é: "até quando vai ser assim?"\n' +
      '⚠ O chamado que te motivou a empreender vai ficando enterrado debaixo da rotina\n\n' +
      '"O preguiçoso não ara no tempo adequado; na colheita procura, mas nada encontra." — Provérbios 20:4\n' +
      'Platô prolongado é procrastinação estratégica.\n\n' +
      'Você vai ficar "bem" enquanto o mercado passa... ou vai decidir ser grande?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'B',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      'Tem uma decisão que você vem adiando.\n\n' +
      'Você sabe qual é. Já pensou nela mais de uma vez. Já disse "quando tiver mais tempo" ou "quando o movimento baixar".\n\n' +
      'O problema é que o momento certo nunca chega — porque você não criou o sistema que o faz chegar. O Jethro identificou exatamente isso.\n\n' +
      '[NOME], o que te trouxe até aqui não te leva pro próximo nível.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Você tem estrutura, mas não tem aceleração\n' +
      '→ Tem clientes, mas não tem sistema de aquisição previsível\n' +
      '→ Tem resultado, mas não tem escada de crescimento',
    rootCause: 'crescimento sem sistema — funil sem rotina, oferta sem esteira',
    palavraIntro: 'Multiplicação é princípio bíblico — não opcional.',
    scriptureVerse: 'Gênesis 1:28',
    scriptureText: '"Sejam fecundos e multipliquem-se."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O custo invisível do platô:\n' +
      'Você não perde de uma vez. Perde aos poucos — e isso é mais perigoso:\n' +
      '⚠ Motivação que cai sem razão aparente — o negócio funciona, mas não anima mais\n' +
      '⚠ Equipe que sente a estagnação antes de você — e os melhores começam a olhar para fora\n' +
      '⚠ Em casa, a energia que sobra depois do trabalho vai diminuindo junto com o entusiasmo\n' +
      '⚠ O propósito que existia no começo vai ficando difícil de explicar — para você e para Deus\n\n' +
      '"Aquele que é negligente no seu trabalho é irmão daquele que destrói." — Provérbios 18:9\n\n' +
      'Você vai repetir o mesmo ano mais uma vez... ou vai construir a rota para o próximo nível?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'B',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      'Você já disse para si mesmo: "quando eu escalar, aí..."\n\n' +
      'Mas escalar nunca acontece — porque escalar não é consequência de esperar. É consequência de construir.\n\n' +
      'Essa frase que você repete tem um nome. E o Jethro reconhece o padrão.\n\n' +
      '[NOME], o mercado não espera. E o seu potencial também não pode esperar.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Canal de aquisição fraco ou dependente de acaso\n' +
      '→ Oferta sem escada — falta entrada, principal e recorrência\n' +
      '→ Meta sem sistema — esforço sem método não escala',
    rootCause: 'ausência de motor de crescimento estruturado',
    palavraIntro: 'A parábola dos talentos não é sobre preservar — é sobre multiplicar. Deus é sócio que espera retorno.',
    scriptureVerse: 'Mateus 25:29',
    scriptureText: '"Pois a quem tem, mais será dado, e terá em abundância. Mas ao que não tem, até o que tem lhe será tirado."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'Se o platô continuar nos próximos 6 meses:\n' +
      'O cenário não é dramático. É silencioso — e por isso mais perigoso:\n' +
      '⚠ Você vai trabalhar igual e ganhar menos em termos reais — a inflação não espera o motor\n' +
      '⚠ A família percebe que o negócio consome mas não avança — e essa percepção pesa\n' +
      '⚠ Você vai acordar um dia com a sensação de que trabalhou anos para preservar, não para multiplicar\n' +
      '⚠ E o talento que Deus depositou em você vai ter gerado preservação — não fruto\n\n' +
      '"Há quem aparente riqueza, mas nada tem; há quem aparente pobreza, mas tem grande riqueza." — Provérbios 13:7\n' +
      'Estagnação com aparência de estabilidade é o pior dos cenários.\n\n' +
      'Você quer continuar parecendo que está bem... ou quer realmente multiplicar o que Deus te deu?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },

  // ─── MODELO C — Entrega Bem, Cobra Mal ──────────────────────────────────────
  {
    modelCode: 'C',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      'Tem um momento — logo depois que você fecha um serviço ou entrega um trabalho — em que você sente aquela sensação incômoda.\n\n' +
      'Não é arrependimento. É a percepção de que entregou mais do que cobrou. Que o cliente saiu satisfeito demais para o que pagou.\n\n' +
      'Você não fala sobre isso. Agradece. E vai para o próximo. O Jethro identificou o custo acumulado desse padrão.\n\n' +
      '[NOME], você tem o coração certo. Falta o sistema que sustenta.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Você cobra menos do que entrega — e todo mês o caixa prova isso\n' +
      '→ O preço não reflete o valor real do que você faz — e você sabe disso\n' +
      '→ A visão existe no coração, mas não existe no papel como plano real',
    rootCause: 'propósito sem modelo financeiro + precificação abaixo do valor real',
    palavraIntro: 'Deus honra o chamado com provisão — mas a provisão exige mordomia.',
    scriptureVerse: 'Provérbios 27:23',
    scriptureText: '"Cuide bem de seus rebanhos, preste atenção aos seus gados."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O que o aperto crônico faz com quem tem chamado:\n' +
      'O caixa apertado não machuca só o banco. Machuca a alma:\n' +
      '⚠ Você começa a aceitar clientes errados — só pra pagar conta — e isso drena mais do que o dinheiro\n' +
      '⚠ Em casa, a tensão financeira que você tenta esconder vai aparecendo nas entrelinhas\n' +
      '⚠ Você começa a duvidar do chamado: "se Deus me chamou, por que apertar tanto?"\n' +
      '⚠ E o propósito que era chama vai virando brasa que mal aquece\n\n' +
      '"O rico governa os pobres, e o devedor é escravo do credor." — Provérbios 22:7\n' +
      'Cobrar abaixo do que vale rouba liberdade — e liberdade é parte do chamado.\n\n' +
      'Você vai continuar sendo governado pelo boleto... ou vai retomar o governo do seu chamado?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'C',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      'Tem um comportamento que acontece antes mesmo de o cliente perguntar o preço.\n\n' +
      'Você já começa a justificar internamente por que vai cobrar menos. Já calcula o desconto antes de apresentar a proposta.\n\n' +
      'Esse comportamento tem um nome. E o Jethro o reconhece com precisão.\n\n' +
      '[NOME], o problema não é o quanto você vale. É o quanto você está cobrando.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Precificação abaixo do valor real entregue\n' +
      '→ Condições de pagamento que drenam o caixa antes de completar o ciclo\n' +
      '→ Falta de visão estratégica de 90 dias — você vive no "agora"',
    rootCause: 'valor sem modelo + preço sem regra',
    palavraIntro: 'Jesus ensinou sobre mordomia — não sobre se sacrificar por quem não valoriza. Você foi chamado para prosperar, não apenas servir no limite.',
    scriptureVerse: 'João 10:10',
    scriptureText: '"O ladrão vem apenas para roubar, matar e destruir; eu vim para que tenham vida, e a tenham plenamente."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O que acontece com quem vive no limite por muito tempo:\n' +
      'O aperto crônico tem um custo que vai além do financeiro:\n' +
      '⚠ Desgaste que acumula até virar esgotamento — e esgotamento não avisa antes de chegar\n' +
      '⚠ Decisões tomadas no medo — não na fé e estratégia que seu chamado merece\n' +
      '⚠ Relacionamentos em casa que sentem o peso do que você carrega — mesmo sem entender de onde vem\n' +
      '⚠ Uma vida abundante que Deus prometeu sendo trocada por sobrevivência — mês após mês\n\n' +
      '"Filho meu, não se esqueça do meu ensino; guarde no seu coração os meus mandamentos, pois eles prolongarão por muitos anos a sua vida." — Provérbios 3:1-2\n' +
      'Guardar a sabedoria financeira é ato de fé, não de frieza.\n\n' +
      'Você quer continuar entregando ouro e recebendo bronze... ou vai reposicionar o que você vale?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'C',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      'Você cresceu ouvindo — ou sentindo — que cobrar bem era quase ganância. Que o verdadeiro servo cobra menos. Que humildade e preço andam juntos.\n\n' +
      'Nunca ninguém te disse diretamente. Mas a crença foi se instalando.\n\n' +
      'E hoje ela está custando caro — não só ao seu negócio. Ao seu chamado.\n\n' +
      '[NOME], propósito sem sustentabilidade não é humildade. É risco.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Caixa que aperta todo mês — não por falta de clientes, mas por falta de margem\n' +
      '→ Visão que existe, mas não tem rota — fica no sonho sem se tornar plano\n' +
      '→ Um negócio que serve bem mas não se sustenta bem',
    rootCause: 'ausência de modelo financeiro sustentável + precificação abaixo do valor',
    palavraIntro: 'Jetro ensinou Moisés a estruturar — porque missão sem estrutura colapsa.',
    scriptureVerse: 'Êxodo 18:18',
    scriptureText: '"Você e o povo que está com você vão se esgotar, pois o trabalho é pesado demais para você; não conseguirá realizá-lo sozinho."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O destino do propósito sem governo financeiro:\n' +
      'Quando propósito e sistema não andam juntos, o destino é sempre o mesmo:\n' +
      '⚠ Você esgota — e o negócio para com você\n' +
      '⚠ Toma decisões reativas — abre mão de clientes, padrões e limites que importam\n' +
      '⚠ O testemunho que deveria ser de prosperidade vira testemunho de sobrevivência\n' +
      '⚠ E Deus, que te chamou para o muito, vê o fiel no mínimo sendo consumido antes do tempo\n\n' +
      '"Honre o Senhor com as suas riquezas, com as primícias de toda a sua colheita." — Provérbios 3:9\n' +
      'Honrar com as riquezas exige ter riquezas — e isso exige governo.\n\n' +
      'Você vai continuar pagando o preço da generosidade sem sistema... ou vai construir sustentabilidade para o seu chamado?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },

  // ─── MODELO D — Fatura, Mas Não Sobra ──────────────────────────────────────
  {
    modelCode: 'D',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      'Tem um momento — geralmente no final do mês, quando você para para fechar as contas — em que o número no extrato não fecha com o que você esperava.\n\n' +
      'O movimento foi bom. Você vendeu. Entregou. Trabalhou.\n\n' +
      'E mesmo assim, sobrou menos do que deveria. Ou não sobrou nada. O Jethro identificou exatamente onde está o buraco.\n\n' +
      '[NOME], você está correndo em direção a uma parede — e chamando isso de crescimento.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Faturamento existe — lucro é ilusão\n' +
      '→ Você não sabe a margem real de cada produto ou serviço\n' +
      '→ O dinheiro entra, o custo absorve — e a margem que deveria sobrar some antes de se tornar resultado',
    rootCause: 'custo invisível + precificação sem margem + ilusão de faturamento',
    palavraIntro: 'Faturamento sem lucro não é bênção — é trabalho em vão. Deus chama ao fruto real, não à aparência de produtividade.',
    scriptureVerse: 'Lucas 14:28',
    scriptureText: '"Qual de vocês, querendo construir uma torre, não se senta primeiro e calcula o custo?"',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O que acontece quando o sangramento continua:\n' +
      'A lógica é cruel mas precisa — e vai além do caixa:\n' +
      '⚠ Mais vendas → mais operação → mais custo → menos lucro → mais pressão\n' +
      '⚠ A pressão financeira chega em casa mesmo quando você não fala — e a família sente\n' +
      '⚠ Você ora por provisão mas o sistema que constrói trabalha contra a provisão\n' +
      '⚠ E um dia o negócio que você construiu com fé fecha — não por falta de cliente, mas por falta de margem\n\n' +
      '"O prudente vê o perigo e se refugia, mas o inexperiente segue em frente e sofre as consequências." — Provérbios 22:3\n' +
      'Você está vendo o perigo agora. A decisão é sua.\n\n' +
      'Você quer continuar crescendo o faturamento... ou quer começar a crescer o lucro?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'D',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      'Quando alguém pergunta como vai o negócio, você responde "está bem". Talvez até "está crescendo".\n\n' +
      'Mas por dentro, você sabe que o número bonito no faturamento não corresponde ao que você sente no bolso.\n\n' +
      'Você não fala sobre isso. Continua. Mas a dissonância fica. O Jethro colocou nome nessa dissonância.\n\n' +
      '[NOME], o seu negócio pode estar te enganando.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Desconto virou hábito — e cada desconto tem um custo que você não calcula\n' +
      '→ Custo fixo cresceu com o negócio — mas a margem não acompanhou\n' +
      '→ Você não sabe qual produto ou serviço paga a conta — e qual está te custando',
    rootCause: 'precificação sem lógica + custo invisível + ausência de DRE real',
    palavraIntro: 'Prosperidade bíblica tem paz, ordem e resultado — não ilusão.',
    scriptureVerse: 'Provérbios 10:22',
    scriptureText: '"A bênção do Senhor traz riqueza, sem que venha tristeza com ela."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O que está em jogo nos próximos 90 dias:\n' +
      'Se o padrão continuar, três consequências são certas — e nenhuma fica só no negócio:\n' +
      '⚠ O caixa vai apertar de forma que você não conseguirá esconder — de si mesmo nem de casa\n' +
      '⚠ Você será forçado a tomar decisões de desespero — não de fé e estratégia\n' +
      '⚠ A família, que confiou no seu chamado, vai sentir o peso sem entender a origem\n' +
      '⚠ E o testemunho que o negócio cristão deveria dar vai sendo silenciado pela crise\n\n' +
      '"Há um caminho que parece certo ao homem, mas o fim desse caminho é a morte." — Provérbios 14:12\n' +
      'Faturamento que parece vitória pode ser o caminho para a falência.\n\n' +
      'Você vai esperar o caixa gritar para ouvir a verdade... ou vai agir agora que o Jethro te mostrou?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'D',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      'Você já disse para si mesmo: "o próximo mês vai ser diferente."\n\n' +
      'E no próximo mês, o movimento foi bom. Mas no final — a mesma sensação.\n\n' +
      'Não é azar. É um sistema construído para produzir exatamente esse resultado. O Jethro identificou onde está esse sistema — e como corrigir.\n\n' +
      '[NOME], trabalhar para sustentar vazamento é a armadilha mais cruel do empreendedorismo.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Você não sabe o custo real de cada hora trabalhada\n' +
      '→ A estrutura cresceu — mas o lucro por venda diminuiu\n' +
      '→ O mix de produtos ou serviços tem itens que sangram — e você ainda não sabe quais',
    rootCause: 'ausência de visão de margem por item + estrutura de custo descontrolada',
    palavraIntro: 'Mordomia é saber o que entra e o que sai. Sem isso, não há como ser fiel no muito.',
    scriptureVerse: 'Lucas 16:10',
    scriptureText: '"Quem é fiel nas coisas pequenas também é fiel nas grandes."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O destino de quem não resolve o sangramento:\n' +
      'A conta chega — e quando chega, ela cobra com juros em todas as frentes:\n' +
      '⚠ Você acumula dívidas para sustentar uma operação que não dá lucro\n' +
      '⚠ A reserva vai a zero — e o primeiro imprevisto derruba tudo que você construiu\n' +
      '⚠ Em casa, a tensão financeira vai corroendo o que o chamado deveria estar construindo\n' +
      '⚠ E o negócio que você ergueu com fé e suor fecha — não por falta de cliente, mas por falta de margem\n\n' +
      '"O rico governa os pobres, e o devedor é escravo do credor." — Provérbios 22:7\n' +
      'Sangramento não corrigido vira escravidão financeira.\n\n' +
      'Você vai continuar trabalhando para sustentar o vazamento... ou vai fechar o buraco agora?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },

  // ─── MODELO E — Pré-Receita — Ainda Não Validou no Mercado ─────────────────
  {
    modelCode: 'E',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      'Tem um momento — quando alguém pergunta "e aí, como vai o negócio?" — em que você sente aquela hesitação de meio segundo antes de responder.\n\n' +
      'Não é mentira o que você diz. Mas também não é toda a verdade.\n\n' +
      'Porque a verdade é que ainda não saiu do papel da forma que você esperava. O Jethro identificou exatamente onde está o travamento.\n\n' +
      '[NOME], a semente existe. Falta plantar — de verdade.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ A oferta ainda não está clara o suficiente para o mercado dizer sim\n' +
      '→ O canal não está testado — as vendas que existem vieram da rede pessoal, não do mercado\n' +
      '→ A rotina de primeira venda ainda não foi instalada',
    rootCause: 'validação fraca + oferta não posicionada + execução travada',
    palavraIntro: 'Fé sem obra é morta. O Senhor não bênça semente que ninguém plantou.',
    scriptureVerse: 'Tiago 2:17',
    scriptureText: '"Assim também a fé, por si só, se não for acompanhada de obras, está morta."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O risco do "quase começando" que dura meses:\n' +
      'Existe um padrão perigoso nesta fase — e o custo vai além da venda que não veio:\n' +
      '⚠ Cada semana tem um ajuste novo na oferta — mas nenhuma venda; o ciclo se repete\n' +
      '⚠ O medo de aparecer vira medo de falhar vira paralisação — e paralisação tem prazo de validade\n' +
      '⚠ Em casa, o tempo e a energia investidos começam a pesar sem resultado visível\n' +
      '⚠ O chamado que era claro começa a parecer ilusão — quando o problema era só o método\n\n' +
      '"Quem fica observando o vento, não semeia; quem fica olhando para as nuvens, não colhe." — Eclesiastes 11:4\n' +
      'Esperar a hora perfeita é a desculpa mais comum para não entrar no jogo.\n\n' +
      'Você vai continuar se preparando para começar... ou vai começar de verdade?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'E',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      'Tem um comportamento que você conhece bem — você ajusta a oferta, melhora a apresentação, aperfeiçoa o produto.\n\n' +
      'Mas não vai ao mercado.\n\n' +
      'Cada ajuste é real. Cada melhoria faz sentido. E cada uma delas adia o momento de verdade. O Jethro identificou esse padrão — e tem uma saída precisa.\n\n' +
      '[NOME], o mundo não compra potencial. Compra oferta clara.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Sua oferta ainda não está em 1 frase que gera decisão de compra\n' +
      '→ Você ainda não testou canais de aquisição fora da sua rede pessoal\n' +
      '→ A rotina de prospecção não existe — e sem rotina, não há consistência',
    rootCause: 'oferta não posicionada + canal não validado + rotina ausente',
    palavraIntro: 'Deus deu dons para servir — mas servir exige aparecer, oferecer e ser pago pelo valor entregue.',
    scriptureVerse: 'Provérbios 18:16',
    scriptureText: '"O presente do homem lhe abre caminho e o introduz na presença dos grandes."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O que o "eterno começo" está custando:\n' +
      'Cada mês sem venda consistente tem um custo triplo:\n' +
      '⚠ Financeiro: você financia o negócio do próprio bolso — sem retorno, sem prazo definido\n' +
      '⚠ Emocional: a autoconfiança vai diminuindo com cada semana sem resultado — silenciosamente\n' +
      '⚠ Em casa, o projeto que você acredita vai ficando difícil de defender com entusiasmo\n' +
      '⚠ Espiritual: você começa a questionar se o chamado era real — quando o problema era só o método\n\n' +
      '"O preguiçoso diz: Há um leão lá fora! Serei morto se sair à rua!" — Provérbios 22:13\n' +
      'Todo obstáculo parece maior quando você ainda não entrou no jogo.\n\n' +
      'Você vai continuar esperando estar pronto... ou vai descobrir que pronto se aprende fazendo?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'E',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      'Você já disse para si mesmo: "falta só mais uma coisa — aí eu começo."\n\n' +
      'Só que a lista do que falta nunca acaba.\n\n' +
      'Não é preguiça. É medo de rejeição disfarçado de preparo. E o Jethro reconhece esse padrão — porque ele tem uma saída.\n\n' +
      '[NOME], o seu maior inimigo agora não é o mercado. É o adiamento.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Você ajusta a oferta — mas não vende\n' +
      '→ Você estuda o mercado — mas não testa\n' +
      '→ Você acredita no chamado — mas não age com consistência',
    rootCause: 'medo de rejeição disfarçado de preparo + ausência de método de primeira venda',
    palavraIntro: 'Deus chamou Pedro para sair do barco — não para estudar a física da água. A fé que multiplica é a que pisa no mar.',
    scriptureVerse: 'Mateus 14:29',
    scriptureText: '"Então Pedro desceu do barco, andou sobre as águas e foi ao encontro de Jesus."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'Se o padrão de adiamento continuar:\n' +
      'O risco não é imediato. É progressivo — e por isso mais destrutivo:\n' +
      '⚠ 6 meses: você ainda está "quase pronto" — com mais conhecimento e menos confiança\n' +
      '⚠ 1 ano: a janela de mercado que existia pode ter fechado — e a energia de lançamento também\n' +
      '⚠ Em casa, o projeto começa a virar "aquela coisa que ele ainda vai fazer"\n' +
      '⚠ O chamado que você sente começa a parecer ingenuidade — mas o problema era só método\n\n' +
      '"Tudo tem a sua ocasião determinada; há tempo certo para cada propósito debaixo do céu." — Eclesiastes 3:1\n' +
      'O seu tempo é agora — não quando você sentir que está perfeito.\n\n' +
      'Você vai continuar adiando a sua história... ou vai dar o primeiro passo com método e acompanhamento?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },

  // ─── MODELO F — Vende Bem, Mas Não Sabe Trazer o Próximo Cliente ───────────
  {
    modelCode: 'F',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      'Tem um momento — geralmente no começo do mês, quando você olha para a agenda — em que a pergunta aparece sem ser chamada.\n\n' +
      'De onde vem o próximo cliente?\n\n' +
      'Você não sabe responder com certeza. Depende. Talvez apareça uma indicação. O Jethro identificou o custo desse talvez como modelo de negócio.\n\n' +
      '[NOME], você tem negócio. Não tem sistema. E essa diferença está custando caro.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Quase 100% dos clientes chegam por indicação — e indicação não escala\n' +
      '→ Você não tem processo de vendas definido — cada fechamento é um improviso\n' +
      '→ Não há rotina de aquisição — sem prospecção ativa, você espera o mercado te achar',
    rootCause: 'ausência de motor comercial — aquisição + funil + follow-up + recorrência',
    palavraIntro: 'Prudência é construir o que não depende do vento. Indicação é vento — boa quando aparece, mortal quando some.',
    scriptureVerse: 'Provérbios 22:3',
    scriptureText: '"O prudente vê o perigo e se refugia, mas o inexperiente segue em frente e sofre as consequências."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O que acontece quando a indicação seca:\n' +
      'E ela vai secar. Não é pessimismo — é física de mercado:\n' +
      '⚠ Você aceita clientes que não deveria — porque precisa do caixa; e isso tem um preço emocional alto\n' +
      '⚠ Você acorda às 3h — porque a próxima venda não tem data para chegar e a cabeça não desliga\n' +
      '⚠ Em casa, a instabilidade do negócio chega mesmo quando você tenta deixá-la do lado de fora\n' +
      '⚠ E o negócio que era chamado começa a parecer fardo — porque fardo não tem motor, tem peso\n\n' +
      '"Aquele que é negligente no seu trabalho é irmão daquele que destrói." — Provérbios 18:9\n' +
      'Depender só de indicação é negligenciar o motor do crescimento.\n\n' +
      'Você vai continuar vivendo de milagre mensal... ou vai instalar um sistema que não depende de sorte?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'F',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      'Tem um comportamento que você provavelmente não nomeou ainda — mas reconhece quando vê.\n\n' +
      'Você espera. Espera o telefone tocar. Espera a mensagem chegar. Espera alguém indicar.\n\n' +
      'E nos meses bons, funciona. Nos meses ruins, a espera pesa. O Jethro identificou o padrão — e tem uma saída que não depende de esperar.\n\n' +
      '[NOME], você provou que sabe entregar. Agora precisa provar que sabe atrair.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Seu canal comercial é frágil — depende da boa vontade do mercado\n' +
      '→ Você não tem script de abordagem, funil de follow-up ou rotina de prospecção\n' +
      '→ O crescimento é instável porque o sistema de entrada não existe',
    rootCause: 'canal único e frágil + ausência de processo comercial repetível',
    palavraIntro: 'Deus recompensa o diligente — mas diligência em vendas exige rotina, não rezar para aparecer cliente.',
    scriptureVerse: 'Provérbios 21:5',
    scriptureText: '"Os planos do diligente levam à abundância, assim como a pressa leva à pobreza."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O que a instabilidade comercial produz a longo prazo:\n' +
      'Não é só o caixa que sofre:\n' +
      '⚠ Sua precificação fica comprometida — sem fluxo de leads, você não tem poder de negociação\n' +
      '⚠ Sua autoestima empresarial oscila com o mês — e isso não é sustentável por muito tempo\n' +
      '⚠ Em casa, os meses ruins chegam como clima — mesmo sem palavras, todos sentem\n' +
      '⚠ E o chamado que deveria crescer fica preso no tamanho da última indicação\n\n' +
      '"Todo aquele que ouve estas minhas palavras e as pratica é como um homem sensato que construiu a sua casa sobre a rocha." — Mateus 7:24\n' +
      'Negócio sem sistema comercial está edificado sobre areia.\n\n' +
      'Você vai continuar sendo refém da indicação... ou vai construir o motor que te liberta?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'F',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      'Você já disse para si mesmo: "esse mês vai aparecer alguma coisa."\n\n' +
      'E às vezes aparece. Nos meses bons, você acredita no negócio. Nos meses ruins, você questiona tudo.\n\n' +
      'A montanha-russa não é do mercado. É da ausência de sistema. O Jethro identificou como sair dela.\n\n' +
      '[NOME], seu negócio funciona quando você tem sorte. Precisa funcionar quando você tem sistema.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Você não sabe quantos leads qualificados chegam por semana\n' +
      '→ Você não tem um processo definido de conversão de interessado em cliente\n' +
      '→ Você não tem recorrência ou esteira — cada venda começa do zero',
    rootCause: 'ausência do ciclo completo — atrair → converter → reter',
    palavraIntro: 'Quem semeia pouco, pouco também colherá. O motor comercial é a semeadura sistemática.',
    scriptureVerse: '2 Coríntios 9:6',
    scriptureText: '"Aquele que semeia pouco, pouco também colherá; e aquele que semeia com fartura, com fartura também colherá."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O futuro de quem não instala o motor comercial:\n' +
      'A instabilidade tem um custo composto que vai além do financeiro:\n' +
      '⚠ Cada mês ruim corrói a reserva que um mês bom construiu — e a reserva nunca cresce de verdade\n' +
      '⚠ A ansiedade de caixa vira estilo de vida — e estilos de vida se solidificam sem que você perceba\n' +
      '⚠ Em casa, a incerteza chega como clima — mesmo sem palavras, todos sentem\n' +
      '⚠ E o chamado que Deus depositou em você fica limitado ao tamanho da última indicação\n\n' +
      '"Tudo tem a sua ocasião determinada; há tempo certo para cada propósito debaixo do céu." — Eclesiastes 3:1\n' +
      'O tempo para instalar o motor é agora — não depois que a seca chegar.\n\n' +
      'Você vai esperar o próximo mês ruim para agir... ou vai agir agora que ainda tem fôlego?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },

  // ─── MODELO G — A Operação Não Aguenta Crescer ─────────────────────────────
  {
    modelCode: 'G',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      'Tem um momento — quando um cliente novo entra em contato ou um negócio novo aparece — em que você deveria sentir alegria.\n\n' +
      'Mas o que sente é ansiedade.\n\n' +
      'Porque por dentro você já sabe: vai ter que se desdobrar para entregar. Vai ter que carregar mais. O Jethro identificou o que esse sinal está dizendo.\n\n' +
      '[NOME], você está num paradoxo perigoso: vender mais está te quebrando.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Sua capacidade operacional está no limite — mais demanda gera mais caos\n' +
      '→ Não há padrão de entrega: cada projeto é uma reinvenção\n' +
      '→ Não há processos documentados: o que funciona hoje não se repete amanhã',
    rootCause: 'ausência de sistema operacional — processo + padrão + capacidade estruturada',
    palavraIntro: 'Sabedoria constrói a casa — não a preenche de qualquer forma. Estrutura é ato de fé, não de medo.',
    scriptureVerse: 'Provérbios 9:1',
    scriptureText: '"A sabedoria construiu a sua casa e esculpiu as suas sete colunas."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O que acontece quando a operação sem estrutura tenta crescer:\n' +
      'A lógica é matemática e implacável — e não fica só no operacional:\n' +
      '⚠ Mais vendas → mais atraso → mais reclamação → reputação que você levou anos para construir\n' +
      '⚠ O cansaço operacional chega em casa — você está lá, mas não está presente de verdade\n' +
      '⚠ Você carrega tudo sozinho — e esse peso é pesado demais para qualquer chamado sustentável\n' +
      '⚠ E um dia você vai perceber que construiu uma prisão dourada — ocupada demais para crescer\n\n' +
      '"É preferível ter boa reputação a muitas riquezas; ser estimado é melhor que prata e ouro." — Provérbios 22:1\n' +
      'Cresce sem estrutura e você pagará com o nome da sua empresa.\n\n' +
      'Você vai continuar crescendo o caos... ou vai primeiro construir a casa que aguenta o crescimento?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'G',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      'Tem um comportamento que acontece no momento de fechar um novo pedido ou contrato.\n\n' +
      'Você aceita. Sorri. Agradece.\n\n' +
      'E por dentro já está calculando como vai conseguir entregar — sabendo que a operação não tem espaço para mais isso. O Jethro reconhece esse comportamento. Ele tem um nome.\n\n' +
      '[NOME], o seu gargalo não está no mercado. Está na sua operação.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Você está escalando urgência, não sistema — cada entrega é um esforço novo\n' +
      '→ A equipe executa, mas sem padrão — e sem padrão, a qualidade oscila\n' +
      '→ Não há processo documentado: quando alguém falta ou sai, a operação regride',
    rootCause: 'operação reativa + ausência de padrão documentado + estrutura que não acompanhou o crescimento',
    palavraIntro: 'Sem sabedoria, a casa mais bonita desmorona. Estrutura é o que sustenta o que você construiu.',
    scriptureVerse: 'Provérbios 24:3',
    scriptureText: '"Com sabedoria se constrói a casa, e com entendimento ela se firma."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O que o teto operacional produz a médio prazo:\n' +
      'Se a estrutura não mudar antes da próxima onda de crescimento:\n' +
      '⚠ Você vai perder clientes que vieram — e a reputação construída vai junto\n' +
      '⚠ Sua equipe vai desengajar — sem padrão, o melhor profissional não fica\n' +
      '⚠ Em casa, você está presente no corpo mas ausente na cabeça — e eles sentem\n' +
      '⚠ Você vai se tornar prisioneiro da operação — sem férias, sem estratégia, sem visão de futuro\n\n' +
      '"pois Deus não é Deus de desordem, mas de paz." — 1 Coríntios 14:33\n' +
      'Uma operação sem processo não glorifica o Deus de ordem.\n\n' +
      'Você vai continuar crescendo o problema... ou vai construir o sistema que multiplica sem implodir?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'G',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      'Para quem olha de fora, o negócio parece estar indo bem.\n\n' +
      'Você sabe que não é bem assim. É correria, retrabalho, improviso. É carregar mais do que deveria.\n\n' +
      'Você não fala sobre isso. Segue. Mas o peso fica. O Jethro mapeou com precisão o que está acontecendo.\n\n' +
      '[NOME], o seu negócio está crescendo por fora e sofrendo por dentro.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Processos não documentados: cada entrega é uma reinvenção\n' +
      '→ Capacidade no limite: um pico de demanda coloca tudo em risco\n' +
      '→ Equipe sem autonomia de processo: sem padrão, não há como delegar resultado',
    rootCause: 'estrutura que não acompanhou o crescimento — fundamento fraco para o prédio que está sendo erguido',
    palavraIntro: 'Todo bom construtor assenta o fundamento antes de subir as paredes. Você está subindo paredes sem fundamento.',
    scriptureVerse: 'Mateus 7:24',
    scriptureText: '"Todo aquele que ouve estas minhas palavras e as pratica é como um homem sensato que construiu a sua casa sobre a rocha."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O que aparece quando menos se espera:\n' +
      'Operação sem estrutura tem uma janela de tolerância — e quando ela fecha, o custo é amplo:\n' +
      '⚠ Um cliente grande que reclama e vai embora com ruído — reputação construída em anos, perdida em dias\n' +
      '⚠ Uma entrega que falha no momento mais visível — e você não tem sistema para impedir\n' +
      '⚠ Em casa, o cansaço que você acumula vai chegando como distância — silenciosa mas real\n' +
      '⚠ E o chamado que motivou tudo isso vai ficando enterrado debaixo do operacional urgente\n\n' +
      '"e ela caiu. E foi grande a sua queda!" — Mateus 7:27\n' +
      'Estrutura não é burocracia — é proteção do que você construiu.\n\n' +
      'Você vai esperar o colapso para construir fundamento... ou vai agir antes que a parede caia?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },

  // ─── MODELO H — Gargalo É o Dono — Sem Governo Pessoal ──────────────────────
  {
    modelCode: 'H',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      'Tem um momento — quando alguém menciona férias, descanso, ou simplesmente "desligar por uma semana" — em que você percebe algo que prefere não admitir.\n\n' +
      'Você não pode.\n\n' +
      'Não é falta de vontade. É que o negócio para quando você para. E você sabe disso. O Jethro identificou o que esse padrão está custando.\n\n' +
      '[NOME], o seu negócio tem o tamanho do seu fôlego. E o seu fôlego está acabando.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Você está dentro do negócio — não sobre ele. Operacional, não estratégico\n' +
      '→ Sua agenda não tem blocos protegidos: tudo é urgência, nada é prioridade\n' +
      '→ Você carrega o que deveria estar distribuído — e esse peso está fazendo o negócio parar de crescer',
    rootCause: 'ausência de governo pessoal — agenda, prioridade, delegação e ritmo semanal',
    palavraIntro: 'Jetro disse isso a Moisés: "O que você está fazendo não está certo." Às vezes a palavra mais profética é a que fala da sua rotina.',
    scriptureVerse: 'Êxodo 18:17-18',
    scriptureText: '"O que você está fazendo não está certo. Você e o povo que está com você vão se esgotar."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O custo de um líder sem governo:\n' +
      'A conta não chega só no caixa. Ela chega em quatro lugares ao mesmo tempo:\n' +
      '⚠ Na sua mente: dispersão, ansiedade, sensação de nunca estar fazendo o suficiente\n' +
      '⚠ No seu corpo: cansaço que não passa com uma boa noite de sono\n' +
      '⚠ Na sua família: presença física sem presença real — e eles sentem a diferença, mesmo em silêncio\n' +
      '⚠ No seu chamado: um líder que não tem governo pessoal não tem autoridade para liderar outros\n\n' +
      '"Venham a mim, todos os que estão cansados e sobrecarregados, e eu lhes darei descanso." — Mateus 11:28\n' +
      'Jesus não chamou ao esforço infinito. Chamou ao jugo certo — com método e descanso.\n\n' +
      'Você vai continuar confundindo sobrecarga com compromisso... ou vai aprender a liderar com governo?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'H',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      'Você não desliga o celular nos fins de semana. Nem nas férias, se conseguir tirar alguma.\n\n' +
      'Não é vício. É que você sabe que se não estiver disponível, algo trava.\n\n' +
      'Esse comportamento tem um nome técnico no diagnóstico do Jethro — e ele é mais grave do que parece.\n\n' +
      '[NOME], você está ocupado. Mas está avançando?\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Você trabalha mais de 60h por semana — e ainda sente que não deu conta\n' +
      '→ Não há ritual semanal de revisão e metas: você reage ao que aparece\n' +
      '→ O negócio não cresce porque você não tem tempo para pensar no crescimento — só para entregar',
    rootCause: 'falta de governo pessoal — dispersão + centralização + ausência de ritmo estratégico',
    palavraIntro: 'Domínio próprio é fruto do Espírito — e sem domínio da agenda, o líder é governado pela urgência, não pelo propósito.',
    scriptureVerse: 'Provérbios 25:28',
    scriptureText: '"Como cidade aberta e sem muros, assim é o homem que não refreia o seu espírito."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O que acontece com o líder sem governo por muito tempo:\n' +
      'A degradação é progressiva — e silenciosa até não ser:\n' +
      '⚠ Você perde as melhores decisões — porque toma decisões cansado, sem clareza estratégica\n' +
      '⚠ Você perde as melhores pessoas — porque líderes sobrecarregados não lideram bem\n' +
      '⚠ Em casa, você está lá — mas a cabeça está sempre no negócio, e todos ao redor sabem\n' +
      '⚠ Você perde a visão — porque quem está apagando incêndio não consegue enxergar o horizonte\n\n' +
      '"Como cidade aberta e sem muros, assim é o homem que não refreia o seu espírito." — Provérbios 25:28\n' +
      'Sem governo pessoal, qualquer ataque penetra. Sua empresa fica vulnerável.\n\n' +
      'Você vai continuar sendo o gargalo do seu próprio chamado... ou vai se tornar o líder que o negócio precisa?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },
  {
    modelCode: 'H',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      'Você já disse para si mesmo — ou já pensou — "ninguém faz como eu faço."\n\n' +
      'E provavelmente é verdade. Você tem um padrão de qualidade alto. Uma entrega que é sua.\n\n' +
      'O problema não é o padrão. É que esse padrão virou corrente. E a corrente só tem um tamanho: o do seu tempo. O Jethro identificou como transformar isso.\n\n' +
      '[NOME], quando o dono para, o negócio para. Isso não é liderança — é dependência.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Tudo passa pelas suas mãos — decisão, execução, controle\n' +
      '→ A equipe não tem autonomia porque os processos não foram estruturados\n' +
      '→ Você é insubstituível — e isso, no negócio, é fraqueza, não força',
    rootCause: 'centralização excessiva + falta de estrutura de liderança + ausência de delegação real',
    palavraIntro: 'Moisés tentou julgar o povo sozinho. Jetro interveio. O que te libertará hoje não é mais esforço — é estrutura de governo.',
    scriptureVerse: 'Êxodo 18:21-22',
    scriptureText: '"Escolha dentre o povo homens capazes... e eles compartilharão o fardo com você."',
    block2Title: 'O que o negócio não consegue te dizer sozinho:',
    block2Body:
      'O futuro de um negócio que depende integralmente do dono:\n' +
      'Três cenários possíveis — todos com custo além do negócio:\n' +
      '⚠ Você adoece: o negócio para — e as contas não param; a família arca com o que você não estruturou\n' +
      '⚠ Você quer crescer: mas não há estrutura que sustente o crescimento sem você no centro de tudo\n' +
      '⚠ Em casa, a ausência real — mesmo quando está fisicamente presente — vai criando distância\n' +
      '⚠ E o chamado que deveria escalar fica limitado ao tamanho do seu fôlego — para sempre\n\n' +
      '"Sem orientação o povo cai, mas havendo muitos conselheiros, há segurança." — Provérbios 11:14\n' +
      'Liderar sozinho não é força. É risco que você não precisa correr.\n\n' +
      'Você vai continuar sendo o teto do seu negócio... ou vai se tornar a plataforma que lança outros?',
    ctaLabel: 'ESTOU PRONTO PARA MUDAR ISSO',
  },

  // ─── MODELO X — Pronto para Escalar — Negócio Funcional em Ascensão ──────────
  {
    modelCode: 'X',
    variant: 'v1',
    block1Title: 'Pronto para o Próximo Nível',
    block1Body:
      'Tem um momento — geralmente quando o dia foi bom, não quando foi ruim — em que você olha para o que construiu e sente algo que não é insatisfação. É inquietação.\n\n' +
      'A pergunta que fica: "Como eu levo isso para o próximo nível sem perder o que construí?"\n\n' +
      'O Jethro identificou a resposta.\n\n' +
      '[NOME], você tem o coração certo e o negócio certo. Falta o sistema que multiplica.\n' +
      'O Jethro identificou algo específico no seu negócio:\n' +
      '→ Você cresceu, mas a estrutura ainda depende de você\n' +
      '→ O que funciona não está documentado — se você parar, o conhecimento para\n' +
      '→ Há alavancas de multiplicação que você ainda não ativou',
    rootCause: 'negócio pronto para escalar — falta mapa de multiplicação + blindagem operacional.',
    palavraIntro: 'O que Deus gerou por meio de você não foi para parar no que já funciona. Foi para dar fruto que permaneça.',
    scriptureVerse: 'João 15:16',
    scriptureText: '"Eu os escolhi para irem e darem fruto, fruto que permaneça."',
    block2Title: 'O que acontece com quem está pronto mas não age:',
    block2Body:
      'O maior risco de quem está bem não é quebrar. É estagnar.\n\n' +
      '⚠ O mercado não espera — concorrentes menos qualificados vão ocupar o espaço que você não escalou\n' +
      '⚠ A operação que depende de você tem prazo de validade — e o corpo cobra\n' +
      '⚠ O talento que não multiplica começa a pesar — porque você sabe que poderia ir mais longe\n' +
      '⚠ E um dia o "está bom" vira "era bom" — porque o mercado mudou e você não\n\n' +
      '"Você devia ao menos ter colocado o meu dinheiro no banco; assim, quando eu voltasse, o receberia com juros."— Mateus 25:27\n' +
      'Estar pronto e não multiplicar é só uma forma mais sofisticada de enterrar o talento.\n\n' +
      'Você vai continuar "pronto"... ou vai começar a multiplicar?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'X',
    variant: 'v2',
    block1Title: 'O Que Te Trouxe Até Aqui Não Te Leva ao Topo',
    block1Body:
      'Você fez o que a maioria não faz: construiu um negócio que funciona. Que cresce. Que paga as contas e ainda dá fruto.\n\n' +
      'Mas há uma lei nos negócios que ninguém avisa: o que funciona hoje tem prazo de validade. O método que te trouxe até aqui não é o mesmo que te leva para o próximo patamar. E você já sente isso.\n\n' +
      'O Jethro não identificou um problema no seu negócio. Identificou uma oportunidade dominante.\n\n' +
      '[NOME], o seu diagnóstico revela algo raro: você não precisa de conserto. Precisa de estrutura de escala.\n' +
      'O Jethro mapeou com precisão:\n' +
      '→ Você tem base — mas a base foi construída para o tamanho atual, não para o próximo\n' +
      '→ Você tem clientes — mas não tem sistema de escala previsível\n' +
      '→ Você tem resultado — mas o resultado depende da sua presença, não de um sistema',
    rootCause: 'sistema construído para o tamanho atual — precisa de arquitetura para o próximo nível.',
    palavraIntro: 'O próximo nível exige mais do que manutenção. Exige multiplicação.',
    scriptureVerse: 'Gênesis 1:28',
    scriptureText: '"Sede fecundos, multiplicai-vos, enchei a terra e sujeitai-a."',
    block2Title: 'O custo invisível de estar pronto e não escalar:',
    block2Body:
      'Você não perde de uma vez. Perde devagar:\n\n' +
      '⚠ A energia que hoje é entusiasmo vira rotina — e rotina sem visão vira desgaste\n' +
      '⚠ O mercado que hoje te respeita amanhã te esquece — porque alguém escalou antes\n' +
      '⚠ A equipe que hoje é fiel amanhã busca crescimento em outro lugar — se não encontrar em você\n' +
      '⚠ E o chamado que Deus depositou fica menor do que poderia ser — não por incapacidade, mas por omissão\n\n' +
      '"A quem muito foi dado, muito lhe será exigido;" — Lucas 12:48\n' +
      'Você recebeu muito. A pergunta não é se pode. É se vai.\n\n' +
      'Você vai administrar o que tem... ou vai multiplicar o que recebeu?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'X',
    variant: 'v3',
    block1Title: 'Base Sólida, Hora de Multiplicar',
    block1Body:
      'Há um momento na vida de um empreendedor em que o problema não é mais sobrevivência. É multiplicação.\n\n' +
      'Você passou da fase da crise. O negócio funciona, cresce, tem direção. Mas você sabe — lá no fundo — que está operando abaixo do potencial. Não por incompetência. Por falta de mapa.\n\n' +
      'O Jethro não encontrou feridas no seu negócio. Encontrou portas que você ainda não abriu.\n\n' +
      '[NOME], o que Deus colocou nas suas mãos já deu fruto. Agora precisa dar fruto que permanece.\n' +
      'O Jethro identificou com precisão:\n' +
      '→ Processos que funcionam na sua cabeça mas não estão no papel — o negócio depende da sua memória\n' +
      '→ Crescimento que existe mas não tem sistema de replicação — cada novo cliente é esforço novo\n' +
      '→ Uma visão de futuro que está clara no coração mas não está traduzida em metas e prazos',
    rootCause: 'negócio que funciona por competência pessoal — precisa funcionar por sistema para multiplicar.',
    palavraIntro: 'O que hoje funciona pela sua força precisa começar a funcionar por estrutura. Multiplicação sustentável exige repartir peso, formar gente e construir sistema.',
    scriptureVerse: 'Êxodo 18:21',
    scriptureText: '"Além disso, procura dentre todo o povo homens capazes... e põe-nos sobre eles por chefes de mil, chefes de cem, chefes de cinquenta e chefes de dez."',
    block2Title: 'O que está em jogo quando você adia a multiplicação:',
    block2Body:
      'Quem está pronto e não multiplica paga um preço que não aparece no caixa:\n\n' +
      '⚠ O peso de saber que poderia ir mais longe — e escolher não ir\n' +
      '⚠ A equipe que cresce menos porque você não criou o espaço\n' +
      '⚠ O mercado que reconhece você como bom — mas não como referência\n' +
      '⚠ E o legado que Deus planejou para você ficando no rascunho em vez de virar realidade\n\n' +
      '"Eu vos escolhi e vos designei para que vades e deis fruto, e o vosso fruto permaneça." — João 15:16\n' +
      'Fruto que permanece não pode depender só de você. Precisa de estrutura para continuar crescendo.\n\n' +
      'Você vai continuar dando fruto sozinho... ou vai construir o pomar?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },

];

const diagnosticMessageRootCauses: Record<string, string> = {
  A: 'caos financeiro + ausência de direção + falta de governo semanal.',
  B: 'falta de motor de multiplicação — aquisição + oferta + recorrência + metas.',
  C: 'propósito sem modelo financeiro + precificação abaixo do valor real.',
  D: 'custo invisível + precificação sem margem + ilusão de faturamento.',
  E: 'validação fraca + oferta não posicionada + execução travada.',
  F: 'ausência de motor comercial — aquisição + funil + follow-up + recorrência.',
  G: 'ausência de sistema operacional — processo + padrão + capacidade estruturada.',
  H: 'ausência de governo pessoal — agenda, prioridade, delegação e ritmo semanal.',
  X: 'falta de mapa de multiplicação + blindagem operacional para escalar sem depender do dono.',
};

const rogerioQuotes: RogerioQuoteSeed[] = [
  {
    code: 'RQ-001',
    category: 'diagnostic',
    quoteText: 'Crescimento financeiro sem crescimento pessoal é ilusão disfarçada de fé.',
    sourceLabel: 'Alma v5.4 - P.18',
  },
  {
    code: 'RQ-002',
    category: 'diagnostic',
    quoteText: 'Se queres mais, precisas valer mais.',
    sourceLabel: 'Alma v5.4 - P.18',
  },
  {
    code: 'RQ-003',
    category: 'leadership',
    quoteText: 'A cenoura tem que estar à frente, não atrás.',
    sourceLabel: 'Alma v5.4 - COM-12',
  },
  {
    code: 'RQ-004',
    category: 'finance',
    quoteText: 'Não sei quanto ganha o negócio.',
    sourceLabel: 'Alma v5.4 - FIN block',
    modelCode: 'A',
  },
  {
    code: 'RQ-005',
    category: 'finance',
    quoteText: 'A empresa é a minha conta.',
    sourceLabel: 'Alma v5.4 - FIN-10',
    modelCode: 'D',
  },
  {
    code: 'RQ-006',
    category: 'sales',
    quoteText: 'Todo mês é diferente.',
    sourceLabel: 'Alma v5.4 - COM-01',
    modelCode: 'F',
  },
  {
    code: 'RQ-007',
    category: 'diagnostic',
    quoteText: 'O diagnóstico errado gera o plano errado.',
    sourceLabel: 'Logica 98pct',
  },
  {
    code: 'RQ-008',
    category: 'alma',
    quoteText: 'Deus é Deus de ordem e onde há desordem, a prosperidade não pousa.',
    sourceLabel: 'Mensagens diagnóstico - Modelo A',
    modelCode: 'A',
  },
  {
    code: 'RQ-009',
    category: 'principle',
    quoteText: 'Governo precede multiplicação.',
    sourceLabel: 'Alma v5.4 - P.17',
  },
  {
    code: 'RQ-010',
    category: 'principle',
    quoteText: 'Valor antecede renda.',
    sourceLabel: 'Alma v5.4 - P.18',
  },
  {
    code: 'RQ-011',
    category: 'sales',
    quoteText: 'Cliente de 20 anos é prova social que nenhum anúncio compra.',
    sourceLabel: 'Alma v5.4 - COM-16',
  },
  {
    code: 'RQ-012',
    category: 'leadership',
    quoteText: 'Ninguém faz como eu faço.',
    sourceLabel: 'Alma v5.4 - LID-10',
  },
  {
    code: 'RQ-013',
    category: 'finance',
    quoteText: 'Não sei quanto pago no dia 18 do próximo mês.',
    sourceLabel: 'Alma v5.4 - FIN-14',
  },
  {
    code: 'RQ-014',
    category: 'sales',
    quoteText: 'Coloquei uma meta mas o time não sabe se está batendo.',
    sourceLabel: 'Alma v5.4 - COM-21',
  },
  {
    code: 'RQ-015',
    category: 'alma',
    quoteText: 'Criou o padrão, criou pessoas-chatas para replicar o padrão e conseguiu avançar.',
    sourceLabel: 'Alma v5.4 - MET-36',
  },
];

const actions: ActionSeed[] = [
  {
    codigo: 'FIN-01-09',
    bloco: 'FIN',
    titulo: 'Ações financeiras fundadoras',
    descricao:
      'Separação PF/PJ, DRE simplificado, fluxo de caixa mensal, mapa de dívidas, pro-labore fixo, reserva mínima de caixa, precificação por margem, ponto de equilíbrio e relatório mensal de fechamento.',
    faseInicio: 1,
    faseFim: 8,
    versaoIntroducao: 'v1.0',
    metadata: { gatilhos: ['Não sei quanto ganha o negócio', 'Mistura conta da empresa com a pessoal', 'Nunca sobra nada'] },
  },
  {
    codigo: 'FIN-10',
    bloco: 'FIN',
    titulo: 'Estruturação da política de retirada',
    descricao:
      'Definir pro-labore fixo mensal separado do caixa da empresa, com retirada baseada no lucro real e documentada no DRE.',
    faseInicio: 1,
    faseFim: 4,
    versaoIntroducao: 'v2.0',
    metadata: { gatilhos: ['Retiro quando preciso', 'A empresa é a minha conta'] },
  },
  {
    codigo: 'FIN-11',
    bloco: 'FIN',
    titulo: 'Dashboard gerencial por vendedor, região e cliente',
    descricao:
      'Criar painel de acompanhamento por vendedor, região, canal e cliente para identificar margem, gargalo e performance comercial.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'FIN-12',
    bloco: 'FIN',
    titulo: 'Calendário de pagamentos concentrado',
    descricao:
      'Mapear todas as dívidas e pagamentos recorrentes num calendário único para reduzir surpresas de caixa e decisões emergenciais.',
    faseInicio: 1,
    faseFim: 4,
    versaoIntroducao: 'v2.0',
    metadata: { gatilhos: ['Todo mês tem susto de caixa', 'Não sei quando vence o que'] },
  },
  {
    codigo: 'FIN-13',
    bloco: 'FIN',
    titulo: 'Dashboard BI financeiro mínimo viável',
    descricao:
      'Painel quinzenal com faturamento bruto, custos fixos e variáveis, lucro líquido real, margem por produto e contas a pagar nos próximos 30 dias.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v4.0',
  },
  {
    codigo: 'FIN-14',
    bloco: 'FIN',
    titulo: 'BPO financeiro como estrutura transitória de gestão',
    descricao:
      'Terceirizar setup e manutenção de fluxo de caixa, DRE simples, conciliação bancária e contas a pagar/receber quando não houver capacidade interna.',
    faseInicio: 1,
    faseFim: 4,
    versaoIntroducao: 'v5.2',
    metadata: { pares: ['FIN-01', 'FIN-13', 'P.16'] },
  },
  {
    codigo: 'COM-01-10',
    bloco: 'COM',
    titulo: 'Ações comerciais fundadoras',
    descricao:
      'Script de vendas básico, ICP documentado, funil em 3 etapas, WhatsApp Business com catálogo, Google Meu Negócio, reativação de base, meta semanal, comissão por produto âncora, follow-up automatizado e relatório semanal de oportunidades.',
    faseInicio: 3,
    faseFim: 12,
    versaoIntroducao: 'v1.0',
  },
  {
    codigo: 'COM-11',
    bloco: 'COM',
    titulo: 'Sala de guerra - mapa visual de vendas',
    descricao:
      'Criar painel físico ou digital com meta, realizado, pipeline, clientes em negociação e motivos de perda, revisado semanalmente.',
    faseInicio: 9,
    faseFim: 16,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'COM-12',
    bloco: 'COM',
    titulo: 'Converter bônus trimestral para mensal',
    descricao:
      'Substituir bônus trimestral por bônus mensal por meta atingida para manter urgência e recompensa imediata no time comercial.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'COM-13',
    bloco: 'COM',
    titulo: 'Entrevista estratégica individual com cada vendedor',
    descricao:
      'Realizar conversa individual estruturada antes de definir metas ou processos para gerar diagnóstico real e evitar prescrição cega.',
    faseInicio: 1,
    faseFim: 4,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'COM-14',
    bloco: 'COM',
    titulo: 'Funil de vendas B2B por fase de relação',
    descricao:
      'Estruturar funil com etapas claras, ação definida e prazo máximo para ciclos comerciais mais longos.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'COM-15',
    bloco: 'COM',
    titulo: 'Programa de fidelização de intermediários',
    descricao:
      'Formalizar programa para canais de indicação como eletricistas, contadores e instaladores com cadastro, pontuação e relacionamento recorrente.',
    faseInicio: 9,
    faseFim: 16,
    versaoIntroducao: 'v4.0',
    metadata: { gatilho: 'Negócio dependente de indicação passiva' },
  },
  {
    codigo: 'COM-16',
    bloco: 'COM',
    titulo: 'Campanha de testemunho de longevidade',
    descricao:
      'Identificar clientes com 5+ anos de relacionamento e transformar a longevidade em prova social visível por meio de vídeo, depoimento, post e contato ao vivo.',
    faseInicio: 9,
    faseFim: 16,
    versaoIntroducao: 'v4.0',
  },
  {
    codigo: 'COM-19',
    bloco: 'COM',
    titulo: 'Funil rastreado',
    descricao:
      'Rastrear aquisição, conversão e perdas por canal com disciplina semanal para transformar vendas em processo e não em sensação.',
    modelosObrigatorios: ['B', 'F'],
    faseInicio: 5,
    faseFim: 20,
    versaoIntroducao: 'v5.2',
  },
  {
    codigo: 'COM-21',
    bloco: 'COM',
    titulo: 'Meta desdobrada em cascata',
    descricao:
      'Dividir a meta mensal em metas semanais e diárias com acompanhamento explícito para criar accountability natural sem microgestão.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v5.0',
  },
  {
    codigo: 'LID-01-05',
    bloco: 'LID',
    titulo: 'Ações de liderança fundadoras',
    descricao:
      'Rotina semanal do CEO, separação decisão estratégica versus operacional, protocolo de contratação, onboarding 30-60-90 e avaliação trimestral.',
    faseInicio: 4,
    faseFim: 12,
    versaoIntroducao: 'v1.0',
  },
  {
    codigo: 'LID-06',
    bloco: 'LID',
    titulo: 'Playbook e estagiário para libertar o gestor',
    descricao:
      'Documentar os processos mais repetitivos do dono em playbooks e treinar um colaborador júnior até a operação funcionar 30 dias sem intervenção.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'LID-07',
    bloco: 'LID',
    titulo: 'OKR trimestral de alta direção',
    descricao:
      'Definir 1 objetivo e 3 key results por trimestre para alinhar visão estratégica com execução semanal e revisão mensal.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'LID-08',
    bloco: 'LID',
    titulo: 'Playbook financeiro para delegação',
    descricao:
      'Criar playbook para fechamento mensal, conciliação bancária, relatório de DRE e pagamento de fornecedores para que o gestor revise sem executar tudo.',
    faseInicio: 8,
    faseFim: 16,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'LID-10',
    bloco: 'LID',
    titulo: 'Delegação por camada operacional',
    descricao:
      'Desenhar o que o dono precisa continuar fazendo, o que deve ser delegado e qual rotina de acompanhamento garante governo sem microgerenciar.',
    modelosObrigatorios: ['H', 'G'],
    faseInicio: 5,
    faseFim: 16,
    versaoIntroducao: 'v5.0',
  },
  {
    codigo: 'OPE-01-05',
    bloco: 'OPE',
    titulo: 'Ações operacionais fundadoras',
    descricao:
      'Mapeamento de fluxo de valor, SLA mínimo de atendimento, checklist de abertura e fechamento, padrão de orçamento documentado e registro de retrabalho.',
    faseInicio: 1,
    faseFim: 8,
    versaoIntroducao: 'v1.0',
  },
  {
    codigo: 'OPE-06',
    bloco: 'OPE',
    titulo: 'Organograma funcional por fase',
    descricao:
      'Desenhar organograma por funções necessárias para a próxima fase do negócio e identificar a próxima camada a ser delegada.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'OPE-07',
    bloco: 'OPE',
    titulo: 'Mapa de processos críticos',
    descricao:
      'Documentar os 5 processos mais críticos para a receita do negócio, com entrada, etapas, saída e responsável.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'OPE-08',
    bloco: 'OPE',
    titulo: 'Ficha técnica por produto ou serviço',
    descricao:
      'Registrar descrição, custo variável, tempo de execução, piso de preço, preço atual e margem real por item para proteger a rentabilidade.',
    faseInicio: 1,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
];

const devotionals: DevotionalSeed[] = [
  {
    semanaNumero: 1,
    titulo: 'Ordem antes da expansão',
    texto:
      'Comece pela ordem. O primeiro passo não é crescer mais rápido, é governar melhor o que já está nas suas mãos.',
    versiculo: '1 Coríntios 14:40',
  },
  {
    semanaNumero: 2,
    titulo: 'Sabedoria antes de pressa',
    texto:
      'Planejamento não é lentidão. É a forma de impedir que a urgência destrua a colheita do futuro.',
    versiculo: 'Provérbios 21:5',
  },
  {
    semanaNumero: 3,
    titulo: 'Estrutura sustenta multiplicação',
    texto:
      'O que cresce sem estrutura vira peso. O que cresce com fundamento vira legado.',
    versiculo: 'Lucas 14:28',
  },
  {
    semanaNumero: 4,
    titulo: 'Fidelidade no pouco',
    texto:
      'Antes de grandes escalas, prove governo no pequeno. O Reino honra consistência, não atropelo.',
    versiculo: 'Mateus 25:21',
  },
];

const ragSources = [
  {
    slug: 'alma-rogerio-v5-4',
    title: 'Alma do Rogerio Teixeira v5.4',
    sourceType: 'docx' as const,
    sourcePath: resolve(process.env.HOME ?? '', 'Downloads', 'Alma_Rogerio_v5_4.docx'),
    metadata: { category: 'alma', version: '5.4' },
  },
  {
    slug: 'jethro-motor-v2-4',
    title: 'Jethro Motor de Diagnostico v2.4',
    sourceType: 'docx' as const,
    sourcePath: resolve(process.env.HOME ?? '', 'Downloads', '01-Jethro_Motor_v2_4_Daniel.docx'),
    metadata: { category: 'motor', version: '2.4' },
  },
  {
    slug: 'jethro-mensagens-diagnostico-v2-1',
    title: 'Jethro Mensagens Diagnostico v2.1',
    sourceType: 'docx' as const,
    sourcePath: resolve(process.env.HOME ?? '', 'Downloads', '02-Jethro — Mensagens de Diagnóstico v2.1.docx'),
    metadata: { category: 'mensagens', version: '2.1' },
  },
  {
    slug: 'jethro-form',
    title: 'Jethro Formulario de Diagnostico',
    sourceType: 'docx' as const,
    sourcePath: resolve(process.env.HOME ?? '', 'Downloads', 'jethro_form.docx'),
    metadata: { category: 'form' },
  },
  {
    slug: 'jethro-logica-98pct',
    title: 'Jethro Logica 98pct',
    sourceType: 'docx' as const,
    sourcePath: resolve(process.env.HOME ?? '', 'Downloads', 'Jethro_Logica_98pct.docx'),
    metadata: { category: 'logic' },
  },
];

export async function seedProductDomain() {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query('begin');

    await seedDiagnosticQuestions(client);
    await seedOnboardingQuestions(client);
    await seedDiagnosticModels(client);
    await seedDiagnosticMessages(client);
    await seedRogerioQuotes(client);
    await seedActionLibrary(client);
    await seedDevotionals(client);
    await seedRagDocuments(client);

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function upsertQuestion(
  client: PoolClient,
  question: DiagnosticQuestionSeed
) {
  // Remove qualquer linha com o mesmo order_index mas código diferente antes do upsert,
  // para evitar violação da unique constraint order_index quando o seed é re-executado
  // após mudanças de índice entre versões.
  await client.query(
    `DELETE FROM diagnostic_questions WHERE order_index = $1 AND code != $2`,
    [question.orderIndex, question.code]
  );
  await client.query(
    `INSERT INTO diagnostic_questions (
        code, order_index, label, helper_text, question_type, is_required, is_internal, validation, options, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb)
      ON CONFLICT (code) DO UPDATE SET
        order_index = excluded.order_index,
        label = excluded.label,
        helper_text = excluded.helper_text,
        question_type = excluded.question_type,
        is_required = excluded.is_required,
        is_internal = excluded.is_internal,
        validation = excluded.validation,
        options = excluded.options,
        metadata = excluded.metadata,
        updated_at = now()`,
    [
      question.code,
      question.orderIndex,
      question.label,
      question.helperText ?? null,
      question.questionType,
      question.isRequired ?? true,
      question.isInternal ?? false,
      JSON.stringify(question.validation ?? {}),
      JSON.stringify(question.options ?? []),
      JSON.stringify(question.metadata ?? {}),
    ]
  );
}

async function seedDiagnosticQuestions(client: PoolClient) {
  for (const question of diagnosticQuestions) {
    await upsertQuestion(client, question);
  }
}

async function seedOnboardingQuestions(client: PoolClient) {
  // Remove códigos v1.4 que foram substituídos no v2.0
  const legacyCodes = [
    'onb_o1_contexto', 'onb_o2_equipa', 'onb_o4_financeiro', 'onb_o5_pf_pj',
    'onb_o9_problema', 'onb_o12_margem', 'onb_o13_recebimento',
    'onb_o16_script_venda', 'onb_o18_proposta', 'onb_o19_followup',
    'onb_o25_ticket_potencial',
  ];
  await client.query(
    `DELETE FROM diagnostic_questions WHERE code = ANY($1)`,
    [legacyCodes]
  );
  for (const question of onboardingQuestions) {
    await upsertQuestion(client, question);
  }
}

async function seedDiagnosticModels(client: PoolClient) {
  for (const model of diagnosticModels) {
    await client.query(
      `insert into diagnostic_models (
        code, name, title, summary, priority_order, root_cause, pillars, trigger_rules
      ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
      on conflict (code) do update set
        name = excluded.name,
        title = excluded.title,
        summary = excluded.summary,
        priority_order = excluded.priority_order,
        root_cause = excluded.root_cause,
        pillars = excluded.pillars,
        trigger_rules = excluded.trigger_rules,
        updated_at = now()`,
      [
        model.code,
        model.name,
        model.title,
        model.summary,
        model.priorityOrder,
        model.rootCause,
        JSON.stringify(model.pillars),
        JSON.stringify(model.triggerRules),
      ]
    );
  }
}

async function seedDiagnosticMessages(client: PoolClient) {
  for (const message of diagnosticMessages) {
    const rootCause = message.rootCause ?? diagnosticMessageRootCauses[message.modelCode] ?? '';
    await client.query(
      `insert into diagnostic_messages (
        model_code, variant, block_1_title, block_1_body, root_cause, palavra_intro, scripture_verse, scripture_text, block_2_title, block_2_body, cta_label
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      on conflict (model_code, variant) do update set
        block_1_title = excluded.block_1_title,
        block_1_body = excluded.block_1_body,
        root_cause = excluded.root_cause,
        palavra_intro = excluded.palavra_intro,
        scripture_verse = excluded.scripture_verse,
        scripture_text = excluded.scripture_text,
        block_2_title = excluded.block_2_title,
        block_2_body = excluded.block_2_body,
        cta_label = excluded.cta_label,
        updated_at = now()`,
      [
        message.modelCode,
        message.variant,
        message.block1Title,
        message.block1Body,
        rootCause,
        message.palavraIntro ?? null,
        message.scriptureVerse ?? null,
        message.scriptureText ?? null,
        message.block2Title,
        message.block2Body,
        message.ctaLabel,
      ]
    );
  }
}

async function seedRogerioQuotes(client: PoolClient) {
  for (const quote of rogerioQuotes) {
    await client.query(
      `insert into rogerio_quotes (code, category, quote_text, source_label, model_code)
       values ($1, $2, $3, $4, $5)
       on conflict (code) do update set
         category = excluded.category,
         quote_text = excluded.quote_text,
         source_label = excluded.source_label,
         model_code = excluded.model_code`,
      [quote.code, quote.category, quote.quoteText, quote.sourceLabel, quote.modelCode ?? null]
    );
  }
}

async function seedActionLibrary(client: PoolClient) {
  for (const action of actions) {
    await client.query(
      `insert into acoes_library (
        codigo, bloco, titulo, descricao, modelos_obrigatorios, modelos_condicionais, fase_inicio, fase_fim, versao_introducao, definitiva, metadata
      ) values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10, $11::jsonb)
      on conflict (codigo) do update set
        bloco = excluded.bloco,
        titulo = excluded.titulo,
        descricao = excluded.descricao,
        modelos_obrigatorios = excluded.modelos_obrigatorios,
        modelos_condicionais = excluded.modelos_condicionais,
        fase_inicio = excluded.fase_inicio,
        fase_fim = excluded.fase_fim,
        versao_introducao = excluded.versao_introducao,
        definitiva = excluded.definitiva,
        metadata = excluded.metadata,
        updated_at = now()`,
      [
        action.codigo,
        action.bloco,
        action.titulo,
        action.descricao,
        JSON.stringify(action.modelosObrigatorios ?? []),
        JSON.stringify(action.modelosCondicionais ?? {}),
        action.faseInicio ?? null,
        action.faseFim ?? null,
        action.versaoIntroducao,
        action.definitiva ?? true,
        JSON.stringify(action.metadata ?? {}),
      ]
    );
  }
}

async function seedDevotionals(client: PoolClient) {
  for (const devotional of devotionals) {
    await client.query(
      `insert into devocionais (semana_numero, titulo, texto, versiculo, metadata)
       values ($1, $2, $3, $4, $5::jsonb)
       on conflict (semana_numero) do update set
         titulo = excluded.titulo,
         texto = excluded.texto,
         versiculo = excluded.versiculo,
         metadata = excluded.metadata,
         updated_at = now()`,
      [
        devotional.semanaNumero,
        devotional.titulo,
        devotional.texto,
        devotional.versiculo,
        JSON.stringify(devotional.metadata ?? {}),
      ]
    );
  }
}

async function seedRagDocuments(client: PoolClient) {
  for (const source of ragSources) {
    if (!existsSync(source.sourcePath)) {
      continue;
    }

    const rawText = normalizeText(readDocxAsText(source.sourcePath));
    if (!rawText) {
      continue;
    }

    const checksum = createHash('sha256').update(rawText).digest('hex');
    const documentId = await upsertRagDocument(client, {
      slug: source.slug,
      title: source.title,
      sourceType: source.sourceType,
      sourcePath: source.sourcePath,
      checksum,
      metadata: source.metadata,
      rawText,
    });

    await client.query(`delete from rag_chunks where document_id = $1`, [documentId]);

    const chunks = chunkText(rawText, 1400);
    for (const chunk of chunks) {
      await client.query(
        `insert into rag_chunks (document_id, chunk_index, heading, content, token_estimate, metadata)
         values ($1, $2, $3, $4, $5, $6::jsonb)`,
        [
          documentId,
          chunk.chunkIndex,
          chunk.heading,
          chunk.content,
          estimateTokens(chunk.content),
          JSON.stringify({ sourceSlug: source.slug }),
        ]
      );
    }
  }
}

async function upsertRagDocument(
  client: PoolClient,
  input: {
    slug: string;
    title: string;
    sourceType: 'docx' | 'html' | 'manual';
    sourcePath: string;
    checksum: string;
    metadata: Record<string, unknown>;
    rawText: string;
  }
) {
  const result = await client.query<{ id: string }>(
    `insert into rag_documents (slug, title, source_type, source_path, checksum, metadata, raw_text)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7)
     on conflict (slug) do update set
       title = excluded.title,
       source_type = excluded.source_type,
       source_path = excluded.source_path,
       checksum = excluded.checksum,
       metadata = excluded.metadata,
       raw_text = excluded.raw_text,
       updated_at = now()
     returning id`,
    [
      input.slug,
      input.title,
      input.sourceType,
      input.sourcePath,
      input.checksum,
      JSON.stringify(input.metadata),
      input.rawText,
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error(`Falha ao gravar documento RAG: ${input.slug}`);
  }

  return row.id;
}

function readDocxAsText(filePath: string) {
  return execFileSync('textutil', ['-convert', 'txt', '-stdout', filePath], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
}

function normalizeText(value: string) {
  return value
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function chunkText(text: string, maxChars: number) {
  const paragraphs = text.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const chunks: Array<{ chunkIndex: number; heading: string | null; content: string }> = [];
  let current = '';
  let currentHeading: string | null = null;

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length <= maxChars) {
      current = next;
      if (!currentHeading && looksLikeHeading(paragraph)) {
        currentHeading = paragraph.slice(0, 120);
      }
      continue;
    }

    if (current) {
      chunks.push({
        chunkIndex: chunks.length,
        heading: currentHeading,
        content: current,
      });
    }

    current = paragraph;
    currentHeading = looksLikeHeading(paragraph) ? paragraph.slice(0, 120) : null;
  }

  if (current) {
    chunks.push({
      chunkIndex: chunks.length,
      heading: currentHeading,
      content: current,
    });
  }

  return chunks;
}

function looksLikeHeading(value: string) {
  return value.length <= 120 && !value.includes('.') && value === value.toUpperCase();
}

function estimateTokens(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}
