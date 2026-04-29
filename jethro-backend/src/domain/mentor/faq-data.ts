export type FaqItem = { q: string; a: string };
export type ModelCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'X';

// Camada 1 — FAQ Global (all models, Tier 1 check)
export const FAQ_GLOBAL: FaqItem[] = [
  {
    q: 'O que é o Jethro Mentor PBN',
    a: 'O Jethro é o seu mentor de negócios com base nos Princípios Bíblicos para Negócios (PBN). Ele combina diagnóstico empresarial, um plano de ação personalizado de 24 semanas e acompanhamento semanal — tudo fundamentado na Palavra de Deus e validado em negócios reais.',
  },
  {
    q: 'O que é o Método PBN',
    a: 'PBN significa Princípios Bíblicos para Negócios. É um método criado por Rogério Teixeira que organiza a gestão empresarial em 7 Pilares: Governo Pessoal, Validação/Oferta, Propósito, Operação, Financeiro, Comercial e Legado. Cada pilar é fundamentado na Bíblia e aplicado à realidade do empreendedor cristão.',
  },
  {
    q: 'O que são os 7 Pilares do PBN',
    a: 'P1 — Governo Pessoal (autoconhecimento e disciplina do líder); P2 — Validação/Oferta (produto com demanda real e preço correto); P3 — Propósito (causa maior que o lucro); P4 — Operação (processos e equipe); P5 — Financeiro (fluxo de caixa e margem); P6 — Comercial (vendas e captação); P7 — Legado (impacto duradouro).',
  },
  {
    q: 'Como funciona o diagnóstico',
    a: 'Você responde 17 perguntas sobre o seu negócio. O motor de diagnóstico do Jethro identifica o seu perfil comportamental entre 9 modelos possíveis — cada um representa uma causa-raiz diferente. A partir daí, o seu plano de 24 semanas é construído exclusivamente para o seu perfil.',
  },
  {
    q: 'O que é o plano de 24 semanas',
    a: 'É o seu roteiro de transformação empresarial dividido em 4 fases: Fundação (S1–S6), Estrutura (S7–S12), Escala (S13–S18) e Legado (S19–S24). Cada semana tem ações concretas, uma âncora bíblica e um material técnico de referência. Você avança semana a semana com acompanhamento do Jethro.',
  },
  {
    q: 'O que é o Gate de Avanço',
    a: "O Gate de Avanço é o checkpoint semanal. Antes de avançar para a próxima semana, o Jethro verifica se as ações da semana foram executadas. Ele não é uma punição — é um espelho de responsabilidade. Como diz Provérbios 27:17: 'Assim como o ferro afia o ferro, o homem afia o homem.'",
  },
  {
    q: 'Quantas semanas tenho até o Gate',
    a: 'Cada semana tem 120 horas de prazo a partir do momento em que você a abre. Você pode avançar antes se completar as ações. O Jethro vai te avisar quando estiver perto do prazo.',
  },
  {
    q: 'Posso pular semanas ou fases',
    a: 'Não. O plano é sequencial porque cada fase constrói sobre a anterior. Pular etapas é como construir o segundo andar sem terminar o primeiro. O Jethro respeita o seu ritmo, mas não abre mão da sequência.',
  },
  {
    q: 'O Jethro substitui um mentor ou consultor',
    a: 'O Jethro não substitui — ele multiplica. Ele entrega o método, a estrutura e o acompanhamento que antes só eram acessíveis em mentorias de alto custo. Para quem quer mentoria individual com Rogério Teixeira, o Jethro é o ponto de partida ideal.',
  },
  {
    q: 'O que são os materiais técnicos G01 a G14',
    a: 'São 14 guias técnicos da Biblioteca Jethro — resumos aprofundados de obras como Profit First, Hábitos Atômicos, Traction EOS, StoryBrand e outros — adaptados à realidade do empreendedor cristão. Cada guia é indicado pelo Jethro na semana certa do seu plano.',
  },
  {
    q: 'Como acesso os materiais técnicos',
    a: 'Todos os 14 guias estão disponíveis a partir do primeiro dia de acesso. O Jethro vai indicar o guia certo na semana certa do seu plano, mas você pode consultá-los a qualquer momento pela Biblioteca.',
  },
  {
    q: 'Qual tradução bíblica o Jethro usa',
    a: 'O Jethro usa a NVI — Nova Versão Internacional — como padrão. Em algumas âncoras específicas do plano, podem aparecer versões tradicionais preservadas por Rogério Teixeira na construção do método.',
  },
  {
    q: 'Quanto custa o Jethro',
    a: 'O plano mensal é R$87,90 na fase de lançamento. Há planos trimestrais e semestrais com desconto. O Jethro é uma assinatura — você mantém acesso ao plano, ao mentor e à biblioteca enquanto estiver ativo.',
  },
  {
    q: 'O que acontece se eu pausar ou cancelar',
    a: 'Se pausar, o seu plano fica salvo exatamente onde você parou. Se cancelar, o acesso encerra no fim do período pago. Você não perde o progresso registrado — se retornar, recomeça da semana em que estava.',
  },
  {
    q: 'Como falo com o suporte do Jethro',
    a: 'Para problemas técnicos, de acesso ou pagamento, fale diretamente com a equipe do Jethro. Respondemos em até 24 horas em dias úteis, das 9h às 18h, horário de Brasília (UTC-3). E-mail: suporte@jethroapp.com · WhatsApp: +55 21 98091-1540. Para dúvidas sobre o seu plano, diagnóstico ou método PBN — pode perguntar aqui mesmo.',
  },
  {
    q: 'Posso refazer o diagnóstico',
    a: 'Sim. O Jethro prevê uma nova rodada de diagnóstico a partir do 3º mês. Negócios mudam — o seu perfil pode evoluir. A reclassificação é parte do processo de crescimento.',
  },
];

