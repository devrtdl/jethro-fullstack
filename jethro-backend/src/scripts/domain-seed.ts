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
  questionType: 'text' | 'textarea' | 'email' | 'phone' | 'single_select' | 'money_range';
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
  variant: 'v1' | 'v2' | 'v3';
  block1Title: string;
  block1Body: string;
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
  {
    modelCode: 'A',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o seu negocio esta gritando e voce ainda nao ouviu. O diagnostico revela financeiro confuso, metas soltas e falta de rota semanal. Causa raiz: caos financeiro, ausencia de direcao e falta de governo semanal.',
    scriptureVerse: '1 Corintios 14:40',
    scriptureText: 'Tudo, porem, seja feito com decencia e ordem.',
    block2Title: 'Precipicio',
    block2Body:
      'Se nada mudar nos proximos 90 dias, o padrao se aprofunda: mais trabalho, menos clareza, familia sentindo o peso e anos sendo drenados no mesmo ciclo.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'A',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o problema nao e o mercado. E o espelho. O negocio sobrevive, mas nao avanca, porque falta painel de governo e cadencia estrategica.',
    scriptureVerse: 'Proverbios 21:5',
    scriptureText: 'Os planos do diligente tendem para a abundancia.',
    block2Title: 'Precipicio',
    block2Body:
      'O risco aqui nao e quebrar de repente. E repetir o mesmo ano por muito tempo, com desgaste, renda estagnada e crise de identidade.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'A',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], voce esta construindo em cima de areia. Falta clareza financeira, plano claro e rota de 90 dias. Hoje a dedicacao esta substituindo estrutura.',
    scriptureVerse: 'Exodo 18:18',
    scriptureText: 'Certamente definharas, tanto tu como este povo.',
    block2Title: 'Precipicio',
    block2Body:
      'O custo nao e so financeiro. Saude emocional, autoridade em casa e o proprio chamado ficam sob pressao quando o negocio segue sem fundamento.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'B',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], voce construiu algo que funciona. Agora precisa de algo que multiplica. O crescimento travou e falta motor de aquisicao, oferta e recorrencia.',
    scriptureVerse: 'Mateus 25:27',
    scriptureText: 'Devias ter entregado o meu dinheiro aos banqueiros.',
    block2Title: 'Precipicio',
    block2Body:
      'Plato prolongado parece seguro, mas custos sobem, concorrentes evoluem e o negocio ok vira negocio em risco.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'B',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o que te trouxe ate aqui nao te leva para o proximo nivel. Existe estrutura, mas falta aceleracao e uma escada clara de crescimento.',
    scriptureVerse: 'Genesis 1:28',
    scriptureText: 'Sede fecundos e multiplicai-vos.',
    block2Title: 'Precipicio',
    block2Body:
      'O custo invisivel do plato aparece em oportunidades perdidas, equipe esfriando e um declinio silencioso mascarado de estabilidade.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'B',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], existe uma diferenca entre negocio que funciona e negocio que multiplica. Hoje falta um motor estruturado de crescimento.',
    scriptureVerse: 'Mateus 25:29',
    scriptureText: 'A quem tem, mais lhe sera dado.',
    block2Title: 'Precipicio',
    block2Body:
      'Se o plato continuar, voce vai trabalhar igual e ganhar menos em termos reais enquanto inflacao e custos corroem a margem.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'C',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], voce tem o coracao certo. Falta o sistema que sustenta. Existe proposito, mas ainda nao existe uma estrutura economica que transforme valor em caixa consistente.',
    scriptureVerse: 'Habacuque 2:2',
    scriptureText: 'Escreve a visao e torna-a bem legivel.',
    block2Title: 'Precipicio',
    block2Body:
      'Sem modelo e sem sistema, o proposito fica pesado demais para sustentar o negocio e a sensacao constante e de aperto e improviso.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'C',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], sua intencao e boa, mas o negocio ainda nao aprendeu a traduzir chamado em prosperidade sustentavel. A boa base existe, porem o caixa segue apertado.',
    scriptureVerse: 'Lucas 14:28',
    scriptureText: 'Qual de vos, querendo edificar uma torre, nao se assenta primeiro para calcular a despesa?',
    block2Title: 'Precipicio',
    block2Body:
      'Quando o proposito nao encontra modelo, o lider entra num ciclo de fe, cansaco e frustracao por nao ver o fruto esperado.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'C',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], ha clareza de chamado, mas falta um sistema que proteja o caixa e organize a expansao. O negocio esta mais reativo do que governado.',
    scriptureVerse: 'Proverbios 24:3',
    scriptureText: 'Com sabedoria se edifica a casa.',
    block2Title: 'Precipicio',
    block2Body:
      'O risco aqui e transformar um chamado bonito em peso diario, com caixa curto, decisoes reativas e crescimento sem paz.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'D',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], voce esta correndo em direcao a uma parede e chamando isso de crescimento. O faturamento existe, mas o lucro e ilusao, a margem real nao esta clara e o dinheiro entra, circula e some.',
    scriptureVerse: 'Lucas 14:28',
    scriptureText: 'Qual de voces, querendo construir uma torre, nao se senta primeiro para calcular o custo?',
    block2Title: 'Precipicio',
    block2Body:
      'Se o sangramento continuar, o ciclo fica cruel: mais vendas, mais custo, menos lucro, caixa negativo e colapso. Crescimento sem margem vira crise com atraso.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'D',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o seu negocio pode estar te enganando. Numero bonito no extrato, sensacao feia no bolso. Desconto virou habito, custo fixo cresceu e voce nao sabe o que realmente paga a conta.',
    scriptureVerse: 'Proverbios 10:22',
    scriptureText: 'A bencao do Senhor enriquece e nao acrescenta tristeza com ela.',
    block2Title: 'Precipicio',
    block2Body:
      'Nos proximos 90 dias, o caixa pode apertar de forma incontornavel, forcar decisoes de desespero e acelerar uma crise que parecia invisivel.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'D',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], trabalhar para sustentar vazamento e a armadilha mais cruel do empreendedorismo. Existe esforco, existe venda, mas nao existe margem protegida nem visao por item.',
    scriptureVerse: 'Lucas 16:10',
    scriptureText: 'Quem e fiel no minimo tambem e fiel no muito.',
    block2Title: 'Precipicio',
    block2Body:
      'Quando a margem nao e corrigida, dividas crescem, a reserva vai a zero e um imprevisto pequeno ganha forca para derrubar toda a operacao.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'E',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], a semente existe. Falta plantar de verdade. A oferta ainda nao esta clara para o mercado dizer sim, o canal nao foi testado e a rotina da primeira venda ainda nao foi instalada.',
    scriptureVerse: 'Tiago 2:17',
    scriptureText: 'A fe sem obras e morta.',
    block2Title: 'Precipicio',
    block2Body:
      'O risco do quase comecando e ficar meses ajustando oferta sem vender, transformando medo em paralisacao e corroendo a confianca no chamado.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'E',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o mundo nao compra potencial. Compra oferta clara. O talento existe, mas ainda faltam frase de oferta, canal validado fora da rede pessoal e rotina de prospeccao.',
    scriptureVerse: 'Proverbios 18:16',
    scriptureText: 'O dom do homem abre caminho para ele.',
    block2Title: 'Precipicio',
    block2Body:
      'Sem venda consistente, o negocio passa a ser financiado do proprio bolso, a autoconfianca enfraquece e o que era chamado pode parecer duvida de metodo.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'E',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o seu maior inimigo agora nao e o mercado. E o adiamento. Voce ajusta, estuda e acredita, mas ainda nao testa com consistencia.',
    scriptureVerse: 'Mateus 14:29',
    scriptureText: 'Pedro saiu do barco e andou sobre as aguas em direcao a Jesus.',
    block2Title: 'Precipicio',
    block2Body:
      'Se o adiamento continuar, os proximos meses trazem mais conhecimento e menos confianca, e a janela de mercado pode fechar antes da primeira validacao real.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'F',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], voce tem negocio. Nao tem sistema. O comercial vive numa montanha-russa porque a maioria dos clientes chega por indicacao e nao por um motor estruturado.',
    scriptureVerse: 'Proverbios 22:3',
    scriptureText: 'O homem prudente ve o mal e se esconde.',
    block2Title: 'Precipicio',
    block2Body:
      'Quando a indicacao seca, voce aceita cliente errado, baixa preco e passa a viver em ansiedade de caixa porque a proxima venda nao tem data para chegar.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'F',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], voce provou que sabe entregar. Agora precisa provar que sabe crescer. Falta script, funil, follow-up e rotina de prospeccao repetivel.',
    scriptureVerse: 'Proverbios 21:5',
    scriptureText: 'Os planos do diligente tendem para a abundancia.',
    block2Title: 'Precipicio',
    block2Body:
      'A instabilidade comercial compromete precificacao, autoestima empresarial e capacidade de investimento. Sem fluxo, cada mes parece uma aposta.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'F',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], seu negocio funciona quando voce tem sorte. Precisa funcionar quando voce tem sistema. Hoje ainda faltam previsibilidade, conversao e retencao.',
    scriptureVerse: '2 Corintios 9:6',
    scriptureText: 'O que semeia com parcimonia, com parcimonia tambem ceifara.',
    block2Title: 'Precipicio',
    block2Body:
      'Cada mes ruim corrroi a reserva que um mes bom construiu, e a ansiedade de caixa corre o risco de virar estilo de vida dentro da empresa.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'G',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], voce esta num paradoxo perigoso: vender mais esta te quebrando. A capacidade operacional chegou no limite, tudo passa por voce e os processos nao se repetem com padrao.',
    scriptureVerse: 'Proverbios 9:1',
    scriptureText: 'A sabedoria edificou a sua casa; lavrou as suas sete colunas.',
    block2Title: 'Precipicio',
    block2Body:
      'Quando a operacao sem estrutura tenta crescer, atrasos viram reclamacoes, retrabalho vira custo invisivel e a reputacao comeca a pagar a conta.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'G',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o seu gargalo nao esta no mercado. Esta na operacao. Voce esta escalando urgencia, nao sistema, e o dono continua sendo o ponto que trava tudo.',
    scriptureVerse: 'Exodo 18:18',
    scriptureText: 'Voce certamente se consumira, tanto voce como este povo.',
    block2Title: 'Precipicio',
    block2Body:
      'Sem mudar a estrutura antes da proxima onda de crescimento, clientes se perdem, a equipe desengaja e o fundador vira prisioneiro da propria entrega.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'G',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o seu negocio esta crescendo por fora e sofrendo por dentro. Processos nao documentados, capacidade no limite e equipe sem autonomia apontam para fundamento fraco.',
    scriptureVerse: 'Mateus 7:24',
    scriptureText: 'O homem prudente edificou a sua casa sobre a rocha.',
    block2Title: 'Precipicio',
    block2Body:
      'Operacao sem estrutura tem janela curta de tolerancia. Um cliente importante, uma entrega critica ou uma saida de equipe podem disparar o colapso visivel.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'H',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o seu negocio tem o tamanho do seu folego. E o seu folego esta acabando. A agenda esta dominada por urgencias e o peso do negocio continua centralizado em voce.',
    scriptureVerse: 'Exodo 18:17-18',
    scriptureText: 'O que fazes nao e bom. Certamente definharas.',
    block2Title: 'Precipicio',
    block2Body:
      'A conta de um lider sem governo chega na mente, no corpo e na familia. Sobrecarga prolongada rouba clareza, paz e capacidade de liderar.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'H',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], voce esta ocupado. Mas esta avancando? Mais de 60 horas por semana sem ritual de revisao e metas geralmente significam ocupacao disfarçada de produtividade.',
    scriptureVerse: 'Proverbios 25:28',
    scriptureText: 'Como cidade aberta e sem muros, assim e o homem que nao refreia o seu espirito.',
    block2Title: 'Precipicio',
    block2Body:
      'Lider sem governo perde as melhores decisoes, cansa as melhores pessoas e fica sem horizonte porque vive apagando incendio em vez de governar.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'H',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], quando o dono para, o negocio para. Isso nao e lideranca. E dependencia. A equipe ainda nao tem autonomia e voce continua insubstituivel de um jeito perigoso.',
    scriptureVerse: 'Exodo 18:21-22',
    scriptureText: 'Escolhe dentre o povo homens capazes... e eles te ajudarao a carregar o fardo.',
    block2Title: 'Precipicio',
    block2Body:
      'Negocio dependente do fundador adoece junto com ele, nao escala e perde valor justamente porque nao se sustenta sem a presenca direta do dono.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'I',
    variant: 'v1',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o maior negocio que voce pode abrir comeca pelo metodo, nao pela vontade. Hoje faltam espaco real na rotina, MVP escrito e validacao minima no mercado.',
    scriptureVerse: 'Lucas 14:28',
    scriptureText: 'Quem de vos, querendo edificar uma torre, nao se assenta primeiro a calcular a despesa?',
    block2Title: 'Precipicio',
    block2Body:
      'Comecar sem metodo leva a meses de trabalho num produto que o mercado nao quer, consumo de tempo e dinheiro antes da prova de demanda e desgaste da propria confianca.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'I',
    variant: 'v2',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], o que esta a travar o seu inicio nao e o mercado. E a ausencia de um sistema para comecar. Ainda falta mapear tempo real, testar fora do circulo pessoal e nomear o mercado-alvo.',
    scriptureVerse: 'Eclesiastes 11:4',
    scriptureText: 'Quem observa o vento nao semeara, e quem olha as nuvens nao segara.',
    block2Title: 'Precipicio',
    block2Body:
      'Cada mes sem estrutura financia o negocio com energia sem retorno, reduz a janela de mercado e torna o primeiro passo emocionalmente mais pesado.',
    ctaLabel: 'Quero meu plano de acao',
  },
  {
    modelCode: 'I',
    variant: 'v3',
    block1Title: 'Realidade Direta',
    block1Body:
      '[NOME], voce tem a visao. O que falta e o caminho entre onde esta e onde quer chegar. O chamado existe, mas a oferta, o publico e a disponibilidade ainda nao foram organizados como negocio.',
    scriptureVerse: 'Habacuque 2:2',
    scriptureText: 'Escreve a visao e grava-a em tabuas, para que a possa ler correndo.',
    block2Title: 'Precipicio',
    block2Body:
      'Visao sem plano prolonga a espera, enfraquece o coracao e pode fazer um chamado real parecer ingenuidade quando o problema sempre foi o caminho.',
    ctaLabel: 'Quero meu plano de acao',
  },
];

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
    await client.query(
      `insert into diagnostic_messages (
        model_code, variant, block_1_title, block_1_body, scripture_verse, scripture_text, block_2_title, block_2_body, cta_label
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      on conflict (model_code, variant) do update set
        block_1_title = excluded.block_1_title,
        block_1_body = excluded.block_1_body,
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
