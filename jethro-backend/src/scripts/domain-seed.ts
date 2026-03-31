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
  questionType: 'text' | 'textarea' | 'email' | 'phone' | 'single_select' | 'money_range' | 'number';
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
    label: 'Qual e o seu nome e sobrenome?',
    questionType: 'text',
    validation: { minLength: 3, minWords: 2, pattern: "^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$" },
  },
  {
    code: 'q2_area_atuacao',
    orderIndex: 2,
    label: 'Qual e a area de atuacao do seu negocio?',
    questionType: 'text',
    validation: { minLength: 3, maxLength: 100 },
  },
  {
    code: 'q3_whatsapp',
    orderIndex: 3,
    label: 'Qual e o seu numero de WhatsApp?',
    helperText: 'Usado para detectar o pais e adaptar as faixas de faturamento.',
    questionType: 'phone',
    validation: { minLength: 10 },
  },
  {
    code: 'q4_email',
    orderIndex: 4,
    label: 'Qual e o seu endereco de email?',
    questionType: 'email',
    validation: { maxLength: 150 },
  },
  {
    code: 'q5_fase_negocio',
    orderIndex: 5,
    label: 'Qual e a fase do seu negocio?',
    questionType: 'single_select',
    options: [
      { label: 'Ideia', value: 'A' },
      { label: 'Inicio (0-1 ano)', value: 'B' },
      { label: 'Em crescimento (1-3 anos)', value: 'C' },
      { label: 'Consolidado (3+ anos)', value: 'D' },
    ],
  },
  {
    code: 'q6_conexao_dons',
    orderIndex: 6,
    label: 'Voce sente que seu negocio esta conectado com seus dons e talentos?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, totalmente', value: 'A' },
      { label: 'Parcialmente', value: 'B' },
      { label: 'Nao, ainda nao', value: 'C' },
    ],
  },
  {
    code: 'q7_proposito_negocio',
    orderIndex: 7,
    label: 'Voce sabe exatamente qual e o proposito do seu negocio e como ele entrega valor?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, muito claro', value: 'A' },
      { label: 'Tenho ideia, mas nao esta definido', value: 'B' },
      { label: 'Nao tenho clareza', value: 'C' },
    ],
  },
  {
    code: 'q8_estrutura_negocio',
    orderIndex: 8,
    label: 'Seu negocio tem estrutura solida, com visao de futuro e planejamento estrategico?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, bem estruturado', value: 'A' },
      { label: 'Em desenvolvimento', value: 'B' },
      { label: 'Ainda nao', value: 'C' },
    ],
  },
  {
    code: 'q9_organizacao_financeira',
    orderIndex: 9,
    label: 'Como voce enxerga a organizacao financeira do seu negocio?',
    questionType: 'single_select',
    options: [
      { label: 'Estruturada', value: 'A' },
      { label: 'Basica', value: 'B' },
      { label: 'Desorganizada / Confusa', value: 'C' },
    ],
  },
  {
    code: 'q10_formalizacao',
    orderIndex: 10,
    label: 'Qual e a classificacao da formalizacao do seu negocio?',
    questionType: 'single_select',
    options: [
      { label: 'Informal', value: 'informal' },
      { label: 'Formalizada / empresa registrada', value: 'formalizada' },
      { label: 'Empresa de medio ou grande porte', value: 'medio_grande_porte' },
      { label: 'Ainda nao comecei', value: 'nao_comecou' },
      { label: 'Outro', value: 'outro' },
    ],
  },
  {
    code: 'q11_faturamento_mensal',
    orderIndex: 11,
    label: 'Qual e o faturamento medio mensal do seu negocio?',
    helperText: 'A moeda e exibida de acordo com o pais detectado no WhatsApp.',
    questionType: 'money_range',
    validation: { source: 'country_dynamic' },
  },
  {
    code: 'q12_lucro_crescimento',
    orderIndex: 12,
    label: 'Voce sente que o seu negocio esta gerando lucro e crescendo?',
    questionType: 'single_select',
    options: [
      { label: 'Sim, crescendo', value: 'A' },
      { label: 'Estavel, sem crescimento', value: 'B' },
      { label: 'Nao, estamos regredindo', value: 'C' },
    ],
  },
  {
    code: 'q13_objetivo_futuro',
    orderIndex: 13,
    label: 'Onde voce deseja estar com seu negocio nos proximos 6 a 12 meses?',
    questionType: 'textarea',
    validation: { minLength: 20, maxLength: 500 },
  },
  {
    code: 'q14_desafios',
    orderIndex: 14,
    label: 'Quais sao os 3 maiores desafios que voce esta enfrentando hoje no seu negocio?',
    questionType: 'textarea',
    validation: { minLength: 20, maxLength: 600 },
  },
  {
    code: 'q15_canal_aquisicao',
    orderIndex: 15,
    label: 'Como a maioria dos seus clientes chega ate voce hoje?',
    questionType: 'single_select',
    isRequired: false,
    isInternal: true,
    options: [
      { label: 'Instagram', value: 'B' },
      { label: 'Indicacao', value: 'A' },
      { label: 'Trafego pago', value: 'C' },
      { label: 'LinkedIn', value: 'D' },
      { label: 'Eu vou atras ativamente', value: 'E' },
      { label: 'Uso varios canais', value: 'F' },
      { label: 'Outro', value: 'G' },
    ],
  },
  {
    code: 'q16_capacidade_operacional',
    orderIndex: 16,
    label: 'Se o seu numero de clientes dobrasse amanha, o que aconteceria?',
    questionType: 'single_select',
    options: [
      { label: 'Daria conta normalmente', value: 'A' },
      { label: 'Precisaria reorganizar algumas partes', value: 'B' },
      { label: 'A operacao entraria em colapso', value: 'C' },
    ],
  },
  {
    code: 'q17_horas_semana',
    orderIndex: 17,
    label: 'Quantas horas por semana voce dedica ao seu negocio?',
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
    orderIndex: 18,
    label: 'Em que estado real esta a sua empresa ou produto hoje?',
    helperText: 'Pergunta adicionada no motor v2.4 para separar validacao de pre-inicio.',
    questionType: 'single_select',
    options: [
      { label: 'Ainda nao comecei', value: 'A' },
      { label: 'Ja tenho empresa ou produto em desenvolvimento', value: 'B' },
      { label: 'Tenho a ideia, mas ainda nao estruturei', value: 'C' },
      { label: 'Estou parado entre ideia e execucao', value: 'D' },
    ],
    metadata: { assumption: 'Pergunta inferida a partir do motor v2.4; confirmar wording final com o cliente.' },
  },
];