// Camada 2 — FAQ por Modelo
export const FAQ_POR_MODELO: Record<ModelCode, FaqItem[]> = {
  E: [
    {
      q: 'Por que minhas vendas não estão acontecendo ainda',
      a: 'Seu diagnóstico indica que o problema está na validação: o mercado ainda não reconheceu claramente a sua oferta. Isso não significa que o negócio é ruim — significa que a comunicação do valor ainda não acertou o alvo certo. Nas primeiras semanas do seu plano, o Jethro vai trabalhar exatamente isso.',
    },
    {
      q: 'Devo investir em marketing agora',
      a: 'Não ainda. Investir em tráfego antes de validar a oferta é colocar gasolina num carro que ainda precisa de ajuste no motor. O seu plano começa pela proposta de valor — G03 e G11 são os guias desta fase.',
    },
    {
      q: 'Como sei se minha oferta está validada',
      a: 'Quando clientes pagam sem precisar de muito convencimento e você consegue explicar o valor em duas frases simples. O Jethro vai te ajudar a construir esses dois indicadores durante a Fase de Fundação.',
    },
    {
      q: 'Preciso mudar de negócio',
      a: "Essa é uma conclusão precipitada neste estágio. A maioria dos casos de 'mercado não respondeu' é resolvida com ajuste de ICP, reformulação da oferta ou mudança na comunicação — não abandono do negócio. Siga o plano antes de qualquer decisão estrutural.",
    },
    {
      q: 'Qual material técnico é mais urgente para mim agora',
      a: 'G03 — Proposta de Valor e Precificação e G11 — StoryBrand. Esses dois guias estão diretamente ligados às suas primeiras semanas de plano.',
    },
  ],
  G: [
    {
      q: 'Por que quando vendo mais o caos aumenta',
      a: 'Porque a sua operação foi construída para o volume atual — não para escala. Cada novo cliente ou pedido além da capacidade instalada quebra o sistema. O seu plano vai trabalhar processos, SOPs e estrutura de equipe nas próximas semanas.',
    },
    {
      q: 'Por onde começo a organizar a operação',
      a: 'Pelo mapeamento dos gargalos: onde o processo trava quando o volume sobe? G08 — Processos e SOPs para PME é o seu guia principal nesta fase.',
    },
    {
      q: 'Preciso contratar mais pessoas primeiro',
      a: 'Não necessariamente. Contratar antes de documentar os processos é replicar o caos. O Jethro segue a sequência: primeiro clareza do processo, depois a estrutura de pessoas.',
    },
    {
      q: 'Quanto tempo leva para a operação se estabilizar',
      a: 'Com o plano em execução consistente, os primeiros sinais de estabilização aparecem entre as semanas 8 e 12. A consolidação operacional é um trabalho de médio prazo.',
    },
    {
      q: 'Qual material técnico é mais urgente para mim agora',
      a: 'G08 — Processos e SOPs para PME e G05 — Do Operacional ao Estratégico. Esses dois guias são a espinha dorsal do seu plano de Estrutura.',
    },
  ],
  D: [
    {
      q: 'Por que faturo bem mas não sobra dinheiro no final do mês',
      a: 'Porque há uma diferença entre faturamento e lucro. O seu diagnóstico aponta para um problema de margem ou estrutura de custos. O negócio vende, mas o modelo financeiro está consumindo o resultado. Isso tem solução — e começa com clareza nos números.',
    },
    {
      q: 'Como sei se meus preços estão errados',
      a: 'Calculando o custo real de entrega de cada produto ou serviço e comparando com o que você cobra. G02 e G12 — Profit First são os seus guias nesta análise.',
    },
    {
      q: 'O que é DRE e por que preciso disso',
      a: 'DRE é a Demonstração do Resultado do Exercício — o mapa que mostra onde cada real que entra no negócio vai parar. Sem um DRE simples, você gerencia no escuro. O Jethro vai te ajudar a montar o seu na Fase de Fundação.',
    },
    {
      q: 'Devo cortar custos agora',
      a: 'Antes de cortar, é preciso enxergar. Cortes cegos às vezes eliminam o que sustenta a margem. O Jethro vai te guiar por um diagnóstico financeiro antes de qualquer recomendação de corte.',
    },
    {
      q: 'Qual material técnico é mais urgente para mim agora',
      a: 'G02 — Finanças para PME e G12 — Profit First. Esses dois são a base do seu trabalho financeiro nas primeiras semanas.',
    },
  ],
  H: [
    {
      q: 'Por que o negócio paralisa quando me ausento',
      a: 'Porque você ainda é o processo. Todas as decisões, aprovações e execuções passam por você — e isso tem um teto. O seu plano vai trabalhar delegação estrutural e desenvolvimento de equipe para liberar você do operacional.',
    },
    {
      q: 'Como começo a delegar sem perder qualidade',
      a: 'Documentando o que você faz antes de transferir. Quem delega sem documentar, retrabalha. G05 — Do Operacional ao Estratégico e G08 são os guias desta transição.',
    },
    {
      q: 'Tenho medo de que a equipe não faça igual a mim',
      a: "Esse é o sinal clássico do Modelo H. A pergunta certa não é 'eles vão fazer igual?' mas 'o processo está documentado o suficiente para que possam fazer bem?' O padrão vem do processo, não da presença.",
    },
    {
      q: 'Quando vou conseguir sair do operacional',
      a: 'A saída do operacional é um processo de 3 a 6 meses com o plano em execução. Não é um evento — é uma transição. O Jethro vai te guiar semana a semana nessa jornada.',
    },
    {
      q: 'Qual material técnico é mais urgente para mim agora',
      a: 'G01 — Liderança Eficaz (5 Níveis de Maxwell), G04 — Gestão do Tempo e G05. Esses três constroem a base do seu Governo Pessoal e da delegação.',
    },
  ],
  A: [
    {
      q: 'Tenho muitas ideias e começo várias coisas por que isso é um problema',
      a: 'Porque dispersão é o inimigo da tração. Cada frente nova divide energia, capital e foco. O negócio que tenta ser tudo para todos acaba sendo fraco em tudo. O seu plano começa por clareza: o que você vai construir, para quem, e por quê.',
    },
    {
      q: 'Como escolho em qual frente focar',
      a: 'Pelo critério de maior retorno com menor esforço atual — e pelo propósito. O Jethro vai te ajudar a mapear as frentes abertas e a priorizar com critérios objetivos nas primeiras semanas.',
    },
    {
      q: 'Meu fluxo de caixa está desorganizado por onde começo',
      a: 'Pela separação: conta pessoal e conta do negócio são realidades distintas. G02 — Finanças para PME é o primeiro passo prático. O Jethro trabalha isso nas semanas iniciais.',
    },
    {
      q: 'Preciso de propósito antes de organizar o negócio',
      a: 'Sim. Sem propósito, toda reorganização é temporária — você volta ao caos quando a motivação cai. G14 — Start With Why é parte estrutural do seu plano desde a Fase de Fundação.',
    },
    {
      q: 'Qual material técnico é mais urgente para mim agora',
      a: 'G14 — Start With Why, G02 — Finanças para PME e G04 — Gestão do Tempo. Esses três constroem a base que o seu plano vai trabalhar.',
    },
  ],
  F: [
    {
      q: 'Meu negócio depende de indicações por que isso é arriscado',
      a: 'Porque indicação é passiva — você não controla o volume. Quando as indicações param, o faturamento cai. O seu diagnóstico aponta para a ausência de um motor comercial ativo. O Jethro vai trabalhar a construção desse motor.',
    },
    {
      q: 'Preciso de um funil de vendas como funciona',
      a: 'Um funil de vendas é o caminho que o cliente percorre desde o primeiro contato até a compra. Para o seu perfil, G07 — Funil de Vendas para PME é o guia central das semanas de estrutura comercial.',
    },
    {
      q: 'Devo investir em tráfego pago agora',
      a: 'Antes de tráfego pago, você precisa de uma oferta clara e um processo de conversão testado. Tráfego sem funil é dinheiro jogado fora. O Jethro vai preparar essa base antes de recomendar investimento em mídia.',
    },
    {
      q: 'Como diversifico meus canais de aquisição',
      a: 'Um canal de cada vez. A tentativa de estar em todos os canais ao mesmo tempo dilui os resultados. O Jethro vai te guiar na sequência certa de construção de canais.',
    },
    {
      q: 'Qual material técnico é mais urgente para mim agora',
      a: 'G07 — Funil de Vendas para PME e G11 — StoryBrand. Esses dois guias são a base da sua fase comercial.',
    },
  ],
  C: [
    {
      q: 'Por que meus clientes elogiam muito mas reclamam do preço',
      a: 'Porque o valor que você entrega ainda não foi comunicado de forma que justifique o preço aos olhos do cliente. Isso não é um problema de preço — é um problema de percepção de valor. O Jethro vai trabalhar os dois lados: precificação correta e comunicação do valor.',
    },
    {
      q: 'Como sei se meu preço está abaixo do mercado',
      a: 'Calculando o custo real de entrega e comparando com o que o mercado paga por resultado equivalente. G03 — Proposta de Valor e Precificação vai te dar a metodologia.',
    },
    {
      q: 'Tenho medo de aumentar o preço e perder clientes',
      a: 'Clientes que ficam apenas pelo preço baixo são os que primeiro reclamam e primeiro saem. O Jethro vai te ajudar a construir a base para um reposicionamento de preço que retém os clientes certos.',
    },
    {
      q: 'O que é ICP e como isso me ajuda',
      a: "ICP é o Perfil de Cliente Ideal — o cliente que mais se beneficia do que você entrega e que paga bem por isso. Trabalhar para o ICP certo resolve o paradoxo de 'entrega bem, cobra mal'.",
    },
    {
      q: 'Qual material técnico é mais urgente para mim agora',
      a: 'G03 — Proposta de Valor e Precificação e G11 — StoryBrand. Esses dois guias são centrais para as suas semanas de Fundação.',
    },
  ],
  B: [
    {
      q: 'Meu negócio funciona bem mas não cresce o que está bloqueando',
      a: 'Você tem uma base sólida — isso é raro e valioso. O bloqueio geralmente está em um dos três pontos: teto de capacidade do dono, ausência de sistema comercial ativo, ou falta de visão estratégica de médio prazo. O Jethro vai identificar o seu gargalo específico.',
    },
    {
      q: 'Preciso expandir para crescer',
      a: 'Não necessariamente. Crescimento pode vir de aumento de ticket médio, recuperação de clientes inativos ou novo canal — sem expansão de estrutura. G09 — Planejamento Estratégico vai mapear as opções reais para o seu negócio.',
    },
    {
      q: 'Como defino metas de crescimento realistas',
      a: 'Com base nos seus números atuais: faturamento, ticket médio, volume de clientes, capacidade de entrega. O Jethro vai trabalhar OKRs e metas na Fase de Estrutura.',
    },
    {
      q: 'Devo trabalhar sistema de gestão agora',
      a: 'Sim — para o Modelo B, G13 — Traction EOS é uma referência importante nas semanas 13 em diante. Mas antes disso, o Jethro vai construir a base de clareza estratégica.',
    },
    {
      q: 'Qual material técnico é mais urgente para mim agora',
      a: 'G09 — Planejamento Estratégico para PME e G07 — Funil de Vendas. Esses dois são os aceleradores do seu crescimento na fase atual.',
    },
  ],
  X: [
    {
      q: 'Estou crescendo bem o que o Jethro ainda pode me oferecer',
      a: 'Um mapa de escala. Você já passou pelas dores mais comuns. O que o Jethro entrega agora é estrutura para crescer sem quebrar: pessoas certas, processos escaláveis, gestão financeira para volume e legado de impacto.',
    },
    {
      q: 'Quando devo considerar expandir para novos mercados ou unidades',
      a: 'Quando os processos atuais estão documentados e funcionam sem depender de você. Expansão antes disso é escalar o caos. O seu plano vai mapear esse ponto de maturidade.',
    },
    {
      q: 'Como estruturo minha equipe para a próxima fase',
      a: 'Com papéis claros, responsabilidades definidas e cultura documentada. G06 — Seleção por Competências e G13 — Traction EOS são os guias desta fase para o seu perfil.',
    },
    {
      q: 'O Jethro pode me conectar com mentoria individual',
      a: 'Sim. Para empreendedores no perfil X, a mentoria individual com Rogério Teixeira é o próximo nível natural. O Jethro vai apresentar esse caminho no momento certo do seu plano — sem pressa, sem pressão.',
    },
    {
      q: 'Qual material técnico é mais urgente para mim agora',
      a: 'G13 — Traction EOS para PME e G01 — Liderança Eficaz. Esses dois guias são a base da sua fase de Escala e Legado.',
    },
  ],
};