const diagnosticModels: DiagnosticModelSeed[] = [
  {
    code: 'I',
    name: 'Modelo I',
    title: 'Ainda nao comecou',
    summary: 'Perfil sem receita e sem empresa validada. O bloqueio principal ainda e sair da ideia para a execucao real.',
    priorityOrder: 0,
    rootCause: 'Ausencia de inicio real e validacao pratica.',
    pillars: ['P1', 'P2', 'P3'],
    triggerRules: ["Q11 = 'A' and Q18 in ['A','C','D']", "Fallback: Q11 = 'A' sem Q18 em payload legado"],
  },
  {
    code: 'E',
    name: 'Modelo E',
    title: 'Pre-receita ou validacao inicial',
    summary: 'Ja existe movimento, mas ainda nao ha validacao forte de mercado nem estrutura comercial confiavel.',
    priorityOrder: 1,
    rootCause: 'Negocio em fase inicial, com validacao fraca ou ainda dependente do circulo proximo.',
    pillars: ['P1', 'P2', 'P3'],
    triggerRules: ["Q11 = 'A' and Q18 = 'B'", "Q5 <= 'B' and Q11 = 'B' and Q15 = 'A'"],
  },
  {
    code: 'G',
    name: 'Modelo G',
    title: 'Operacao no limite',
    summary: 'O negocio vende, mas a estrutura nao suporta crescimento sem caos, atrasos ou quebra de qualidade.',
    priorityOrder: 2,
    rootCause: 'Capacidade operacional insuficiente para sustentar escala.',
    pillars: ['P4', 'P6', 'P5'],
    triggerRules: ["Q11 >= 'C' and Q16 = 'C'"],
  },
  {
    code: 'D',
    name: 'Modelo D',
    title: 'Fatura mas sangra',
    summary: 'Existe receita, porem o negocio opera com margem ruim, prejuizo ou crescimento que nao sobra no caixa.',
    priorityOrder: 3,
    rootCause: 'Vazamento financeiro e estrutura economica fragil.',
    pillars: ['P5', 'P4', 'P6'],
    triggerRules: ["Q11 >= 'B' and Q12 = 'C'"],
  },
  {
    code: 'H',
    name: 'Modelo H',
    title: 'O gargalo e o dono',
    summary: 'O negocio depende excessivamente do fundador, que trabalha demais e centraliza tudo.',
    priorityOrder: 4,
    rootCause: 'Falta de governo pessoal, delegacao e rotina de decisao.',
    pillars: ['P1', 'P4', 'P6'],
    triggerRules: ["Q17 = 'D' and Q11 >= 'B'", "Ajustar quando a escala final de horas for confirmada no app"],
  },
  {
    code: 'A',
    name: 'Modelo A',
    title: 'Negocio travado, baguncado e sem visao',
    summary: 'Ha caos financeiro, pouca estrutura e ausencia de direcao clara. O negocio precisa recomecar pela base.',
    priorityOrder: 5,
    rootCause: 'Caos de gestao com falta de clareza e governo semanal.',
    pillars: ['P5', 'P3', 'P4'],
    triggerRules: ["Q9 = 'C' and Q8 in ['B','C'] and Q12 in ['B','C'] and (Q6 = 'C' or Q7 = 'C')"],
  },
  {
    code: 'F',
    name: 'Modelo F',
    title: 'Vende, mas sem motor comercial',
    summary: 'O negocio depende de indicacao ou boca a boca e nao possui um sistema previsivel de aquisicao.',
    priorityOrder: 6,
    rootCause: 'Ausencia de motor comercial estruturado.',
    pillars: ['P6', 'P2', 'P5'],
    triggerRules: ["Q11 >= 'B' and Q15 = 'A' and Q12 in ['B','C']"],
  },
  {
    code: 'C',
    name: 'Modelo C',
    title: 'Boa base, mas caixa apertado',
    summary: 'Existe alinhamento de proposito, mas falta modelo economico e sistema para transformar isso em prosperidade sustentavel.',
    priorityOrder: 7,
    rootCause: 'Boa intencao sem traducao operacional e financeira suficiente.',
    pillars: ['P3', 'P5', 'P2'],
    triggerRules: ["Q6 in ['A','B'] and Q7 in ['A','B'] and Q9 in ['B','C'] and Q12 in ['B','C']"],
  },
  {
    code: 'B',
    name: 'Modelo B',
    title: 'Negocio saudavel, mas travado no plato',
    summary: 'A operacao funciona, mas o crescimento parou. O negocio precisa de multiplicacao e sistema de aquisicao.',
    priorityOrder: 8,
    rootCause: 'Ausencia de motor de crescimento e esteira de oferta.',
    pillars: ['P6', 'P2', 'P4'],
    triggerRules: ["Q9 in ['A','B'] and Q8 in ['A','B'] and Q11 >= 'B' and Q12 = 'B' and Q15 <> 'A'"],
  },
];

const diagnosticMessages: DiagnosticMessageSeed[] = [
  // ─── MODELO A — Negócio Travado + Financeiro Bagunçado + Sem Visão ───────────
  {
    modelCode: 'A',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o seu negócio está gritando — e você ainda não ouviu.\n' +
      'Você trabalha. Às vezes até demais. Mas quando para e olha para os números... o silêncio constrange.\n' +
      'Não é falta de esforço. É falta de governo.\n' +
      'Seu diagnóstico revela três feridas abertas:\n' +
      '→ Financeiro confuso — você não sabe quanto sobra, se é que sobra\n' +
      '→ Metas soltas — decisões no feeling, sem painel, sem ritmo\n' +
      '→ Sem rota — cada semana parece recomeçar do zero',
    rootCause: 'caos financeiro + ausência de direção + falta de governo semanal',
    palavraIntro: 'Deus é Deus de ordem — e onde há desordem, a prosperidade não pousa.',
    scriptureVerse: '1 Coríntios 14:40',
    scriptureText: 'Tudo, porém, seja feito com decência e ordem.',
    block2Title: 'O que acontece se você continuar assim?',
    block2Body:
      'Se nada mudar nos próximos 90 dias, o padrão se aprofunda:\n' +
      '⚠ Você continuará trabalhando muito para provar pouco\n' +
      '⚠ O caixa continuará mandando em você — não o contrário\n' +
      '⚠ A família sentirá o peso do que o negócio drena\n' +
      '⚠ E um dia você vai olhar para trás e perceber que anos se foram no mesmo ciclo\n\n' +
      '"Sem visão o povo perece." — Provérbios 29:18\n' +
      'Não é poesia. É diagnóstico.\n\n' +
      "Você vai continuar chamando isso de 'fase'... ou vai agir antes que vire destino?",
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'A',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o problema não é o mercado. É o espelho.\n' +
      'Você já sentiu aquela sensação de correr em círculos? Esforço máximo, resultado mínimo.\n' +
      'O diagnóstico do Jethro identificou algo preciso no seu negócio:\n' +
      '→ Números que você evita olhar — porque sabe que não vai gostar\n' +
      '→ Decisões tomadas na emoção do mês, não na inteligência do plano\n' +
      '→ Um negócio que sobrevive — mas não avança',
    rootCause: 'ausência de painel de governo + falta de cadência estratégica',
    palavraIntro:
      'Prosperidade sem governo vira ansiedade. Deus quer te ver prosperar com paz — e isso exige ordem.',
    scriptureVerse: 'Provérbios 21:5',
    scriptureText: 'Os planos do diligente tendem para a abundância.',
    block2Title: 'O precipício que poucos enxergam a tempo:',
    block2Body:
      'O risco aqui não é quebrar de repente. É pior: é continuar por anos no mesmo lugar — e um dia perceber que desperdiçou tempo, energia e chamado.\n' +
      '⚠ Negócio estagnado → renda estagnada → visão que murcha\n' +
      '⚠ Gestor reativo → desgaste → família que sente o peso\n' +
      '⚠ Fé com esforço, mas sem fruto visível → crise de identidade\n\n' +
      '"Onde não há visão profética o povo se solta." — Provérbios 29:18\n\n' +
      'Você quer continuar sendo governado pelo mês... ou quer aprender a governar o mês?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'A',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], você está construindo em cima de areia — e sente isso.\n' +
      'Há uma diferença entre empreendedor ocupado e empreendedor que governa.\n' +
      'Seu diagnóstico mostra que hoje você está no primeiro grupo. Não por falta de vontade — mas por falta de estrutura:\n' +
      '→ Sem clareza financeira: o dinheiro entra, sai e some sem rastro\n' +
      '→ Sem plano claro: você reage ao que aparece, não ao que planejou\n' +
      '→ Sem rota de 90 dias: cada mês começa como se fosse o primeiro',
    rootCause: 'gestão reativa disfarçada de dedicação',
    palavraIntro:
      "Jetro disse a Moisés: 'Você se consumirá, você e este povo.' Aquela palavra é para você hoje.",
    scriptureVerse: 'Êxodo 18:18',
    scriptureText: 'Certamente definhará, tanto você como este povo que está contigo.',
    block2Title: 'O que está em jogo se você não mudar agora:',
    block2Body:
      'Não estamos falando só de números. Estamos falando de:\n' +
      '⚠ Sua saúde emocional — desgaste silencioso que acumula\n' +
      '⚠ Sua autoridade em casa — quando o negócio pressiona, a família sente\n' +
      '⚠ Seu chamado — o que Deus depositou em você merece fundamento real\n' +
      '⚠ Seu testemunho — empreendedor cristão que não prospera não inspira\n\n' +
      '"O prudente vê o perigo e se esconde; o inexperiente segue em frente e sofre as consequências." — Provérbios 22:3\n\n' +
      'Você vai esperar a conta chegar... ou vai escolher sabedoria agora?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },

  // ─── MODELO B — Negócio Saudável, Mas Travado no Platô ──────────────────────
  {
    modelCode: 'B',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], você construiu algo que funciona. Agora precisa de algo que multiplica.\n' +
      'Parabéns pelo que já existe. Operação funciona. Entrega acontece. Você chegou longe.\n' +
      'Mas há um sinal que o Jethro identificou no seu negócio — e ele precisa ser endereçado agora:\n' +
      '→ O crescimento travou — mesma receita, mesmos clientes, mesmos canais\n' +
      "→ Você sente que 'está tudo certo... menos o avanço'\n" +
      '→ O esforço aumentou, mas o resultado não acompanhou',
    rootCause: 'falta motor de multiplicação — aquisição + oferta + recorrência + metas',
    palavraIntro:
      'Talentos enterrados não honram quem os deu. O Senhor espera fruto — não só preservação.',
    scriptureVerse: 'Mateus 25:27',
    scriptureText:
      'Devias ter entregado o meu dinheiro aos banqueiros, e eu, quando viesse, receberia o que é meu com juros.',
    block2Title: 'O que acontece com quem fica no platô por muito tempo:',
    block2Body:
      'O platô parece seguro. Mas tem uma física própria:\n' +
      '⚠ Seu custo fixo sobe — mesmo sem crescer\n' +
      '⚠ Seu mercado muda — mesmo você ficando no mesmo lugar\n' +
      "⚠ Seus concorrentes evoluem — enquanto você 'mantém'\n" +
      "⚠ E um dia o 'negócio ok' vira 'negócio em risco'\n\n" +
      '"O preguiçoso não lavra no outono; na ceifa procura, e não há nada." — Provérbios 20:4\n' +
      'Platô prolongado é procrastinação estratégica.\n\n' +
      "Você vai ficar 'bem' enquanto o mercado passa... ou vai decidir ser grande?",
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'B',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o que te trouxe até aqui não te leva pro próximo nível.\n' +
      'Há uma lei no mundo dos negócios que ninguém te avisa: o que funciona hoje tem prazo de validade.\n' +
      'Seu diagnóstico mostra um padrão específico:\n' +
      '→ Você tem estrutura, mas não tem aceleração\n' +
      '→ Tem clientes, mas não tem sistema de aquisição previsível\n' +
      '→ Tem resultado, mas não tem escada de crescimento',
    rootCause: 'crescimento sem sistema — funil sem rotina, oferta sem esteira',
    palavraIntro:
      "Multiplicação é princípio bíblico — não opcional. 'Sede fecundos e multiplicai-vos.'",
    scriptureVerse: 'Gênesis 1:28',
    scriptureText: 'Sede fecundos, multiplicai-vos.',
    block2Title: 'O custo invisível do platô:',
    block2Body:
      'Você não perde de uma vez. Perde aos poucos — e isso é mais perigoso:\n' +
      '⚠ Motivação que cai sem razão aparente\n' +
      '⚠ Equipe que sente a estagnação antes de você\n' +
      '⚠ Oportunidades que passam porque você não tem estrutura para capturar\n' +
      "⚠ Um negócio que entra em declínio silencioso enquanto parece 'estável'\n\n" +
      '"O negligente no seu trabalho é irmão do que desperdiça." — Provérbios 18:9\n\n' +
      'Você vai repetir o mesmo ano mais uma vez... ou vai comprar a rota para o próximo nível?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'B',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o mercado não espera. E o seu potencial também não pode esperar.\n' +
      'Existe uma diferença entre negócio que funciona e negócio que multiplica.\n' +
      'O Jethro identificou que você está no primeiro — e tem tudo para estar no segundo:\n' +
      '→ Canal de aquisição fraco ou dependente de acaso\n' +
      '→ Oferta sem escada — falta entrada, principal e recorrência\n' +
      '→ Meta sem sistema — esforço sem método não escala',
    rootCause: 'ausência de motor de crescimento estruturado',
    palavraIntro:
      'A parábola dos talentos não é sobre preservar — é sobre multiplicar. Deus é sócio que espera retorno.',
    scriptureVerse: 'Mateus 25:29',
    scriptureText: 'A quem tem, mais lhe será dado; mas ao que não tem, até o que tem lhe será tirado.',
    block2Title: 'Se o platô continuar nos próximos 6 meses:',
    block2Body:
      'O cenário não é dramático. É silencioso — e por isso mais perigoso:\n' +
      '⚠ Você vai trabalhar igual e ganhar menos em termos reais\n' +
      '⚠ A inflação e os custos vão corroer sua margem sem aviso\n' +
      '⚠ E você vai acordar um dia com a sensação de que trabalhou anos pra nada\n\n' +
      '"Há quem pareça rico e não tem nada; e quem pareça pobre e tem grandes riquezas." — Provérbios 13:7\n' +
      'Estagnação com aparência de estabilidade é o pior dos cenários.\n\n' +
      'Você quer continuar parecendo que está bem... ou quer realmente multiplicar o que Deus te deu?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },

  // ─── MODELO C — Boa Base, Mas Aperto de Caixa + Sem Visão ───────────────────
  {
    modelCode: 'C',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], você tem o coração certo. Falta o sistema que sustenta.\n' +
      'Você entrega valor. Você tem propósito. Você cuida das pessoas.\n' +
      'E ainda assim, todo mês é uma luta silenciosa com o caixa.\n' +
      'O Jethro identificou a raiz disso:\n' +
      '→ Você cobra menos do que entrega — e todo mês o caixa prova isso\n' +
      '→ O fluxo financeiro é uma corda bamba — aperta, você dá desconto\n' +
      '→ A visão existe no coração, mas não existe no papel como plano real',
    rootCause: 'propósito sem modelo financeiro + caixa sem governo',
    palavraIntro:
      'Deus honra o chamado com provisão — mas a provisão exige mordomia. Cuida do rebanho e conhece o estado de teu ganho.',
    scriptureVerse: 'Provérbios 27:23',
    scriptureText: 'Cuida bem de teu rebanho, tem atenção ao teu gado.',
    block2Title: 'O que o aperto crônico faz com quem tem chamado:',
    block2Body:
      'O caixa apertado não machuca só o banco. Machuca a alma:\n' +
      '⚠ Você começa a aceitar clientes errados — só pra pagar conta\n' +
      '⚠ Você para de sonhar grande porque o presente é sufocante\n' +
      "⚠ Você duvida do chamado — 'se Deus me chamou, por que apertar tanto?'\n" +
      '⚠ E o propósito que era chama vira brasa que mal aquece\n\n' +
      '"O rico domina os pobres, e o que toma emprestado é servo do que empresta." — Provérbios 22:7\n' +
      'Aperto de caixa rouba liberdade — e liberdade é parte do chamado.\n\n' +
      'Você vai continuar sendo governado pelo boleto... ou vai retomar o governo do seu chamado?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'C',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o problema não é o quanto você vale. É o quanto você está cobrando.\n' +
      'Existe uma injustiça silenciosa acontecendo no seu negócio.\n' +
      'Você entrega mais do que cobra — e o mercado aproveita isso.\n' +
      'Seu diagnóstico revela com precisão:\n' +
      '→ Precificação abaixo do valor real entregue\n' +
      '→ Condições de pagamento que drenam o caixa antes de completar o ciclo\n' +
      "→ Falta de visão estratégica de 90 dias — você vive no 'agora'",
    rootCause: 'valor sem modelo + caixa sem regra',
    palavraIntro:
      'Jesus ensinou sobre mordomia — não sobre se sacrificar por quem não valoriza. Você foi chamado para prosperar, não apenas servir no limite.',
    scriptureVerse: 'João 10:10',
    scriptureText:
      'O ladrão vem apenas para roubar, matar e destruir; eu vim para que tenham vida e a tenham em abundância.',
    block2Title: 'O que acontece com quem vive no limite por muito tempo:',
    block2Body:
      'O aperto crônico tem um custo que vai além do financeiro:\n' +
      '⚠ Desgaste que acumula até virar esgotamento\n' +
      '⚠ Decisões tomadas no medo — não na fé e estratégia\n' +
      '⚠ Relacionamentos que sentem o peso do que você carrega\n' +
      '⚠ Uma vida abundante que Deus prometeu sendo trocada por sobrevivência\n\n' +
      '"Filho, não te esqueças da minha lei; e o teu coração guarde os meus mandamentos, porque eles aumentarão os teus dias." — Provérbios 3:1-2\n' +
      'Guardar a sabedoria financeira é ato de fé, não de frieza.\n\n' +
      'Você quer continuar entregando ouro e recebendo bronze... ou vai reposicionar o que você vale?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'C',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], propósito sem sustentabilidade não é humildade. É risco.\n' +
      'Há uma crença no meio cristão que precisa ser quebrada: que cobrar menos é mais espiritual.\n' +
      'O Jethro identificou que essa crença está custando caro ao seu negócio:\n' +
      '→ Caixa que aperta todo mês — não por falta de clientes, mas por falta de margem\n' +
      '→ Visão que existe, mas não tem rota — fica no sonho sem se tornar plano\n' +
      '→ Um negócio que serve bem mas não se sustenta bem',
    rootCause: 'ausência de modelo financeiro sustentável + precificação abaixo do valor',
    palavraIntro:
      'Jetro ensinou Moisés a estruturar — porque missão sem estrutura colapsa. Você precisa das mesmas palavras hoje.',
    scriptureVerse: 'Êxodo 18:18',
    scriptureText:
      'Certamente definharás, tanto tu como este povo que está contigo; porque este trabalho é pesado demais para ti.',
    block2Title: 'O precipício do bom coração sem governo financeiro:',
    block2Body:
      'Quando propósito e sistema não andam juntos, o destino é sempre o mesmo:\n' +
      '⚠ Você esgota — e o negócio para com você\n' +
      '⚠ Você toma decisões reativas — e abre mão de clientes, produtos e padrões que importam\n' +
      '⚠ O testemunho que deveria ser de prosperidade vira de sobrevivência\n\n' +
      '"Honra ao Senhor com os teus bens." — Provérbios 3:9\n' +
      'Honrar com os bens exige ter bens — e isso exige governo.\n\n' +
      'Você vai continuar pagando o preço da generosidade sem sistema... ou vai construir sustentabilidade para o seu chamado?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },

  // ─── MODELO D — Fatura, Mas Sangra — Ilusão de Faturamento ─────────────────
  {
    modelCode: 'D',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], você está correndo em direção a uma parede — e chamando isso de crescimento.\n' +
      'Existe um tipo de falência que não avisa. Ela não chega com a empresa vazia.\n' +
      'Ela chega com a empresa cheia de clientes, cheia de movimento — e sem dinheiro no final.\n' +
      'O Jethro identificou exatamente isso no seu negócio:\n' +
      '→ Faturamento existe — lucro é ilusão\n' +
      '→ Você não sabe a margem real de cada produto ou serviço\n' +
      '→ O dinheiro entra, circula e some antes de você sentir que existiu',
    rootCause: 'custo invisível + precificação sem margem + ilusão de faturamento',
    palavraIntro:
      'Faturamento sem lucro não é bênção — é trabalho em vão. Deus chama ao fruto real, não à aparência de produtividade.',
    scriptureVerse: 'Lucas 14:28',
    scriptureText: 'Qual de vocês, querendo construir uma torre, não se senta primeiro para calcular o custo?',
    block2Title: 'O que acontece quando o sangramento continua:',
    block2Body:
      'A lógica é cruel mas precisa:\n' +
      '⚠ Mais vendas → mais operação → mais custo → menos lucro\n' +
      '⚠ Menos lucro → mais pressão → mais desconto → mais sangramento\n' +
      '⚠ Mais sangramento → caixa negativo → crise → colapso\n\n' +
      '"O prudente vê o perigo e se esconde; o inexperiente segue em frente e sofre as consequências." — Provérbios 22:3\n' +
      'Você está vendo o perigo agora. A decisão é sua.\n\n' +
      'Você quer continuar crescendo o faturamento... ou quer começar a crescer o lucro?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'D',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o seu negócio pode estar te enganando.\n' +
      'Número bonito no extrato. Sensação feia no bolso.\n' +
      'Esse é o perfil mais perigoso do mundo empresarial — porque a dor é real mas o diagnóstico é invisível.\n' +
      'O Jethro identificou com precisão o que está acontecendo:\n' +
      '→ Desconto virou hábito — e cada desconto tem um custo que você não calcula\n' +
      '→ Custo fixo cresceu com o negócio — mas a margem não acompanhou\n' +
      '→ Você não sabe qual produto ou serviço paga a conta — e qual está te custando',
    rootCause: 'precificação sem lógica + custo invisível + ausência de DRE real',
    palavraIntro:
      "Prosperidade bíblica tem paz, ordem e resultado — não ilusão. 'A bênção do Senhor enriquece, e não acrescenta tristeza com ela.'",
    scriptureVerse: 'Provérbios 10:22',
    scriptureText: 'A bênção do Senhor enriquece, e não acrescenta tristeza com ela.',
    block2Title: 'O que está em jogo nos próximos 90 dias:',
    block2Body:
      'Se o padrão continuar, três consequências são certas:\n' +
      '⚠ O caixa vai apertar de forma que você não conseguirá esconder\n' +
      '⚠ Você será forçado a tomar decisões de desespero — não de estratégia\n' +
      '⚠ E quando a crise vier, ela virá com pressa — porque o sangramento silencioso não avisa hora\n\n' +
      '"Há caminhos que ao homem parecem direitos, mas ao fim deles há caminhos de morte." — Provérbios 14:12\n' +
      'Faturamento que parece vitória pode ser o caminho para a falência.\n\n' +
      'Você vai esperar o caixa gritar para ouvir a verdade... ou vai agir agora que o Jethro te mostrou?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'D',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], trabalhar para sustentar vazamento é a armadilha mais cruel do empreendedorismo.\n' +
      'Você acorda cedo. Trabalha até tarde. Vende.\n' +
      'E no final do mês — nada sobra.\n' +
      'Não é falta de esforço. É falta de margem. E o Jethro identificou exatamente onde está o buraco:\n' +
      '→ Você não sabe o custo real de cada hora trabalhada\n' +
      '→ A estrutura cresceu — mas o lucro por venda diminuiu\n' +
      '→ O mix de produtos/serviços tem itens que sangram e você ainda não sabe quais',
    rootCause: 'ausência de visão de margem por item + estrutura de custo descontrolada',
    palavraIntro: 'Mordomia é saber o que entra e o que sai. Sem isso, não há como ser fiel no muito.',
    scriptureVerse: 'Lucas 16:10',
    scriptureText: 'Quem é fiel no mínimo também é fiel no muito.',
    block2Title: 'O destino de quem não resolve o sangramento:',
    block2Body:
      'A conta chega — e quando chega, ela cobra com juros:\n' +
      '⚠ Você acumula dívidas para sustentar uma operação que não dá lucro\n' +
      '⚠ Sua reserva vai a zero — e o primeiro imprevisto derruba tudo\n' +
      '⚠ E o negócio que você construiu com fé e suor fecha — não por falta de cliente, mas por falta de margem\n\n' +
      '"O devedor é escravo do credor." — Provérbios 22:7\n' +
      'Sangramento não corrigido vira escravidão financeira.\n\n' +
      'Você vai continuar trabalhando para sustentar o vazamento... ou vai fechar o buraco agora?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },

  // ─── MODELO E — Pré-Receita — Ainda Não Validou no Mercado ─────────────────
  {
    modelCode: 'E',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], a semente existe. Falta plantar — de verdade.\n' +
      'Você tem ideia. Tem vontade. Às vezes até tem público.\n' +
      'Mas ainda não tem o que o mercado reconhece como real: a venda consistente.\n' +
      'O Jethro identificou onde você está preso:\n' +
      '→ A oferta ainda não está clara o suficiente para o mercado dizer sim\n' +
      '→ O canal não está testado — as vendas que existem vieram da rede pessoal, não do mercado\n' +
      '→ A rotina de primeira venda ainda não foi instalada',
    rootCause: 'validação fraca + oferta não posicionada + execução travada',
    palavraIntro: 'Fé sem obra é morta. O Senhor não bênça semente que ninguém plantou.',
    scriptureVerse: 'Tiago 2:17',
    scriptureText: 'A fé sem obras é morta.',
    block2Title: "O risco do 'quase começando' que dura meses:",
    block2Body:
      'Existe um padrão perigoso nesta fase — e o Jethro o reconhece:\n' +
      '⚠ Cada semana tem um ajuste novo na oferta — mas nenhuma venda\n' +
      '⚠ O medo de aparecer vira medo de falhar vira paralisação\n' +
      '⚠ O tempo passa, a confiança cai — e o chamado começa a parecer ilusão\n\n' +
      '"Quem observa o vento não semeará, e quem olha as nuvens não segará." — Eclesiastes 11:4\n' +
      'Esperar a hora perfeita é a desculpa mais comum para não entrar no jogo.\n\n' +
      'Você vai continuar se preparando para começar... ou vai começar de verdade?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'E',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o mundo não compra potencial. Compra oferta clara.\n' +
      'Você pode ter o maior talento do mercado.\n' +
      'Mas se o mercado não consegue entender o que você vende, para quem e qual resultado entrega — o talento fica sem palco.\n' +
      'O diagnóstico revelou:\n' +
      '→ Sua oferta ainda não está em 1 frase que gera decisão de compra\n' +
      '→ Você ainda não testou canais de aquisição fora da sua rede pessoal\n' +
      '→ A rotina de prospecção não existe — e sem rotina, não há consistência',
    rootCause: 'oferta não posicionada + canal não validado + rotina ausente',
    palavraIntro:
      'Deus deu dons para servir — mas servir exige aparecer, oferecer e ser pago pelo valor entregue.',
    scriptureVerse: 'Provérbios 18:16',
    scriptureText: 'O dom do homem abre caminho para ele e o leva à presença dos grandes.',
    block2Title: "O que o 'eterno começo' está custando:",
    block2Body:
      'Cada mês sem venda consistente tem um custo triplo:\n' +
      '⚠ Financeiro: você financia o negócio do próprio bolso sem retorno\n' +
      '⚠ Emocional: a autoconfiança vai diminuindo com cada semana sem resultado\n' +
      '⚠ Espiritual: você começa a questionar se o chamado era real — quando o problema é só o método\n\n' +
      '"O preguiçoso diz: há um leão lá fora, serei morto na praça." — Provérbios 22:13\n' +
      'Todo obstáculo parece maior quando você ainda não entrou no jogo.\n\n' +
      'Você vai continuar esperando estar pronto... ou vai descobrir que pronto se aprende fazendo?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'E',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o seu maior inimigo agora não é o mercado. É o adiamento.\n' +
      'Há um vírus silencioso que mata mais negócios do que concorrência, crise ou falta de dinheiro.\n' +
      "Ele se chama 'ainda não estou pronto'.\n" +
      'O Jethro identificou que você está nessa armadilha:\n' +
      '→ Você ajusta a oferta — mas não vende\n' +
      '→ Você estuda o mercado — mas não testa\n' +
      '→ Você acredita no chamado — mas não age com consistência',
    rootCause: 'medo de rejeição disfarçado de preparo + ausência de método de primeira venda',
    palavraIntro:
      'Deus chamou Pedro para sair do barco — não para estudar a física da água. A fé que multiplica é a que pisa no mar.',
    scriptureVerse: 'Mateus 14:29',
    scriptureText: 'Pedro saiu do barco e andou sobre as águas em direção a Jesus.',
    block2Title: 'Se o padrão de adiamento continuar:',
    block2Body:
      'O risco não é imediato. É progressivo — e por isso mais destrutivo:\n' +
      "⚠ 6 meses: você ainda está 'quase pronto' — com mais conhecimento e menos confiança\n" +
      '⚠ 1 ano: a janela de mercado que existia pode ter fechado\n' +
      '⚠ 2 anos: o sonho começa a parecer ingênuo — mas o problema era só método\n\n' +
      '"Tudo tem o seu tempo determinado; há tempo para todo propósito debaixo do céu." — Eclesiastes 3:1\n' +
      'O seu tempo é agora — não quando você sentir que está perfeito.\n\n' +
      'Você vai continuar adiando a sua história... ou vai dar o primeiro passo com método e acompanhamento?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },

  // ─── MODELO F — Vende, Mas Sem Motor — Depende de Indicação ─────────────────
  {
    modelCode: 'F',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], você tem negócio. Não tem sistema. E essa diferença está custando caro.\n' +
      'Mês bom. Mês ruim. Mês bom. Mês ruim.\n' +
      'Você conhece esse ritmo. É a montanha-russa do empreendedor que depende do acaso para vender.\n' +
      'O Jethro identificou a raiz desse padrão:\n' +
      '→ Quase 100% dos clientes chegam por indicação — e indicação não escala\n' +
      '→ Você não tem processo de vendas definido — cada fechamento é um improviso\n' +
      '→ Não há rotina de aquisição — sem prospecção ativa, você espera o mercado te achar',
    rootCause: 'ausência de motor comercial — aquisição + funil + follow-up + recorrência',
    palavraIntro:
      'Prudência é construir o que não depende do vento. Indicação é vento — boa quando aparece, mortal quando some.',
    scriptureVerse: 'Provérbios 22:3',
    scriptureText: 'O homem prudente vê o mal e se esconde.',
    block2Title: 'O que acontece quando a indicação seca:',
    block2Body:
      'E ela vai secar. Não é pessimismo — é física de mercado:\n' +
      '⚠ Você aceita clientes que não deveria — porque precisa do caixa\n' +
      '⚠ Você baixa o preço — porque a alternativa é não fechar\n' +
      '⚠ Você acorda às 3h — porque a próxima venda não tem data para chegar\n' +
      '⚠ E o negócio que era chamado começa a parecer fardo\n\n' +
      '"O negligente no seu trabalho é irmão do que desperdiça." — Provérbios 18:9\n' +
      'Depender só de indicação é negligenciar o motor do crescimento.\n\n' +
      'Você vai continuar vivendo de milagre mensal... ou vai instalar um sistema que não depende de sorte?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'F',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], você provou que sabe entregar. Agora precisa provar que sabe crescer.\n' +
      'Há dois tipos de negócio: o que vende quando aparece cliente — e o que vai buscar o cliente.\n' +
      'O Jethro identificou que você está no primeiro grupo:\n' +
      '→ Seu canal comercial é frágil — depende da boa vontade do mercado\n' +
      '→ Você não tem script de abordagem, funil de follow-up ou rotina de prospecção\n' +
      '→ O crescimento é instável porque o sistema de entrada não existe',
    rootCause: 'canal único e frágil + ausência de processo comercial repetível',
    palavraIntro:
      'Deus recompensa o diligente — mas diligência em vendas exige rotina, não rezar para aparecer cliente.',
    scriptureVerse: 'Provérbios 21:5',
    scriptureText:
      'Os planos do diligente tendem para a abundância; mas todo aquele que se apressa com ansiedade chega à pobreza.',
    block2Title: 'O que a instabilidade comercial produz a longo prazo:',
    block2Body:
      'Não é só o caixa que sofre:\n' +
      '⚠ Sua precificação fica comprometida — você não tem poder de negociação sem fluxo de leads\n' +
      '⚠ Sua autoestima empresarial oscila com o mês — isso não é sustentável\n' +
      '⚠ Sua capacidade de investir e crescer depende de meses que não se repetem\n\n' +
      '"Constrói a tua casa sobre a rocha." — Mateus 7:24\n' +
      'Negócio sem sistema comercial está edificado sobre areia.\n\n' +
      'Você vai continuar sendo refém da indicação... ou vai construir o motor que te liberta?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'F',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], seu negócio funciona quando você tem sorte. Precisa funcionar quando você tem sistema.\n' +
      'Existe uma palavra que define o que está faltando no seu comercial: previsibilidade.\n' +
      'Previsibilidade é saber que amanhã vai aparecer cliente — porque você construiu o caminho para isso.\n' +
      'O Jethro identificou que esse caminho ainda não existe:\n' +
      '→ Você não sabe quantos leads qualificados chegam por semana\n' +
      '→ Você não tem um processo definido de conversão de interessado em cliente\n' +
      '→ Você não tem recorrência ou esteira — cada venda começa do zero',
    rootCause: 'ausência do ciclo completo — atrair → converter → reter',
    palavraIntro:
      'Quem semeia com avareza, com avareza também ceifará. O motor comercial é a semeadura sistemática.',
    scriptureVerse: '2 Coríntios 9:6',
    scriptureText: 'O que semeia com parcimônia, com parcimônia também ceifará.',
    block2Title: 'O futuro de quem não instala o motor comercial:',
    block2Body:
      'A instabilidade tem um custo composto:\n' +
      '⚠ Cada mês ruim corrói a reserva que um mês bom construiu\n' +
      '⚠ A ansiedade de caixa vira estilo de vida — e estilos de vida se solidificam\n' +
      '⚠ E quando você finalmente quiser instalar o sistema, o terreno estará mais difícil\n\n' +
      '"Há tempo para todo propósito debaixo do céu." — Eclesiastes 3:1\n' +
      'O tempo para instalar o motor é agora — não depois que a seca chegar.\n\n' +
      'Você vai esperar o próximo mês ruim para agir... ou vai agir agora que ainda tem fôlego?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },

  // ─── MODELO G — Operação no Limite — Crescer Piora Tudo ─────────────────────
  {
    modelCode: 'G',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], você está num paradoxo perigoso: vender mais está te quebrando.\n' +
      'Existe uma fase onde o crescimento vira inimigo.\n' +
      'Quando a operação não tem estrutura para o que já existe, vender mais significa entregar pior.\n' +
      'O Jethro identificou exatamente esse ponto no seu negócio:\n' +
      '→ Sua capacidade operacional está no limite — mais demanda gera mais caos\n' +
      '→ Tudo passa por você — a equipe executa, mas depende das suas decisões\n' +
      '→ Não há processos documentados: o que funciona hoje não se repete amanhã',
    rootCause: 'ausência de sistema operacional — processo + padrão + capacidade estruturada',
    palavraIntro:
      'Sabedoria constrói a casa — não a preenche de qualquer forma. Estrutura é ato de fé, não de medo.',
    scriptureVerse: 'Provérbios 9:1',
    scriptureText: 'A sabedoria edificou a sua casa; lavrou as suas sete colunas.',
    block2Title: 'O que acontece quando a operação sem estrutura tenta crescer:',
    block2Body:
      'A lógica é matemática e implacável:\n' +
      '⚠ Mais vendas → mais atraso → mais reclamação\n' +
      '⚠ Mais reclamação → mais retrabalho → mais custo invisível\n' +
      '⚠ Mais custo → menos margem → crescimento que sangra\n' +
      '⚠ E no final: perda de reputação — que é o ativo mais difícil de recuperar\n\n' +
      '"Um bom nome é preferível às grandes riquezas." — Provérbios 22:1\n' +
      'Cresce sem estrutura e você pagará com o nome da sua empresa.\n\n' +
      'Você vai continuar crescendo o caos... ou vai primeiro construir a casa que aguenta o crescimento?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'G',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o seu gargalo não está no mercado. Está na sua operação.\n' +
      'Há negócios que param de vender porque o mercado recua.\n' +
      'O seu está num cenário diferente — e mais perigoso: você poderia vender mais, mas a operação não aguenta.\n' +
      'O diagnóstico revelou:\n' +
      '→ Você está escalando urgência, não sistema — cada entrega é um esforço novo\n' +
      '→ A equipe executa, mas sem padrão — e sem padrão, a qualidade oscila\n' +
      '→ O dono é o gargalo central: tudo trava quando você não está',
    rootCause: 'operação reativa + ausência de padrão + centralização excessiva no fundador',
    palavraIntro:
      'Jetro ensinou Moisés a delegar porque missão sem estrutura consome o líder e decepciona o povo.',
    scriptureVerse: 'Êxodo 18:18',
    scriptureText: 'Você certamente se consumirá, tanto você como este povo que está contigo.',
    block2Title: 'O que o teto operacional produz a médio prazo:',
    block2Body:
      'Se a estrutura não mudar antes da próxima onda de crescimento:\n' +
      '⚠ Você vai perder clientes que vieram — e contar com eles não terá base\n' +
      '⚠ Sua equipe vai desengajar — sem padrão, o melhor profissional não fica\n' +
      '⚠ Você vai se tornar prisioneiro da operação — sem férias, sem estratégia, sem visão\n\n' +
      '"Deus não é Deus de confusão, mas de paz." — 1 Coríntios 14:33\n' +
      'Uma operação em caos não glorifica o Deus de ordem.\n\n' +
      'Você vai continuar crescendo o problema... ou vai construir o sistema que multiplica sem implodir?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'G',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o seu negócio está crescendo por fora e sofrendo por dentro.\n' +
      'Para quem de fora olha, parece que está indo bem.\n' +
      'Para quem está dentro — você sabe a verdade: é correria, retrabalho, erro e improviso.\n' +
      'O Jethro mapeou com precisão o que está acontecendo:\n' +
      '→ Processos não documentados: cada entrega é uma reinvenção\n' +
      '→ Capacidade no limite: um pico de demanda coloca tudo em risco\n' +
      '→ Equipe sem autonomia: sem você, a operação trava',
    rootCause: 'estrutura que não acompanhou o crescimento — fundamento fraco para o prédio sendo erguido',
    palavraIntro:
      'Todo bom construtor assenta o fundamento antes de subir as paredes. Você está subindo paredes sem fundamento.',
    scriptureVerse: 'Mateus 7:24',
    scriptureText:
      'Qualquer, pois, que ouve estas minhas palavras e as pratica será comparado a um homem prudente que edificou a sua casa sobre a rocha.',
    block2Title: 'O precipício que aparece quando menos se espera:',
    block2Body:
      'Operação sem estrutura tem uma janela de tolerância — e quando ela fecha:\n' +
      '⚠ Um cliente grande que reclama e vai embora com ruído\n' +
      '⚠ Uma entrega que falha no momento mais visível\n' +
      '⚠ Uma equipe que pede demissão no pior momento possível\n\n' +
      '"A casa edificada sobre a areia: desabou, e foi grande a sua ruína." — Mateus 7:27\n' +
      'Estrutura não é burocracia — é proteção do que você construiu.\n\n' +
      'Você vai esperar o colapso para construir fundamento... ou vai agir antes que a parede caia?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },

  // ─── MODELO H — Gargalo É o Dono — Sem Governo Pessoal ──────────────────────
  {
    modelCode: 'H',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o seu negócio tem o tamanho do seu fôlego. E o seu fôlego está acabando.\n' +
      'Não há nada de errado com trabalhar duro.\n' +
      "O problema é quando 'trabalhar duro' virou o único modo de operação — e você parou de liderar para sobreviver.\n" +
      'O diagnóstico do Jethro identificou com clareza:\n' +
      '→ Você está dentro do negócio — não sobre ele. Operacional, não estratégico\n' +
      '→ Sua agenda não tem blocos protegidos: tudo é urgência, nada é prioridade\n' +
      '→ Você carrega o que deveria estar distribuído — e esse peso está fazendo o negócio parar de crescer',
    rootCause: 'ausência de governo pessoal — agenda, prioridade, delegação e ritmo semanal',
    palavraIntro:
      "Jetro disse isso a Moisés: 'O que fazes não é bom.' Às vezes a palavra mais profética é a que fala da sua rotina.",
    scriptureVerse: 'Êxodo 18:17-18',
    scriptureText: 'O que fazes não é bom. Certamente definharás, tanto tu como este povo.',
    block2Title: 'O custo de um líder sem governo:',
    block2Body:
      'A conta não chega só no caixa. Ela chega em três lugares:\n' +
      '⚠ Na sua mente: dispersão, ansiedade, sensação de nunca estar fazendo o suficiente\n' +
      '⚠ No seu corpo: cansaço que não passa, saúde que cede\n' +
      '⚠ Na sua família: presença física sem presença real — e eles sentem a diferença\n\n' +
      '"Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei." — Mateus 11:28\n' +
      'Jesus não chamou ao esforço infinito. Chamou ao jugo certo — com método e descanso.\n\n' +
      'Você vai continuar confundindo sobrecarga com compromisso... ou vai aprender a liderar com governo?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'H',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], você está ocupado. Mas está avançando?\n' +
      'Existe uma armadilha sofisticada para empreendedores comprometidos.\n' +
      'Ela se chama: ocupação disfarçada de produtividade.\n' +
      'O diagnóstico identificou exatamente esse padrão:\n' +
      '→ Você trabalha mais de 60h por semana — e ainda sente que não deu conta\n' +
      '→ Não há ritual semanal de revisão e metas: você reage ao que aparece\n' +
      '→ O negócio não cresce porque você não tem tempo para pensar no crescimento — só para entregar',
    rootCause: 'falta de governo pessoal — dispersão + centralização + ausência de ritmo estratégico',
    palavraIntro:
      'Domínio próprio é fruto do Espírito — e sem domínio da agenda, o líder é governado pela urgência, não pelo propósito.',
    scriptureVerse: 'Provérbios 25:28',
    scriptureText: 'Como cidade aberta e sem muros, assim é o homem que não refreia o seu espírito.',
    block2Title: 'O que acontece com o líder sem governo por muito tempo:',
    block2Body:
      'A degradação é progressiva — e silenciosa até não ser:\n' +
      '⚠ Você perde as melhores decisões — porque toma decisões cansado\n' +
      '⚠ Você perde as melhores pessoas — porque líderes sobrecarregados não lideram bem\n' +
      '⚠ Você perde a visão — porque quem está apagando incêndio não consegue enxergar o horizonte\n\n' +
      '"O homem que não refreia o seu espírito é como uma cidade sem muros." — Provérbios 25:28\n' +
      'Sem governo pessoal, qualquer ataque penetra. Sua empresa fica vulnerável.\n\n' +
      'Você vai continuar sendo o gargalo do seu próprio chamado... ou vai se tornar o líder que o negócio precisa?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'H',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], quando o dono para, o negócio para. Isso não é liderança — é dependência.\n' +
      'Há um teste simples para saber se você é líder ou operário do seu próprio negócio:\n' +
      'Se você tirar 2 semanas de férias — o que acontece?\n' +
      'O Jethro identificou que a resposta para você é preocupante:\n' +
      '→ Tudo passa pelas suas mãos — decisão, execução, controle\n' +
      '→ A equipe não tem autonomia porque os processos não foram estruturados\n' +
      '→ Você é insubstituível — e isso, no negócio, é fraqueza, não força',
    rootCause: 'centralização excessiva + falta de estrutura de liderança + ausência de delegação real',
    palavraIntro:
      'Moisés tentou julgar o povo sozinho. Jetro interveio. O que te libertará hoje não é mais esforço — é estrutura de governo.',
    scriptureVerse: 'Êxodo 18:21-22',
    scriptureText: 'Escolhe dentre o povo homens capazes... e eles te ajudarão a carregar o fardo.',
    block2Title: 'O futuro de um negócio que depende integralmente do dono:',
    block2Body:
      'Três cenários possíveis — todos perigosos:\n' +
      '⚠ Você adoece: o negócio para — e as contas não param\n' +
      '⚠ Você quer crescer: mas não há estrutura que sustente o crescimento sem você\n' +
      '⚠ Você quer vender ou escalar: impossível — não existe negócio sem o fundador\n\n' +
      '"Há vitória na multidão de conselheiros." — Provérbios 11:14\n' +
      'Liderar sozinho não é força. É risco que você não precisa correr.\n\n' +
      'Você vai continuar sendo o teto do seu negócio... ou vai se tornar a plataforma que lança outros?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },

  // ─── MODELO I — Pré-Receita — Ainda Não Começou / Quer Iniciar ──────────────
  {
    modelCode: 'I',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o maior negócio que você pode abrir começa pelo método — não pela vontade.\n' +
      'Você tem a vontade. Provavelmente também tem o talento. E há algo dentro de você que sabe que chegou a hora.\n' +
      'Mas o Jethro identificou um padrão exato no seu diagnóstico — e ele precisa de ser nomeado antes que você dê o primeiro passo:\n' +
      '→ A sua rotina atual não tem espaço real para o que você quer construir\n' +
      '→ O MVP — a versão mínima da sua oferta — ainda não está escrito em lugar nenhum\n' +
      '→ Você ainda não foi ao mercado perguntar: existe aqui alguém disposto a pagar?',
    rootCause: 'rotina sem espaço para o projeto + MVP não documentado + validação inexistente',
    palavraIntro:
      "Planejamento não é desconfiança da providência — é honrar o que Deus colocou na sua mão.",
    scriptureVerse: 'Lucas 14:28',
    scriptureText: 'Quem de vós, querendo edificar uma torre, não se assenta primeiro a calcular a despesa?',
    block2Title: 'O que acontece a quem começa sem método:',
    block2Body:
      '⚠ Você trabalha meses num produto que o mercado não quer — e só descobre depois\n' +
      '⚠ Você investe tempo e dinheiro antes de ter uma única prova de que alguém paga\n' +
      '⚠ A motivação que parecia inabalável começa a ceder quando os primeiros meses não trazem resultado\n' +
      '⚠ E o chamado que era de Deus começa a parecer ingenuidade sua\n\n' +
      '"O prudente vê o perigo e se esconde; o inexperiente segue em frente e sofre as consequências." — Provérbios 22:3\n' +
      'Começar sem método não é fé. É imprudência disfarçada de coragem.\n\n' +
      'Você vai entrar no mercado às cegas... ou vai entrar com o mapa na mão?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'I',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o que está a travar o seu início não é o mercado. É a ausência de um sistema para começar.\n' +
      'Há dois tipos de empreendedor cristão que nunca chegam a lançar:\n' +
      'O que espera que esteja perfeito. E o que age sem saber o que faz.\n' +
      'O Jethro identificou o seu perfil — e há uma saída precisa:\n' +
      '→ Você não mapeou quanto tempo real tem por semana para este projeto\n' +
      '→ A sua oferta ainda não está testada fora do seu círculo pessoal\n' +
      '→ Você ainda não sabe quem são as pessoas que pagariam pela sua solução hoje',
    rootCause: 'tempo não mapeado + oferta não validada externamente + mercado-alvo desconhecido',
    palavraIntro: 'Deus não bênça o que você não plantou. A fé que age é a fé que recebe.',
    scriptureVerse: 'Eclesiastes 11:4',
    scriptureText: 'Quem observa o vento não semeará, e quem olha as nuvens não segará.',
    block2Title: 'O custo invisível de adiar o início:',
    block2Body:
      '⚠ Cada mês sem estrutura é um mês a financiar o negócio com energia — sem retorno\n' +
      '⚠ A janela de mercado que existe hoje pode não existir no próximo ano\n' +
      '⚠ A confiança que precisaria para agir vai diminuindo com cada semana de adiamento\n' +
      '⚠ E quando finalmente começar, terá que reconstruir o que podia ter construído hoje\n\n' +
      '"Tudo tem o seu tempo determinado; há tempo para todo propósito debaixo do céu." — Eclesiastes 3:1\n' +
      'O seu tempo é agora — não quando você se sentir completamente pronto.\n\n' +
      'Você vai continuar a esperar o momento certo... ou vai criar o método que faz o momento chegar?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
  {
    modelCode: 'I',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], você tem a visão. O que falta é o caminho entre onde está e onde quer chegar.\n' +
      'Existe uma diferença que a maioria dos empreendedores cristãos nunca percebe a tempo:\n' +
      'Ter uma chamada é diferente de ter um negócio.\n' +
      'A chamada vem de Deus. O negócio é construído por você — com método, com disciplina, com as ferramentas certas.\n' +
      '→ Você tem o chamado — mas ainda não tem a oferta escrita em linguagem de mercado\n' +
      '→ Você tem o talento — mas ainda não sabe quem paga por ele e quanto\n' +
      '→ Você tem o tempo disponível — mas ele não está organizado em torno do projeto',
    rootCause: 'visão sem estrutura operacional + oferta por definir + disponibilidade não alocada',
    palavraIntro:
      'A visão que não está escrita não tem endereço. Deus disse a Habacuque: escreve, para que quem a leia possa correr.',
    scriptureVerse: 'Habacuque 2:2',
    scriptureText: 'Escreve a visão e grava-a em tábuas, para que a possa ler correndo.',
    block2Title: 'O que acontece à visão sem estrutura:',
    block2Body:
      '⚠ Você investe anos num sonho que nunca se torna negócio — porque faltou o método\n' +
      '⚠ As pessoas à sua volta deixam de acreditar — porque o tempo passa e nada muda\n' +
      '⚠ E o pior: você começa a questionar se o chamado era real — quando o problema era apenas o caminho\n' +
      '⚠ O chamado não morre. Mas a janela de tempo para honrá-lo tem limite\n\n' +
      '"A esperança que se prolonga enfraquece o coração." — Provérbios 13:12\n' +
      'Visão sem plano não é fé — é desejo. E desejo sem método não gera fruto.\n\n' +
      'Você vai continuar a ter a visão... ou vai finalmente construir o caminho até ela?',
    ctaLabel: 'QUERO MEU PLANO DE AÇÃO',
  },
];

const diagnosticMessageRootCauses: Record<string, string> = {
  A: 'caos financeiro + ausência de direção + falta de governo semanal.',
  B: 'falta motor de multiplicação — aquisição + oferta + recorrência + metas.',
  C: 'propósito sem modelo financeiro + caixa sem governo.',
  D: 'custo invisível + precificação sem margem + ilusão de faturamento.',
  E: 'oferta sem validação real + canal sem prova + ausência de rotina de venda.',
  F: 'ausência de motor comercial estruturado.',
  G: 'ausência de sistema operacional — processo + padrão + capacidade estruturada.',
  H: 'centralização excessiva + falta de governo pessoal + delegação insuficiente.',
  I: 'falta de método inicial, validação prática e estrutura mínima para começar.',
};

const rogerioQuotes: RogerioQuoteSeed[] = [
  {
    code: 'RQ-001',
    category: 'diagnostic',
    quoteText: 'Crescimento financeiro sem crescimento pessoal e ilusao disfarçada de fe.',
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
    quoteText: 'A cenoura tem que estar a frente, nao atras.',
    sourceLabel: 'Alma v5.4 - COM-12',
  },
  {
    code: 'RQ-004',
    category: 'finance',
    quoteText: 'Nao sei quanto ganha o negocio.',
    sourceLabel: 'Alma v5.4 - FIN block',
    modelCode: 'A',
  },
  {
    code: 'RQ-005',
    category: 'finance',
    quoteText: 'A empresa e a minha conta.',
    sourceLabel: 'Alma v5.4 - FIN-10',
    modelCode: 'D',
  },
  {
    code: 'RQ-006',
    category: 'sales',
    quoteText: 'Todo mes e diferente.',
    sourceLabel: 'Alma v5.4 - COM-01',
    modelCode: 'F',
  },
  {
    code: 'RQ-007',
    category: 'diagnostic',
    quoteText: 'O diagnostico errado gera o plano errado.',
    sourceLabel: 'Logica 98pct',
  },
  {
    code: 'RQ-008',
    category: 'alma',
    quoteText: 'Deus e Deus de ordem e onde ha desordem, a prosperidade nao pousa.',
    sourceLabel: 'Mensagens diagnostico - Modelo A',
    modelCode: 'A',
  },
  {
    code: 'RQ-009',
    category: 'principle',
    quoteText: 'Governo precede multiplicacao.',
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
    quoteText: 'Cliente de 20 anos e prova social que nenhum anuncio compra.',
    sourceLabel: 'Alma v5.4 - COM-16',
  },
  {
    code: 'RQ-012',
    category: 'leadership',
    quoteText: 'Ninguem faz como eu faco.',
    sourceLabel: 'Alma v5.4 - LID-10',
  },
  {
    code: 'RQ-013',
    category: 'finance',
    quoteText: 'Nao sei quanto pago no dia 18 do proximo mes.',
    sourceLabel: 'Alma v5.4 - FIN-14',
  },
  {
    code: 'RQ-014',
    category: 'sales',
    quoteText: 'Coloquei uma meta mas o time nao sabe se esta batendo.',
    sourceLabel: 'Alma v5.4 - COM-21',
  },
  {
    code: 'RQ-015',
    category: 'alma',
    quoteText: 'Criou o padrao, criou pessoas-chatas para replicar o padrao e conseguiu avancar.',
    sourceLabel: 'Alma v5.4 - MET-36',
  },
];

const actions: ActionSeed[] = [
  {
    codigo: 'FIN-01-09',
    bloco: 'FIN',
    titulo: 'Acoes financeiras fundadoras',
    descricao:
      'Separacao PF/PJ, DRE simplificado, fluxo de caixa mensal, mapa de dividas, pro-labore fixo, reserva minima de caixa, precificacao por margem, ponto de equilibrio e relatorio mensal de fechamento.',
    faseInicio: 1,
    faseFim: 8,
    versaoIntroducao: 'v1.0',
    metadata: { gatilhos: ['Nao sei quanto ganha o negocio', 'Mistura conta da empresa com a pessoal', 'Nunca sobra nada'] },
  },
  {
    codigo: 'FIN-10',
    bloco: 'FIN',
    titulo: 'Estruturacao da politica de retirada',
    descricao:
      'Definir pro-labore fixo mensal separado do caixa da empresa, com retirada baseada no lucro real e documentada no DRE.',
    faseInicio: 1,
    faseFim: 4,
    versaoIntroducao: 'v2.0',
    metadata: { gatilhos: ['Retiro quando preciso', 'A empresa e a minha conta'] },
  },
  {
    codigo: 'FIN-11',
    bloco: 'FIN',
    titulo: 'Dashboard gerencial por vendedor, regiao e cliente',
    descricao:
      'Criar painel de acompanhamento por vendedor, regiao, canal e cliente para identificar margem, gargalo e performance comercial.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'FIN-12',
    bloco: 'FIN',
    titulo: 'Calendario de pagamentos concentrado',
    descricao:
      'Mapear todas as dividas e pagamentos recorrentes num calendario unico para reduzir surpresas de caixa e decisoes emergenciais.',
    faseInicio: 1,
    faseFim: 4,
    versaoIntroducao: 'v2.0',
    metadata: { gatilhos: ['Todo mes tem susto de caixa', 'Nao sei quando vence o que'] },
  },
  {
    codigo: 'FIN-13',
    bloco: 'FIN',
    titulo: 'Dashboard BI financeiro minimo viavel',
    descricao:
      'Painel quinzenal com faturamento bruto, custos fixos e variaveis, lucro liquido real, margem por produto e contas a pagar nos proximos 30 dias.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v4.0',
  },
  {
    codigo: 'FIN-14',
    bloco: 'FIN',
    titulo: 'BPO financeiro como estrutura transitoria de gestao',
    descricao:
      'Terceirizar setup e manutencao de fluxo de caixa, DRE simples, conciliacao bancaria e contas a pagar/receber quando nao houver capacidade interna.',
    faseInicio: 1,
    faseFim: 4,
    versaoIntroducao: 'v5.2',
    metadata: { pares: ['FIN-01', 'FIN-13', 'P.16'] },
  },
  {
    codigo: 'COM-01-10',
    bloco: 'COM',
    titulo: 'Acoes comerciais fundadoras',
    descricao:
      'Script de vendas basico, ICP documentado, funil em 3 etapas, WhatsApp Business com catalogo, Google Meu Negocio, reativacao de base, meta semanal, comissao por produto ancora, follow-up automatizado e relatorio semanal de oportunidades.',
    faseInicio: 3,
    faseFim: 12,
    versaoIntroducao: 'v1.0',
  },
  {
    codigo: 'COM-11',
    bloco: 'COM',
    titulo: 'Sala de guerra - mapa visual de vendas',
    descricao:
      'Criar painel fisico ou digital com meta, realizado, pipeline, clientes em negociacao e motivos de perda, revisado semanalmente.',
    faseInicio: 9,
    faseFim: 16,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'COM-12',
    bloco: 'COM',
    titulo: 'Converter bonus trimestral para mensal',
    descricao:
      'Substituir bonus trimestral por bonus mensal por meta atingida para manter urgencia e recompensa imediata no time comercial.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'COM-13',
    bloco: 'COM',
    titulo: 'Entrevista estrategica individual com cada vendedor',
    descricao:
      'Realizar conversa individual estruturada antes de definir metas ou processos para gerar diagnostico real e evitar prescricao cega.',
    faseInicio: 1,
    faseFim: 4,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'COM-14',
    bloco: 'COM',
    titulo: 'Funil de vendas B2B por fase de relacao',
    descricao:
      'Estruturar funil com etapas claras, acao definida e prazo maximo para ciclos comerciais mais longos.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'COM-15',
    bloco: 'COM',
    titulo: 'Programa de fidelizacao de intermediarios',
    descricao:
      'Formalizar programa para canais de indicacao como eletricistas, contadores e instaladores com cadastro, pontuacao e relacionamento recorrente.',
    faseInicio: 9,
    faseFim: 16,
    versaoIntroducao: 'v4.0',
    metadata: { gatilho: 'Negocio dependente de indicacao passiva' },
  },
  {
    codigo: 'COM-16',
    bloco: 'COM',
    titulo: 'Campanha de testemunho de longevidade',
    descricao:
      'Identificar clientes com 5+ anos de relacionamento e transformar a longevidade em prova social visivel por meio de video, depoimento, post e contato ao vivo.',
    faseInicio: 9,
    faseFim: 16,
    versaoIntroducao: 'v4.0',
  },
  {
    codigo: 'COM-19',
    bloco: 'COM',
    titulo: 'Funil rastreado',
    descricao:
      'Rastrear aquisicao, conversao e perdas por canal com disciplina semanal para transformar vendas em processo e nao em sensacao.',
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
      'Dividir a meta mensal em metas semanais e diarias com acompanhamento explicito para criar accountability natural sem microgestao.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v5.0',
  },
  {
    codigo: 'LID-01-05',
    bloco: 'LID',
    titulo: 'Acoes de lideranca fundadoras',
    descricao:
      'Rotina semanal do CEO, separacao decisao estrategica versus operacional, protocolo de contratacao, onboarding 30-60-90 e avaliacao trimestral.',
    faseInicio: 4,
    faseFim: 12,
    versaoIntroducao: 'v1.0',
  },
  {
    codigo: 'LID-06',
    bloco: 'LID',
    titulo: 'Playbook e estagiario para libertar o gestor',
    descricao:
      'Documentar os processos mais repetitivos do dono em playbooks e treinar um colaborador junior ate a operacao funcionar 30 dias sem intervencao.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'LID-07',
    bloco: 'LID',
    titulo: 'OKR trimestral de alta direcao',
    descricao:
      'Definir 1 objetivo e 3 key results por trimestre para alinhar visao estrategica com execucao semanal e revisao mensal.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'LID-08',
    bloco: 'LID',
    titulo: 'Playbook financeiro para delegacao',
    descricao:
      'Criar playbook para fechamento mensal, conciliacao bancaria, relatorio de DRE e pagamento de fornecedores para que o gestor revise sem executar tudo.',
    faseInicio: 8,
    faseFim: 16,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'LID-10',
    bloco: 'LID',
    titulo: 'Delegacao por camada operacional',
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
    titulo: 'Acoes operacionais fundadoras',
    descricao:
      'Mapeamento de fluxo de valor, SLA minimo de atendimento, checklist de abertura e fechamento, padrao de orcamento documentado e registro de retrabalho.',
    faseInicio: 1,
    faseFim: 8,
    versaoIntroducao: 'v1.0',
  },
  {
    codigo: 'OPE-06',
    bloco: 'OPE',
    titulo: 'Organograma funcional por fase',
    descricao:
      'Desenhar organograma por funcoes necessarias para a proxima fase do negocio e identificar a proxima camada a ser delegada.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'OPE-07',
    bloco: 'OPE',
    titulo: 'Mapa de processos criticos',
    descricao:
      'Documentar os 5 processos mais criticos para a receita do negocio, com entrada, etapas, saida e responsavel.',
    faseInicio: 5,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
  {
    codigo: 'OPE-08',
    bloco: 'OPE',
    titulo: 'Ficha tecnica por produto ou servico',
    descricao:
      'Registrar descricao, custo variavel, tempo de execucao, piso de preco, preco atual e margem real por item para proteger a rentabilidade.',
    faseInicio: 1,
    faseFim: 12,
    versaoIntroducao: 'v2.0',
  },
];

const devotionals: DevotionalSeed[] = [
  {
    semanaNumero: 1,
    titulo: 'Ordem antes da expansao',
    texto:
      'Comece pela ordem. O primeiro passo nao e crescer mais rapido, e governar melhor o que ja esta nas suas maos.',
    versiculo: '1 Corintios 14:40',
  },
  {
    semanaNumero: 2,
    titulo: 'Sabedoria antes de pressa',
    texto:
      'Planejamento nao e lentidao. E a forma de impedir que a urgencia destrua a colheita do futuro.',
    versiculo: 'Proverbios 21:5',
  },
  {
    semanaNumero: 3,
    titulo: 'Estrutura sustenta multiplicacao',
    texto:
      'O que cresce sem estrutura vira peso. O que cresce com fundamento vira legado.',
    versiculo: 'Lucas 14:28',
  },
  {
    semanaNumero: 4,
    titulo: 'Fidelidade no pouco',
    texto:
      'Antes de grandes escalas, prove governo no pequeno. O Reino honra consistencia, nao atropelo.',
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
    slug: 'jethro-mensagens-diagnostico-v1-1',
    title: 'Jethro Mensagens Diagnostico v1.1',
    sourceType: 'docx' as const,
    sourcePath: resolve(process.env.HOME ?? '', 'Downloads', '02-Jethro_Mensagens_Diagnostico_v1_1.docx'),
    metadata: { category: 'mensagens', version: '1.1' },
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

async function seedDiagnosticQuestions(client: PoolClient) {
  for (const question of diagnosticQuestions) {
    await client.query(
      `insert into diagnostic_questions (
        code, order_index, label, helper_text, question_type, is_required, is_internal, validation, options, metadata
      ) values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb)
      on conflict (code) do update set
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