// Camada 3 — Índice de Materiais Técnicos
export const MATERIAIS_TECNICOS = `G01 — Liderança Eficaz (Os 5 Níveis de Maxwell): liderança, equipe, delegação. Modelos: H, G, B.
G02 — Finanças para PME — Clareza e Controle: DRE, fluxo de caixa, indicadores. Modelos: A, C, D, F.
G03 — Proposta de Valor e Precificação: revisão de oferta, pacotes, valor. Modelos: B, C, E, F.
G04 — Gestão do Tempo para Empreendedores: foco, rotina, governo pessoal. Modelos: H, G, A.
G05 — Do Operacional ao Estratégico: delegação estrutural, sair do dia a dia. Modelos: H, G.
G06 — Seleção por Competências para PME: contratação, estrutura de pessoas. Modelos: G, H, B.
G07 — Funil de Vendas para PME: captação, pipeline comercial. Modelos: F, B, E, C.
G08 — Processos e SOPs para PME: padronização, escala, documentação. Modelos: G, H, D.
G09 — Planejamento Estratégico para PME: metas, OKRs, visão. Modelos: B, H, C, E.
G10 — Hábitos Atômicos (James Clear): consistência, rotina. Todos os modelos.
G11 — StoryBrand — Comunicação que Converte: posicionamento, marca, mensagem. Modelos: E, F, C.
G12 — Profit First — Lucro como Prioridade: reorganização financeira. Modelos: A, D, C.
G13 — Traction EOS para PME: sistema de gestão, semanas 13–24. Modelos: B, G, H.
G14 — Start With Why — O Poder do Propósito: propósito, legado. Modelos: C, E, H.`;

// Camada 4 — Instruções da IA (System Prompt Delta)
export const INSTRUCOES_IA = `INSTRUÇÕES OBRIGATÓRIAS:
1. NUNCA responda sobre o negócio sem considerar o modelo do usuário.
2. SEMPRE referencie a semana e fase quando a pergunta for sobre execução do plano.
3. Se a pergunta for sobre material técnico, indique o guia correto (G01–G14) conforme o modelo.
4. Se a pergunta estiver no FAQ, use a resposta do FAQ — não invente variações.
5. Se não estiver no FAQ, responda com a voz do Rogério Teixeira: direto, bíblico, sem floreios.
6. JAMAIS mencione outros métodos, ferramentas ou concorrentes pelo nome.
7. Se o usuário demonstrar desânimo ou querer desistir, acione âncora bíblica + convite a continuar.
8. Máximo 3 parágrafos por resposta. Directo, cuidador, espiritual.`;

// Sugestões iniciais exibidas no chat antes da primeira mensagem
export const SUGESTOES_CHAT = [
  'O que é o Método PBN?',
  'Como funciona o diagnóstico?',
  'O que é o Gate de Avanço?',
  'Qual material técnico é mais urgente para mim?',
];

export function derivarFase(semana: number): string {
  if (semana <= 6) return 'Fundação';
  if (semana <= 12) return 'Estrutura';
  if (semana <= 18) return 'Escala';
  return 'Legado';
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buscarFaqTier1(
  mensagem: string,
  modelo: string | null
): string | null {
  const norm = normalize(mensagem);
  const words = new Set(norm.split(' ').filter((w) => w.length > 3));

  function score(question: string): number {
    const qNorm = normalize(question);
    const qWords = qNorm.split(' ').filter((w) => w.length > 3);
    let hits = 0;
    for (const w of qWords) {
      if (words.has(w) || norm.includes(w)) hits++;
    }
    return qWords.length > 0 ? hits / qWords.length : 0;
  }

  // Check model-specific FAQ first
  if (modelo && modelo in FAQ_POR_MODELO) {
    const modelFaq = FAQ_POR_MODELO[modelo as ModelCode];
    let best: FaqItem | null = null;
    let bestScore = 0;
    for (const item of modelFaq) {
      const s = score(item.q);
      if (s > bestScore) {
        bestScore = s;
        best = item;
      }
    }
    if (best && bestScore >= 0.5) return best.a;
  }

  // Then check global FAQ
  let best: FaqItem | null = null;
  let bestScore = 0;
  for (const item of FAQ_GLOBAL) {
    const s = score(item.q);
    if (s > bestScore) {
      bestScore = s;
      best = item;
    }
  }
  if (best && bestScore >= 0.5) return best.a;

  return null;
}
