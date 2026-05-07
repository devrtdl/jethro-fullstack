// Alma v5.14 — Static data: action lookup, per-model tables, per-model metaphors
// Source: Doc5 v2.1 + Alma v5.14 (Rogério Teixeira)

export interface AcaoAlma {
  codigo: string;
  nome: string;
  descricao: string;
  guia?: string;
}

export interface CondicionalAlma {
  codigo: string;
  campo: string;
  operador: '>' | '>=' | '=' | 'truthy';
  valor: number | string | boolean | null;
}

export interface ModeloAlmaConfig {
  obrigatorias: string[];
  condicionais: CondicionalAlma[];
}

// ── Lookup: all definitively codified Alma actions ──────────────────────────
export const ACOES_ALMA: Record<string, AcaoAlma> = {
  // ── Bloco FIN — Clareza Financeira ─────────────────────────────────────
  'FIN-01': {
    codigo: 'FIN-01',
    nome: 'Separação PF/PJ',
    descricao: 'Separar completamente as finanças pessoais das empresariais: conta bancária exclusiva da empresa, nenhuma despesa pessoal paga pela empresa sem registro como pró-labore ou retirada documentada.',
    guia: 'G02',
  },
  'FIN-02': {
    codigo: 'FIN-02',
    nome: 'DRE Simplificado',
    descricao: 'Criar e manter um Demonstrativo de Resultados simples: faturamento bruto − custos variáveis − custos fixos = lucro líquido real. Atualizar mensalmente antes do dia 10.',
    guia: 'G02',
  },
  'FIN-03': {
    codigo: 'FIN-03',
    nome: 'Fluxo de Caixa Mensal',
    descricao: 'Mapear todas as entradas e saídas previstas para os próximos 13 semanas. Atualizar semanalmente. Permite antecipar apertos de caixa e evitar "surpresas de sexta-feira".',
    guia: 'G02',
  },
  'FIN-04': {
    codigo: 'FIN-04',
    nome: 'Mapa de Dívidas',
    descricao: 'Listar todas as dívidas: credor, valor total, parcelas, data de vencimento, taxa de juros. Priorizar por custo de capital e negociar as de maior taxa primeiro.',
    guia: 'G02',
  },
  'FIN-05': {
    codigo: 'FIN-05',
    nome: 'Pró-labore Fixo',
    descricao: 'Definir um valor fixo mensal de retirada do dono, calculado sobre o lucro real — não sobre o faturamento. Documentar como item do DRE. Nunca retirar "quando precisar".',
    guia: 'G02',
  },
  'FIN-06': {
    codigo: 'FIN-06',
    nome: 'Reserva de Caixa Mínima',
    descricao: 'Construir reserva equivalente a 3x os custos fixos mensais antes de qualquer reinvestimento ou expansão. Manter em conta separada, intocável para operações do dia a dia.',
    guia: 'G02',
  },
  'FIN-07': {
    codigo: 'FIN-07',
    nome: 'Precificação por Margem',
    descricao: 'Calcular o preço mínimo (piso) de cada produto/serviço pela fórmula: custo variável + custo fixo alocado + margem mínima. Nunca precificar por intuição ou apenas pela concorrência.',
    guia: 'G03',
  },
  'FIN-08': {
    codigo: 'FIN-08',
    nome: 'Ponto de Equilíbrio',
    descricao: 'Calcular o break-even mensal: quanto precisa faturar para cobrir todos os custos fixos. Dividir por semanas de trabalho para ter o break-even semanal como meta de acompanhamento.',
    guia: 'G02',
  },
  'FIN-09': {
    codigo: 'FIN-09',
    nome: 'Relatório Mensal de Fechamento',
    descricao: 'No dia 1–5 de cada mês: fechar o mês anterior com DRE, comparar com meta, identificar desvios. Reunião de 30 minutos com dados, não com opinião. Decide as ações do mês seguinte.',
    guia: 'G02',
  },
  'FIN-10': {
    codigo: 'FIN-10',
    nome: 'Política de Retirada Estruturada',
    descricao: 'Formalizar a política de retirada do sócio: valor fixo calculado sobre o lucro real, conta bancária separada PF/PJ, retirada documentada como item do DRE. Nunca retirar sobre o faturamento.',
    guia: 'G02',
  },
  'FIN-11': {
    codigo: 'FIN-11',
    nome: 'Dashboard Gerencial por Vendedor/Canal',
    descricao: 'Painel de acompanhamento com vendas por vendedor, canal e cliente. Identifica onde estão as margens mais altas e os gargalos comerciais. Ferramenta: Google Sheets.',
    guia: 'G05',
  },
  'FIN-12': {
    codigo: 'FIN-12',
    nome: 'Calendário de Pagamentos Concentrado',
    descricao: 'Mapear todas as dívidas e pagamentos recorrentes num calendário único. Agrupar por semana para ter visibilidade de caixa e eliminar "surpresas" que forçam decisões emergenciais.',
    guia: 'G02',
  },
  'FIN-13': {
    codigo: 'FIN-13',
    nome: 'Dashboard BI Financeiro (Mínimo Viável)',
    descricao: 'Painel com faturamento bruto, custos fixos, custos variáveis, lucro líquido, margem por produto e contas a pagar nos próximos 30 dias. Atualizado quinzenalmente. Critério: responder "qual foi o lucro do mês?" sem abrir planilha.',
    guia: 'G13',
  },
  'FIN-14': {
    codigo: 'FIN-14',
    nome: 'BPO Financeiro como Estrutura Transitória',
    descricao: 'Terceirizar para um BPO financeiro externo a criação e manutenção dos instrumentos financeiros gerenciais quando não há capacidade interna: fluxo de caixa projetado 13 semanas, DRE simples mensal, conciliação bancária. Distinção crítica: contabilidade fiscal registra o passado; BPO financeiro projeta o futuro.',
    guia: 'G02',
  },
  'FIN-15': {
    codigo: 'FIN-15',
    nome: 'Sistema Profit First',
    descricao: 'Inverter a fórmula: Receita − Lucro = Despesas. Abrir 4 contas separadas (Receita, Lucro, Pró-labore, Impostos, Operacional) e distribuir cada entrada antes de pagar qualquer despesa. Ponto de partida: 1% Lucro, 20% Impostos, 50% Pró-labore, resto Operacional.',
    guia: 'G12',
  },
  'FIN-16': {
    codigo: 'FIN-16',
    nome: 'Mapa de Gestão de Cobrança/Inadimplência',
    descricao: 'Planilha de controle de inadimplência com campos obrigatórios: nome, data do contrato, valor total, saldo devedor, nova prestação, estado do contrato, responsável pela cobrança, próximo contato. Processo: financeiro faz a cobrança → jurídico só entra após esgotadas as tentativas operacionais.',
    guia: 'G02',
  },
  'FIN-17': {
    codigo: 'FIN-17',
    nome: 'Custo Real por Colaborador',
    descricao: 'Calcular o custo efetivo de cada colaborador pelo que rende ao negócio: receita gerada ÷ custo total (salário + encargos + materiais). O colaborador "mais caro" não é quem recebe mais — é quem tem menor índice rendimento/custo.',
    guia: 'G05',
  },
  'FIN-18': {
    codigo: 'FIN-18',
    nome: 'Reunião de Início de Mês',
    descricao: 'No primeiro dia útil de cada mês, analisar o mês anterior: quanto faturou, o que mais vendeu, se bateu a meta dos serviços prioritários. Define: quais serviços atacar este mês e qual ação comercial fazer.',
    guia: 'G09',
  },
  'FIN-19': {
    codigo: 'FIN-19',
    nome: 'Acompanhamento Semanal do Break-Even',
    descricao: 'Toda sexta-feira: comparar faturação da semana com o break-even semanal. Se passou: qualquer receita adicional é lucro puro. Se falta: ativar imediatamente (ligar para clientes, priorizar serviços de maior ticket). Break-even semanal = custo fixo mensal ÷ semanas de trabalho.',
    guia: 'G02',
  },
  'FIN-20': {
    codigo: 'FIN-20',
    nome: 'Cálculo do Ticket Médio como Diagnóstico',
    descricao: 'Ticket médio = faturamento ÷ número de atendimentos. Revela a alavanca disponível: crescer por volume de atendimentos OU por ticket. Com agenda cheia, a única saída é subir o ticket. Com agenda vazia, a saída é volume.',
    guia: 'G02',
  },
  'FIN-21': {
    codigo: 'FIN-21',
    nome: 'Mapa de Rentabilidade por Serviço/Produto',
    descricao: 'Tabela: serviço | preço de venda | custo de material | custo de mão de obra | margem bruta | classificação (ótimo/bom/regular). Revela quais serviços sustentam o negócio e quais apenas ocupam tempo.',
    guia: 'G02',
  },
  'FIN-22': {
    codigo: 'FIN-22',
    nome: 'Meta de Atendimentos Diários por Serviço Âncora',
    descricao: 'Calcular o número mínimo de atendimentos diários do serviço de maior margem necessários para cobrir o custo fixo: custo fixo ÷ margem por atendimento = mínimo diário. Abaixo = prejuízo; acima = lucro.',
    guia: 'G02',
  },
  'FIN-23': {
    codigo: 'FIN-23',
    nome: 'Reunião Mensal de Resultados entre Sócios',
    descricao: 'Os sócios reúnem-se no dia 5 de cada mês para fechar os resultados do mês anterior: faturamento bruto, custos, resultado líquido, metas atingidas. Reunião com pauta fixa, duração máxima 90 min.',
    guia: 'G09',
  },
  'FIN-24': {
    codigo: 'FIN-24',
    nome: 'Acordo de Confidencialidade Financeira',
    descricao: 'Todo colaborador com acesso a informação financeira privilegiada (faturamento, salários, margens, retiradas) assina adenda de confidencialidade por escrito. Narrativa: "auditoria identificou que faltava este adendo — é procedimento padrão".',
    guia: 'G08',
  },
  'FIN-25': {
    codigo: 'FIN-25',
    nome: 'Dashboard de Meta Mensal com Progresso Diário',
    descricao: 'Painel simples atualizado diariamente com três valores: faturamento acumulado | meta mensal | quanto falta. O dono vê em tempo real se precisa agir. Sem este painel, o resultado só é conhecido no final do mês — tarde demais.',
    guia: 'G13',
  },
  'FIN-26': {
    codigo: 'FIN-26',
    nome: 'Cálculo Inverso: da Meta para Atendimentos/Dia',
    descricao: 'Determinar o número mínimo de atendimentos por dia a partir do resultado desejado: (meta mensal + custo fixo) ÷ dias úteis ÷ ticket médio = atendimentos mínimos por dia.',
    guia: 'G02',
  },
  'FIN-27': {
    codigo: 'FIN-27',
    nome: 'Cálculo de Internalização vs. Terceirização',
    descricao: 'Antes de internalizar serviço externo: comparar custo médio dos últimos 6 meses com o fornecedor vs. custo interno estimado (espaço + pessoa + insumos + amortização). Só avançar se custo interno claramente inferior E existir gestor que não seja o dono para gerir.',
    guia: 'G05',
  },
  'FIN-28': {
    codigo: 'FIN-28',
    nome: 'Reserva para Meses Sazonalmente Fracos',
    descricao: 'Negócios com sazonalidade previsível devem construir reserva de 2–3 meses de custos fixos durante o período forte. Regra: não gastar tudo nos meses bons — os meses fracos já estão confirmados no calendário. Separar fisicamente (conta à parte) durante o pico.',
    guia: 'G02',
  },

  // ── Bloco COM — Comercial e Aquisição ─────────────────────────────────
  'COM-01': {
    codigo: 'COM-01',
    nome: 'Script de Vendas Básico',
    descricao: 'Criar um script simples e documentado para o processo de venda: abertura → identificação de necessidade → apresentação → tratamento de objeções → fechamento. O script reduz dependência do "talento" individual do vendedor.',
    guia: 'G07',
  },
  'COM-02': {
    codigo: 'COM-02',
    nome: 'ICP — Cliente Ideal Documentado',
    descricao: 'Definir e documentar o perfil do cliente ideal: dados demográficos, comportamentais, dores prioritárias, critérios de decisão de compra. Compartilhar com toda a equipe comercial.',
    guia: 'G07',
  },
  'COM-03': {
    codigo: 'COM-03',
    nome: 'Funil de Vendas em 3 Etapas',
    descricao: 'Estruturar o funil básico: Topo (geração de interesse) → Meio (qualificação e proposta) → Fundo (fechamento e pós-venda). Definir a ação específica em cada etapa e o prazo máximo para avançar.',
    guia: 'G07',
  },
  'COM-04': {
    codigo: 'COM-04',
    nome: 'WhatsApp Business com Catálogo',
    descricao: 'Configurar perfil profissional no WhatsApp Business com catálogo de produtos/serviços, horário de atendimento, respostas rápidas para as 5 perguntas mais frequentes.',
    guia: 'G07',
  },
  'COM-05': {
    codigo: 'COM-05',
    nome: 'Google Meu Negócio Otimizado',
    descricao: 'Criar e manter o perfil do Google Meu Negócio: fotos atualizadas, horários corretos, respostas às avaliações, posts mensais. É o canal de aquisição orgânica mais barato e eficaz para negócios locais.',
    guia: 'G07',
  },
  'COM-06': {
    codigo: 'COM-06',
    nome: 'Reativação de Base Inativa',
    descricao: 'Identificar clientes que não compram há 60+ dias e criar campanha de reativação personalizada via WhatsApp ou telefone. Um cliente inativo é mais fácil de reativar do que um cliente novo é de conquistar.',
    guia: 'G07',
  },
  'COM-07': {
    codigo: 'COM-07',
    nome: 'Meta Semanal de Vendas',
    descricao: 'Definir meta semanal de vendas derivada da meta mensal (meta mensal ÷ 4). Acompanhar toda segunda-feira. O que não é medido semanalmente só aparece quando já é tarde para corrigir.',
    guia: 'G07',
  },
  'COM-08': {
    codigo: 'COM-08',
    nome: 'Comissão por Produto Âncora',
    descricao: 'Criar comissão específica e maior para o produto/serviço de maior margem ou de maior importância estratégica. O vendedor vai vender o que mais rende para ele — alinhe com o que mais rende para a empresa.',
    guia: 'G07',
  },
  'COM-09': {
    codigo: 'COM-09',
    nome: 'Follow-up Automatizado',
    descricao: 'Criar sequência de follow-up padronizada para leads que não fecharam: D+1 (verificação), D+3 (nova proposta ou pergunta), D+7 (última tentativa). Registrar em planilha ou CRM simples.',
    guia: 'G07',
  },
  'COM-10': {
    codigo: 'COM-10',
    nome: 'Relatório Semanal de Oportunidades',
    descricao: 'Relatório simples toda segunda-feira: quantos leads no pipeline, quantos em negociação, quantos fechamentos esperados esta semana. Cria visibilidade do funil em tempo real.',
    guia: 'G07',
  },
  'COM-11': {
    codigo: 'COM-11',
    nome: 'Sala de Guerra — Mapa Visual de Vendas',
    descricao: 'Painel físico ou digital com: meta mensal, realizado, pipeline, clientes em negociação, motivos de perda. Reunião semanal de revisão (máx. 30 min). Cria visibilidade coletiva e pressão positiva de equipe.',
    guia: 'G07',
  },
  'COM-12': {
    codigo: 'COM-12',
    nome: 'Bônus Mensal (Cenoura à Frente)',
    descricao: 'Substituir bônus trimestral por bônus mensal por meta atingida. O vendedor que não vê resultado em 30 dias perde engajamento. A cenoura tem que estar à frente, não atrás.',
    guia: 'G07',
  },
  'COM-13': {
    codigo: 'COM-13',
    nome: 'Entrevista Estratégica Individual com Vendedor',
    descricao: 'Conversa individual estruturada antes de definir metas ou processos. Perguntas-chave: o que te impede de vender mais? O que você precisa que não tem? Qual cliente seria mais fácil de atender?',
    guia: 'G06',
  },
  'COM-14': {
    codigo: 'COM-14',
    nome: 'Funil de Vendas B2B por Fase de Relação',
    descricao: 'Estruturar funil B2B com etapas: Desconhecido → Contato Inicial → Reunião/Proposta → Negociação → Fechamento → Pós-venda. Cada etapa tem ação definida e prazo máximo. Especialmente importante em vendas longas.',
    guia: 'G07',
  },
  'COM-15': {
    codigo: 'COM-15',
    nome: 'Programa de Fidelização de Intermediários',
    descricao: 'Criar programa formal para intermediários (eletricistas, contadores, instaladores) que indicam clientes: cadastro digital, pontuação por compra, eventos mensais com sorteio. O intermediário que indica não é cliente — é canal.',
    guia: 'G07',
  },
  'COM-16': {
    codigo: 'COM-16',
    nome: 'Campanha de Testemunho de Longevidade',
    descricao: 'Identificar clientes com 5+ anos de relacionamento e criar campanha formal de testemunho: vídeo curto, depoimento escrito, post no Instagram. Cliente de 20 anos é prova social que nenhum anúncio compra.',
    guia: 'G11',
  },
  'COM-21': {
    codigo: 'COM-21',
    nome: 'Meta Desdobrada em Cascata (Mensal→Semanal→Diária)',
    descricao: 'Dividir a meta mensal em metas semanais e diárias com acompanhamento explícito. Na reunião semanal: "Você tinha que vender X esta semana. Vendeu quanto? O que houve?" — sem crítica, com silêncio como ferramenta. Cria accountability natural sem microgestão.',
    guia: 'G09',
  },
  'COM-23': {
    codigo: 'COM-23',
    nome: 'Reunião Semanal de Equipe com Pauta Fixa',
    descricao: 'Reunião semanal com a equipe de vendas com pauta fixa e imutável: (1) Meta — onde estamos vs. onde precisamos; (2) Resultado — o que foi vendido; (3) Gargalo — o que travou. A pauta nunca varia para educar o vendedor a trazer a informação antes de ser pedida.',
    guia: 'G13',
  },
  'COM-24': {
    codigo: 'COM-24',
    nome: 'Relatório Quinzenal Obrigatório por Vendedor',
    descricao: 'Vendedor envia relatório na 1ª e 3ª semana do mês: o que vendeu, o que fechou, o que precisa de suporte. Estabelecido no onboarding. Quem não envia sinaliza desconexão.',
    guia: 'G05',
  },
  'COM-25': {
    codigo: 'COM-25',
    nome: 'Conteúdo Antes de Tráfego Pago',
    descricao: 'Antes de contratar mídia paga: garantir que existe conteúdo com valor real. Sequência correta: (1) Agência/profissional de conteúdo; (2) Catálogo atualizado; (3) Gestor de tráfego pago separado. Tráfego pago sem conteúdo = anticonteúdo.',
    guia: 'G11',
  },
  'COM-26': {
    codigo: 'COM-26',
    nome: 'Campanha de Resgate Sazonal com Bonificação Dobrada',
    descricao: 'Ação de resgate pontual para meses com 1ª semana fraca: bonificação dobrada simultânea para vendedor + cliente. Usar no máximo uma vez por bimestre. Guardar "na manga" para meses de queda sazonal conhecida.',
    guia: 'G07',
  },
  'COM-27': {
    codigo: 'COM-27',
    nome: 'Fundador como Embaixador de Alta Conta',
    descricao: 'Reservar o fundador exclusivamente para manutenção de relacionamento com os top-clientes: visitas trimestrais com gesto simbólico (kit brinde, café, presença pessoal). Pré-condição: gestor ou equipe capaz de segurar a operação.',
    guia: 'G01',
  },
  'COM-29': {
    codigo: 'COM-29',
    nome: 'Mutião de Formalização Contratual',
    descricao: 'Para empresas com clientes sem contrato: convocar cada cliente individualmente para reunião presencial em ambiente profissional preparado (sala de hotel, equipe jurídica presente, vídeos de resultados na TV) para assinar contrato. Narrativa: "auditoria e precisamos formalizar". 4 clientes/dia sem cruzamento.',
    guia: 'G07',
  },
  'COM-30': {
    codigo: 'COM-30',
    nome: 'Venda Casada por Oportunidade de Cadeira',
    descricao: 'Enquanto o técnico executa um serviço, identificar ativamente um serviço complementar que o cliente pode realizar naquele momento. Oferecer com desconto específico por ser "agora, enquanto já estou aqui".',
    guia: 'G07',
  },
  'COM-31': {
    codigo: 'COM-31',
    nome: 'Protocolo de Recorrência: Próxima Marcação',
    descricao: 'Todo cliente sai do atendimento com a próxima visita agendada. Responsabilidade da recepcionista (não do técnico). Se cliente recusar, registrar contato e fazer follow-up na data em que o serviço caduca.',
    guia: 'G07',
  },
  'COM-32': {
    codigo: 'COM-32',
    nome: 'CS Pós-Atendimento Delegado',
    descricao: 'Envio de mensagem estruturada ao cliente 24–48h após o atendimento. Delegado ao menor custo de mão de obra disponível (recepcionista). O dono nunca executa este contato rotineiro.',
    guia: 'G07',
  },
  'COM-33': {
    codigo: 'COM-33',
    nome: 'Cartão de Parceria Comercial com Lojistas da Zona',
    descricao: 'Criar cartão físico de desconto (10–15%) para funcionários de comércios vizinhos. Objetivo duplo: tornam-se clientes recorrentes e recomendam o serviço para clientes do seu próprio comércio.',
    guia: 'G07',
  },
  'COM-34': {
    codigo: 'COM-34',
    nome: 'QR Code Google Reviews no Momento de Satisfação',
    descricao: 'Imediatamente após o atendimento, enquanto o cliente ainda está satisfeito, a recepcionista pede 5 segundos para apontar a câmera a um QR Code que abre diretamente a página de Google Reviews.',
    guia: 'G07',
  },
  'COM-35': {
    codigo: 'COM-35',
    nome: 'Combo de Serviços com Desconto para Aumentar Frequência',
    descricao: 'Criar combo de dois serviços complementares com desconto por sessão, pago periodicamente. Cliente que vinha uma vez por mês passa a vir duas vezes. O faturamento por cliente aumenta mesmo com desconto unitário.',
    guia: 'G07',
  },
  'COM-36': {
    codigo: 'COM-36',
    nome: 'Preçário por Alta Estação',
    descricao: 'Tabela diferenciada de preços por período (alta/baixa estação). Clientes pagam mais quando a demanda é maior. Definir antes do início de cada período com aviso prévio.',
    guia: 'G03',
  },
  'COM-37': {
    codigo: 'COM-37',
    nome: 'Reserva Antecipada com Sinal Não Reembolsável',
    descricao: 'Cobrar 50% do valor no momento da marcação como sinal não reembolsável. Elimina faltas não avisadas. Quem paga para reservar, aparece.',
    guia: 'G03',
  },
  'COM-38': {
    codigo: 'COM-38',
    nome: 'CRM de Reativação por Serviço',
    descricao: 'Planilha com: nome do cliente | serviço | data da última visita | duração estimada do efeito. Gera alerta quando o prazo de retorno é atingido. A recepção contata proativamente.',
    guia: 'G07',
  },
  'COM-39': {
    codigo: 'COM-39',
    nome: 'Preenchimento Ativo da Agenda por Desmarcação',
    descricao: 'Manter lista de espera permanente. Quando há desmarcação, a recepção aciona imediatamente a lista. O horário vazio raramente fica por preencher mais de 2 horas.',
    guia: 'G07',
  },
  'COM-40': {
    codigo: 'COM-40',
    nome: 'Campanha de Reativação por Lista de Transmissão WhatsApp',
    descricao: 'Segmentar base de clientes por serviço e enviar mensagem individual via lista de transmissão (não em grupo) com cadência de 15–20 dias por grupo. Cada mensagem deve parecer comunicação individual.',
    guia: 'G07',
  },
  'COM-41': {
    codigo: 'COM-41',
    nome: 'Comissão Percentual da Recepção sobre Faturamento',
    descricao: 'Atribuir à recepcionista um percentual pequeno (ex: 1%) sobre o faturamento bruto mensal. Cria alinhamento direto entre resultado do negócio e interesse da pessoa que controla a agenda.',
    guia: 'G07',
  },
  'COM-42': {
    codigo: 'COM-42',
    nome: 'Mentalidade Comercial para Técnicos',
    descricao: 'Atribuir a técnicos uma meta mensal de procedimentos-chave com comissão incremental se atingida. O técnico não fecha a venda — orienta e passa o fecho à recepção.',
    guia: 'G07',
  },
  'COM-43': {
    codigo: 'COM-43',
    nome: 'Campanha de Formalização Contratual com Ambiente de Confiança',
    descricao: 'Quando há relação comercial ativa sem contrato assinado, a formalização deve acontecer em ambiente profissional preparado: sala profissional, presença de diretor técnico + jurídico + comercial, material visual de resultados recentes. Narrativa: "passamos por auditoria e precisamos formalizar".',
    guia: 'G07',
  },
  'COM-44': {
    codigo: 'COM-44',
    nome: 'Teste de Canal TikTok Live para Varejo',
    descricao: 'Para varejo presencial com produto físico: testar lives no TikTok como canal de venda ativo — sessões de 3–4 horas com vendedoras apresentando produtos em tempo real. Testar mínimo 2 meses com frequência semanal antes de avaliar ROI.',
    guia: 'G11',
  },
  'COM-45': {
    codigo: 'COM-45',
    nome: 'Branding Pessoal do Fundador como Ecossistema Comercial',
    descricao: 'Para negócios onde o dono é o principal diferencial: migrar progressivamente para o nome do fundador como marca central. Constrói-se em camadas: presença nas redes → eventos VIP → clube de clientes → autoridade no setor.',
    guia: 'G11',
  },
  'COM-46': {
    codigo: 'COM-46',
    nome: 'Eventos VIP com Gamificação de Cliente',
    descricao: 'Eventos exclusivos para carteira VIP com reconhecimento público da cliente mais fiel: anunciar em voz alta e entregar prêmio à cliente de maior compra no período. As outras querem alcançar esse lugar no próximo evento.',
    guia: 'G07',
  },

  // ── Bloco LID — Liderança e Delegação ─────────────────────────────────
  'LID-01': {
    codigo: 'LID-01',
    nome: 'Rotina Semanal do CEO',
    descricao: 'Definir e proteger blocos fixos semanais do dono para: revisão financeira, reunião de equipe, planejamento estratégico e desenvolvimento pessoal. A rotina do líder define o ritmo do negócio.',
    guia: 'G01',
  },
  'LID-02': {
    codigo: 'LID-02',
    nome: 'Separação Decisão Estratégica vs. Operacional',
    descricao: 'Mapear quais decisões são estratégicas (só o dono decide) vs. operacionais (equipe decide dentro de parâmetros definidos). Documentar os critérios de cada tipo para reduzir interrupções ao dono.',
    guia: 'G01',
  },
  'LID-03': {
    codigo: 'LID-03',
    nome: 'Protocolo de Contratação',
    descricao: 'Criar processo padronizado de contratação: perfil de cargo por função, critérios de seleção, método de entrevista, período de experiência com 30-60-90 dias definidos antes do primeiro dia.',
    guia: 'G06',
  },
  'LID-04': {
    codigo: 'LID-04',
    nome: 'Onboarding de Colaborador 30-60-90 Dias',
    descricao: 'Criar plano de integração com marcos claros para 30, 60 e 90 dias: o que o colaborador deve saber, dominar e executar com autonomia em cada etapa. Definir antes do primeiro dia de trabalho.',
    guia: 'G06',
  },
  'LID-05': {
    codigo: 'LID-05',
    nome: 'Avaliação de Desempenho Trimestral',
    descricao: 'Avaliar cada colaborador a cada 3 meses contra métricas definidas no início do período: metas atingidas, comportamentos esperados e desenvolvimento. A avaliação não pode ser surpresa.',
    guia: 'G01',
  },
  'LID-06': {
    codigo: 'LID-06',
    nome: 'Playbook + Estagiário para Libertar o Gestor',
    descricao: 'Documentar os 5 processos mais repetitivos do dono em formato de playbook (checklist + vídeo curto). Treinar estagiário ou colaborador junior com o playbook. Critério de delegação: processo funciona por 30 dias sem intervenção do dono.',
    guia: 'G05',
  },
  'LID-07': {
    codigo: 'LID-07',
    nome: 'OKR Trimestral de Alta Direção',
    descricao: 'Definir 1 Objetivo e 3 Key Results por trimestre para o CEO/diretoria. Objetivo: qualitativo, inspirador. KRs: mensuráveis e binários. Revisão mensal de progresso.',
    guia: 'G09',
  },
  'LID-08': {
    codigo: 'LID-08',
    nome: 'Playbook Financeiro para Delegação',
    descricao: 'Criar playbook específico para rotinas financeiras (fechamento mensal, conciliação bancária, DRE, pagamento de fornecedores). Permite delegar financeiro sem perder controle. Critério: gestor revisa, não executa.',
    guia: 'G08',
  },
  'LID-10': {
    codigo: 'LID-10',
    nome: 'As 3 Fases de Delegação',
    descricao: 'Framework de transferência de conhecimento em 3 fases sequenciais: (1) Eu faço, você olha; (2) Você faz, eu olho; (3) Você faz sozinho. Cada fase dura 30–60 dias. O critério de avanço é consistência de padrão, não tempo.',
    guia: 'G05',
  },
  'LID-11': {
    codigo: 'LID-11',
    nome: 'Onboarding Presencial de Cultura da Empresa',
    descricao: 'Evento presencial com novos contratados antes do início do ciclo de trabalho. Não é treino técnico — é passagem de cultura: como funciona, o que se espera, o que não se tolera, as regras de presença comercial.',
    guia: 'G06',
  },
  'LID-12': {
    codigo: 'LID-12',
    nome: 'Check-in Quinzenal Individual com Vendedor',
    descricao: 'Conversa individual com cada vendedor a cada 15 dias: (1) Como correu esta quinzena? (2) O que precisou da empresa e não teve? (3) Como está a relação com os clientes? Duração: 10–15 min. Formato: chamada ou presencial.',
    guia: 'G01',
  },
  'LID-13': {
    codigo: 'LID-13',
    nome: 'Redução Gradual de Serviço Próprio',
    descricao: 'Quando o dono precisa sair de um serviço operacional: reduzir gradualmente com comunicado claro à equipe. Faseamento: reduzir dias → comunicar individualmente → migrar clientes organicamente → encerrar.',
    guia: 'G05',
  },
  'LID-14': {
    codigo: 'LID-14',
    nome: 'Supervisão Micro Diária',
    descricao: 'No fim de cada dia, uma pergunta rápida à colaboradora chave: "Quantas clientes foram hoje?" São 30 segundos. As colaboradoras percebem que existe liderança ativa e ajustam o comportamento.',
    guia: 'G01',
  },
  'LID-15': {
    codigo: 'LID-15',
    nome: 'Meta de Atendimentos por Colaboradora por Dia',
    descricao: 'Converter a meta financeira em número de atendimentos por colaboradora por dia. Calcular histórico individual, estabelecer meta com aumento de 1–2 atendimentos/dia, perguntar todo fim de expediente.',
    guia: 'G01',
  },
  'LID-16': {
    codigo: 'LID-16',
    nome: 'Delegação Total de Abertura e Fechamento',
    descricao: 'O dono deixa de abrir e fechar o espaço fisicamente. Colaborador sênior recebe as chaves, o protocolo de abertura e o checklist de fecho. Primeiro ato concreto de delegação operacional.',
    guia: 'G05',
  },
  'LID-17': {
    codigo: 'LID-17',
    nome: '1:1 com Cada Colaborador Pós-Reestruturação',
    descricao: 'Após saída de colaborador ou reestruturação: (1) conversa individual com cada pessoa que ficou para ouvir preocupações; (2) reunião coletiva para apresentar o novo formato. Durante 2 meses consecutivos.',
    guia: 'G01',
  },
  'LID-18': {
    codigo: 'LID-18',
    nome: 'Divisão da Agenda por Blocos: Operação vs. Gestão',
    descricao: 'O dono define com a recepção que X horas por dia não são marcáveis para clientes — são blocos reservados para gestão. Instrução permanente: esses horários não existem para marcações externas.',
    guia: 'G04',
  },
  'LID-19': {
    codigo: 'LID-19',
    nome: 'Playbook de Onboarding para Técnicos',
    descricao: 'Documento (ou sequência de vídeos com checklist) que todo novo colaborador técnico completa antes de atender. Cobre: protocolos técnicos, regras da empresa, cultura, padrão de atendimento. Incluir mecanismo de validação.',
    guia: 'G08',
  },
  'LID-20': {
    codigo: 'LID-20',
    nome: 'Quadro Visual de Metas da Equipe',
    descricao: 'Quadro simples em espaço exclusivo de staff com o nome de cada colaborador, a meta mensal e o resultado acumulado atualizado semanalmente. O colaborador auto-regula sem o dono ter que intervir.',
    guia: 'G05',
  },
  'LID-21': {
    codigo: 'LID-21',
    nome: 'Consultoria Externa para Documentar Processos',
    descricao: 'Antes de expandir para segunda unidade: contratar consultoria especializada para acompanhar a operação existente in situ (2–6 dias), diagnosticar e documentar os processos atuais. Briefing obrigatório: "processos devem suportar o dobro do volume atual — estou preparando expansão".',
    guia: 'G08',
  },
  'LID-22': {
    codigo: 'LID-22',
    nome: 'Protocolo de Confronto com Luva de Veludo',
    descricao: 'Para colaborador com comportamento que contamina a equipe: (1) reunião privada em ambiente descontraído; (2) deixar a pessoa falar completamente; (3) dar a veredita clara com expectativa e prazo; (4) 10–15 dias para mudar; (5) sem mudança → processo de demissão.',
    guia: 'G01',
  },
  'LID-23': {
    codigo: 'LID-23',
    nome: 'Auditoria da Própria Cultura via 1:1s Regulares',
    descricao: 'Quando o dono percebe comportamentos desalinhados: reuniões 1:1 quinzenais obrigatórias com cada colaborador-chave. Pauta: (a) o que está correndo bem; (b) o que precisa mudar; (c) como posso ajudar. Feedback imediato sobre comportamentos fora do padrão.',
    guia: 'G01',
  },

  // ── Bloco OPE — Operações e Processos ─────────────────────────────────
  'OPE-01': {
    codigo: 'OPE-01',
    nome: 'Mapeamento de Fluxo de Valor',
    descricao: 'Mapear o fluxo completo de valor: do pedido do cliente até a entrega do produto/serviço. Identificar todas as etapas, tempos, responsáveis e pontos de espera. Base para qualquer otimização operacional.',
    guia: 'G08',
  },
  'OPE-02': {
    codigo: 'OPE-02',
    nome: 'SLA Mínimo de Atendimento',
    descricao: 'Definir e documentar o tempo máximo de resposta para cada tipo de contato: WhatsApp (4h), e-mail (24h), telefone (imediato). Comunicar para clientes e cobrar internamente.',
    guia: 'G08',
  },
  'OPE-03': {
    codigo: 'OPE-03',
    nome: 'Checklist de Abertura/Fechamento',
    descricao: 'Criar checklists documentados para abertura e fechamento do negócio: o que verificar, o que preparar, o que registrar. Elimina variações de qualidade dependentes de quem está de plantão.',
    guia: 'G08',
  },
  'OPE-04': {
    codigo: 'OPE-04',
    nome: 'Padrão de Orçamento Documentado',
    descricao: 'Criar template padrão de orçamento com todos os campos obrigatórios: escopo, prazo, valor, forma de pagamento, o que está e o que não está incluído. O orçamento padrão reduz negociação e mal-entendidos.',
    guia: 'G08',
  },
  'OPE-05': {
    codigo: 'OPE-05',
    nome: 'Registro de Ocorrências e Retrabalho',
    descricao: 'Criar registro sistemático de ocorrências e retrabalho: o que aconteceu, quando, quem envolveu, qual foi o custo. O que não é medido não é gerenciado — e o retrabalho é o maior inimigo silencioso da margem.',
    guia: 'G08',
  },
  'OPE-06': {
    codigo: 'OPE-06',
    nome: 'Organograma Funcional por Fase',
    descricao: 'Desenhar organograma por funções necessárias para a próxima fase do negócio, não por pessoas. Identificar quais funções o dono acumula hoje e qual é a próxima a ser delegada.',
    guia: 'G05',
  },
  'OPE-07': {
    codigo: 'OPE-07',
    nome: 'Mapa de Processos Críticos',
    descricao: 'Documentar os 5 processos mais críticos para a receita: atendimento, entrega, cobrança, recompra, onboarding. Cada processo: entrada → etapas → saída → responsável. Ferramenta mínima: fluxograma simples.',
    guia: 'G08',
  },
  'OPE-08': {
    codigo: 'OPE-08',
    nome: 'Ficha Técnica por Produto/Serviço',
    descricao: 'Documento por produto/serviço com: custo variável detalhado (matéria-prima + mão de obra direta), tempo de execução, piso de preço (break-even por unidade), preço atual e margem real. Atualizar a cada trimestre ou quando houver variação de custo > 5%.',
    guia: 'G03',
  },
  'OPE-10': {
    codigo: 'OPE-10',
    nome: 'Encarteirar Vendedores por Território',
    descricao: 'Dividir o portfólio de vendedores por zonas geográficas com coordenador responsável por cada zona (8–15 vendedores por coordenador). Critério: proximidade geográfica + perfil de vendedor. Escala: quando a equipe total supera 20 vendedores.',
    guia: 'G05',
  },
  'OPE-11': {
    codigo: 'OPE-11',
    nome: 'Dividir Equipe Grande em Sub-grupos para Reuniões',
    descricao: 'Equipes de vendas com mais de 15 pessoas: dividir em sub-grupos de 6–7 para reuniões semanais. Cada sub-grupo tem a mesma pauta. Gestor replica a reunião 2–3 vezes por semana. Grupos pequenos facilitam abertura.',
    guia: 'G01',
  },

  // ── Bloco MKT — Marketing e Posicionamento ────────────────────────────
  'MKT-01': {
    codigo: 'MKT-01',
    nome: 'Identidade Visual Mínima',
    descricao: 'Criar identidade visual mínima: logo profissional, paleta de cores definida (2–3 cores), fonte padrão. Aplicar consistentemente em todas as comunicações. A identidade visual transmite credibilidade antes de qualquer palavra.',
    guia: 'G11',
  },
  'MKT-02': {
    codigo: 'MKT-02',
    nome: 'Bio do Instagram com CTA',
    descricao: 'Otimizar a bio do Instagram: quem você atende (não o que você faz), qual a transformação que entrega, CTA claro para próximo passo (link, WhatsApp ou agendamento).',
    guia: 'G11',
  },
  'MKT-03': {
    codigo: 'MKT-03',
    nome: 'Link na Bio Rastreado',
    descricao: 'Colocar link na bio com destino rastreado: pode ser página de captura, cardápio digital, WhatsApp com mensagem pré-definida. Usar ferramenta de rastreamento para saber quantos visitantes chegam pelo link.',
    guia: 'G11',
  },
  'MKT-04': {
    codigo: 'MKT-04',
    nome: 'Calendário Editorial Semanal',
    descricao: 'Criar calendário editorial com pelo menos 3 posts por semana em 3 formatos distintos: produto/serviço (venda), educativo (autoridade) e humano (confiança). A consistência bate a perfeição.',
    guia: 'G11',
  },
  'MKT-05': {
    codigo: 'MKT-05',
    nome: 'Google Meu Negócio com Fotos e Horários',
    descricao: 'Criar e manter perfil completo do Google Meu Negócio: fotos profissionais do local, horários corretos, resposta a todas as avaliações, posts mensais. Canal gratuito que aumenta visibilidade local.',
    guia: 'G07',
  },
  'MKT-06': {
    codigo: 'MKT-06',
    nome: 'Parceria com Autoridade Local',
    descricao: 'Identificar 2–3 figuras de autoridade local (influenciadores, líderes comunitários, profissionais complementares) e criar parceria de indicação mútua ou co-criação de conteúdo.',
    guia: 'G11',
  },

  // ── Bloco ESS — Espiritualidade e Propósito ───────────────────────────
  'ESS-01': {
    codigo: 'ESS-01',
    nome: 'Declaração de Missão/Propósito',
    descricao: 'Escrever a declaração de missão do negócio em 2 frases: por que existe (além do lucro) e a quem serve. A missão deve ser capaz de orientar decisões difíceis quando os números não ajudam.',
    guia: 'G14',
  },
  'ESS-02': {
    codigo: 'ESS-02',
    nome: 'Oração de Abertura de Sessão',
    descricao: 'Iniciar cada sessão de planejamento ou reunião estratégica com oração de alinhamento espiritual. Âncora: Provérbios 16:3 — "Entrega ao Senhor o que fazes, e teus projetos serão bem-sucedidos".',
    guia: 'G14',
  },
  'ESS-03': {
    codigo: 'ESS-03',
    nome: 'Âncora Bíblica Personalizada por Desafio',
    descricao: 'Identificar e memorizar um versículo específico para o principal desafio atual do negócio. A âncora bíblica não é ornamentação — é instrumento de tomada de decisão e resistência nos momentos difíceis.',
    guia: 'G14',
  },
  'ESS-04': {
    codigo: 'ESS-04',
    nome: 'Declaração Profética no Plano',
    descricao: 'Incluir no plano de ação uma declaração profética sobre o negócio e o empresário: o que Deus diz sobre o negócio, quem o empreendedor é em Cristo. Ancora o plano numa perspectiva de fé.',
    guia: 'G14',
  },
  'ESS-05': {
    codigo: 'ESS-05',
    nome: 'Integração Fé–Negócio no Discurso',
    descricao: 'Integrar valores cristãos no discurso de venda e marca de forma natural e não pregativa. A fé não é separada do negócio — é a fundação que sustenta as decisões difíceis.',
    guia: 'G14',
  },

  // ── Bloco POS — Posicionamento e Presença Digital ─────────────────────
  // (Bloco sintético — referenciado no Doc5 v2.1 mas ainda não codificado na Alma v5.14)
  'POS-01': {
    codigo: 'POS-01',
    nome: 'Posicionamento Único de Mercado',
    descricao: 'Definir e documentar a proposta de valor única: quem atende, que problema resolve, o que diferencia. Inclui ICP (cliente ideal documentado) e mensagem central. Base para toda comunicação e captação de clientes. Sem posicionamento claro, toda ação comercial é energia dispersa.',
  },
  'POS-02': {
    codigo: 'POS-02',
    nome: 'Construção de Presença Digital Orgânica',
    descricao: 'Para negócios com audiência nascente: otimizar perfil (bio, foto, destaques), definir ritmo de publicação semanal (mínimo 3 posts/semana), estabelecer formato de conteúdo consistente. Objetivo: existir digitalmente antes de qualquer investimento em tráfego pago.',
  },
  'POS-03': {
    codigo: 'POS-03',
    nome: 'Conteúdo como Canal de Aquisição',
    descricao: 'Para negócios com audiência existente (>100 seguidores): criar calendário editorial semanal com 3 formatos — produto/serviço (vende), educativo (constrói autoridade) e humano (gera confiança). Conteúdo consistente é o único ativo de marketing que cresce com o tempo.',
  },
  'POS-04': {
    codigo: 'POS-04',
    nome: 'Marketing Digital com Estrutura Consolidada',
    descricao: 'Para negócios com posicionamento e conteúdo estabelecidos: implementar tráfego pago estruturado, sequência de nutrição de leads e análise de ROI por canal. Ativado após base de conteúdo e posicionamento estar sólida — tráfego sem base amplifica os problemas existentes.',
  },

  // ── Bloco PRE — Pré-Receita / Iniciar (Modelo E/I) ────────────────────
  'PRE-01': {
    codigo: 'PRE-01',
    nome: 'Diagnóstico de Rotina Produtiva do Fundador',
    descricao: 'Antes de qualquer discussão de produto ou MVP: dedicar sessão ao mapa de segunda a sexta com horas reais por bloco (trabalho externo, família, sono, projeto). Revela o padrão universal de excesso de atividades sem prioridade.',
    guia: 'G04',
  },
  'PRE-02': {
    codigo: 'PRE-02',
    nome: 'Mapeamento de Disponibilidade Real',
    descricao: 'Mapear horas disponíveis reais por semana para o projeto. Se insuficientes, definir data-limite concreta para liberação: redução de horas no emprego, saída gradual, delegação doméstica. A data é compromisso escrito no plano.',
    guia: 'G04',
  },
  'PRE-03': {
    codigo: 'PRE-03',
    nome: 'Escrita do MVP Antes de Qualquer Execução',
    descricao: 'O MVP escrito precede qualquer reunião com cliente, apresentação ou execução técnica. Mínimo: (1) produto/serviço em 1 frase, (2) cliente-alvo específico, (3) promessa principal, (4) modelo de receita. Só quando dá para escrever é porque está claro.',
    guia: 'G03',
  },
  'PRE-04': {
    codigo: 'PRE-04',
    nome: 'Pesquisa de Mercado Ativa',
    descricao: 'Antes de definir posicionamento e preço: contatar 3–5 concorrentes como potencial cliente. Registrar: posicionamento, preço, forma de entrega, tipo de cliente. O objetivo é entender o campo, não copiar.',
    guia: 'G03',
  },
  'PRE-06': {
    codigo: 'PRE-06',
    nome: 'Primeira Validação Amigável',
    descricao: 'Apresentar o MVP a 2–3 pessoas de perfil semelhante ao cliente-alvo antes do mercado frio. Registrar as perguntas — revelam lacunas que o fundador não vê. "A validação chama-se ouvir a opinião de outras pessoas que não a nossa mãe."',
    guia: 'G03',
  },
  'PRE-07': {
    codigo: 'PRE-07',
    nome: 'Separação: Documento de Produto vs. Pitch Comercial',
    descricao: 'Dois documentos separados: (1) documento interno — produto em profundidade para os fundadores; (2) pitch comercial — responde "o que fazes e o que eu ganho" visualmente, antes de qualquer palavra. O pitch deve funcionar antes de o dono abrir a boca.',
    guia: 'G11',
  },
  'PRE-08': {
    codigo: 'PRE-08',
    nome: 'Portfólio com Experiência Corporativa Prévia',
    descricao: 'Converter toda experiência profissional anterior em linguagem de empresa: setores, países, ferramentas, volume. Narrativa: "prestamos serviço em parceria com X". Um trabalho real = case. Trabalho em emprego anterior = referência de setor.',
    guia: 'G11',
  },
  'PRE-10': {
    codigo: 'PRE-10',
    nome: 'Exercício das Múltiplas Perspectivas',
    descricao: 'Antes de cada reunião, definir em qual cadeira sentar: (1) Técnico — o como e as ferramentas; (2) Comercial — resultado e benefício; (3) Gestor de Projeto — prazos e entregáveis; (4) Cliente — o que ele precisa ouvir.',
    guia: 'G03',
  },
  'PRE-11': {
    codigo: 'PRE-11',
    nome: 'Conteúdo Antes do Formato (Texto Antes do Layout)',
    descricao: 'Escrever o texto da proposta/apresentação primeiro em formato simples (Word, papel). Só depois de aprovado pelos fundadores avança para layout. Design não resolve falta de clareza.',
    guia: 'G11',
  },
  'PRE-13': {
    codigo: 'PRE-13',
    nome: 'Definir Entregáveis e Prazo Antes de Falar de Preço',
    descricao: 'Antes de qualquer valor, documentar: o que é entregue em cada fase, quanto tempo dura, o que o cliente terá no final. Sequência: coleta de dados → diagnóstico e entregáveis → implementação. O preço só surge depois do mapa de valor claro.',
    guia: 'G03',
  },
  'PRE-14': {
    codigo: 'PRE-14',
    nome: 'Posicionamento como Parceiro Estratégico',
    descricao: 'Reformular o discurso de saída técnica (ferramentas, dados, dashboard) para resultado de negócio (clareza, otimização, receita). Não vende Power BI — vende clareza financeira.',
    guia: 'G11',
  },
  'PRE-16': {
    codigo: 'PRE-16',
    nome: 'Demo com Dados Mistos (Frankenstein)',
    descricao: 'Montar demo/portfólio sem cliente real: dados reais disponíveis + lacunas completadas com dados fictícios verossímeis. Apresentar como demonstração de capacidade. "Não é porque o dado é fake que não demonstra a capacidade de entregar o real."',
    guia: 'G03',
  },
};

// ── Per-model action tables — source: Doc5 v2.1 (Rogério Teixeira, Mai 2026) ──
export const ACOES_POR_MODELO: Record<string, ModeloAlmaConfig> = {
  // Modelo D — Fatura, Mas Não Sobra (Pilares: P5→P4→P6)
  D: {
    obrigatorias: ['FIN-01', 'FIN-02', 'FIN-03', 'FIN-05', 'FIN-09', 'FIN-10'],
    condicionais: [
      { codigo: 'FIN-06', campo: 'equipa_total', operador: '>', valor: 1 },
      { codigo: 'FIN-08', campo: 'dividas_curto_prazo', operador: '>', valor: 0 },
      { codigo: 'FIN-12', campo: 'o_que_sobra', operador: '=', valor: 'nada' },
      { codigo: 'FIN-13', campo: 'faturamento_medio_3m', operador: '>', valor: 20000 },
      { codigo: 'FIN-14', campo: 'sem_dre_flag', operador: '=', valor: true },
      { codigo: 'OPE-08', campo: 'precificacao_intuitiva', operador: 'truthy', valor: null },
      { codigo: 'FIN-16', campo: 'dividas_curto_prazo', operador: '>', valor: 0 },
      { codigo: 'COM-21', campo: 'equipa_comercial_count', operador: '>=', valor: 1 },
      { codigo: 'LID-10', campo: 'equipa_total', operador: '>', valor: 1 },
      { codigo: 'COM-29', campo: 'sem_contrato', operador: 'truthy', valor: null },
    ],
  },

  // Modelo E — Começou, Mas o Mercado Ainda Não Respondeu (Pilares: P1→P2→P3)
  E: {
    obrigatorias: ['POS-01', 'COM-01', 'COM-02', 'COM-07', 'PRE-01', 'PRE-03'],
    condicionais: [
      // POS-03 se audiencia>0 (iniciante ou ativo)
      { codigo: 'POS-03', campo: 'audiencia_digital_status', operador: '=', valor: 'iniciante' },
      { codigo: 'POS-03', campo: 'audiencia_digital_status', operador: '=', valor: 'ativo' },
      { codigo: 'COM-05', campo: 'tem_leads', operador: 'truthy', valor: null },
      { codigo: 'PRE-04', campo: 'tem_dados_mercado', operador: '=', valor: false },
      { codigo: 'PRE-06', campo: 'produto_validado', operador: '=', valor: false },
      { codigo: 'PRE-07', campo: 'tem_pitch_visual', operador: '=', valor: false },
    ],
  },

  // Modelo C — Entrega Bem, Cobra Mal (Pilares: P3→P5→P2)
  C: {
    obrigatorias: ['FIN-01', 'FIN-02', 'FIN-05', 'COM-07', 'POS-01'],
    condicionais: [
      { codigo: 'FIN-08', campo: 'dividas_curto_prazo', operador: '>', valor: 0 },
      // POS-03 se audiencia>0
      { codigo: 'POS-03', campo: 'audiencia_digital_status', operador: '=', valor: 'iniciante' },
      { codigo: 'POS-03', campo: 'audiencia_digital_status', operador: '=', valor: 'ativo' },
      { codigo: 'FIN-14', campo: 'sem_dre_flag', operador: '=', valor: true },
      { codigo: 'FIN-16', campo: 'dividas_curto_prazo', operador: '>', valor: 0 },
      { codigo: 'COM-29', campo: 'sem_contrato', operador: 'truthy', valor: null },
      { codigo: 'OPE-08', campo: 'precificacao_intuitiva', operador: 'truthy', valor: null },
    ],
  },

  // Modelo F — Vende Bem, Mas Não Sabe Trazer o Próximo Cliente (Pilares: P6→P2→P5)
  F: {
    obrigatorias: ['COM-01', 'COM-02', 'COM-04', 'COM-05', 'COM-06', 'COM-08'],
    condicionais: [
      // POS-02/POS-03 se audiencia>0
      { codigo: 'POS-02', campo: 'audiencia_digital_status', operador: '=', valor: 'iniciante' },
      { codigo: 'POS-02', campo: 'audiencia_digital_status', operador: '=', valor: 'ativo' },
      { codigo: 'POS-03', campo: 'audiencia_digital_status', operador: '=', valor: 'ativo' },
      { codigo: 'FIN-02', campo: 'o_que_sobra', operador: '=', valor: 'irregular' },
      { codigo: 'COM-21', campo: 'equipa_comercial_count', operador: '>=', valor: 1 },
      { codigo: 'FIN-13', campo: 'faturamento_medio_3m', operador: '>', valor: 20000 },
      { codigo: 'LID-10', campo: 'equipa_total', operador: '>', valor: 1 },
    ],
  },

  // Modelo G — A Operação Não Aguenta Crescer (Pilares: P4→P6→P5)
  G: {
    obrigatorias: ['OPE-01', 'OPE-02', 'LID-01', 'LID-02', 'LID-04', 'LID-10'],
    condicionais: [
      { codigo: 'OPE-03', campo: 'tipo_negocio', operador: '=', valor: 'B2B' },
      { codigo: 'OPE-04', campo: 'tem_produto_fisico', operador: 'truthy', valor: null },
      { codigo: 'FIN-13', campo: 'faturamento_medio_3m', operador: '>', valor: 50000 },
      { codigo: 'OPE-08', campo: 'precificacao_intuitiva', operador: 'truthy', valor: null },
      { codigo: 'LID-19', campo: 'equipa_total', operador: '>=', valor: 2 },
      { codigo: 'LID-20', campo: 'equipa_total', operador: '>=', valor: 2 },
    ],
  },

  // Modelo H — Sem Você, Nada Anda (Pilares: P1→P4→P6)
  H: {
    obrigatorias: ['LID-01', 'LID-02', 'LID-03', 'LID-04', 'OPE-01', 'LID-10'],
    condicionais: [
      { codigo: 'LID-05', campo: 'equipa_comercial_count', operador: '>=', valor: 1 },
      { codigo: 'FIN-07', campo: 'faturamento_medio_3m', operador: '>', valor: 20000 },
      { codigo: 'COM-10', campo: 'equipa_total', operador: '>=', valor: 1 },
      { codigo: 'COM-21', campo: 'equipa_comercial_count', operador: '>=', valor: 1 },
      { codigo: 'LID-18', campo: 'horas_trabalhadas_semana', operador: '>', valor: 50 },
      { codigo: 'LID-13', campo: 'dono_presta_servico', operador: 'truthy', valor: null },
      { codigo: 'COM-27', campo: 'clientes_recorrentes', operador: '>=', valor: 5 },
      { codigo: 'FIN-16', campo: 'dividas_curto_prazo', operador: '>', valor: 0 },
    ],
  },

  // Modelo B — Base Sólida, Faturamento Estagnado (Pilares: P6→P2→P4)
  B: {
    obrigatorias: ['COM-04', 'COM-07', 'COM-08', 'COM-09', 'COM-10'],
    condicionais: [
      // POS-02/POS-03 se audiencia>0
      { codigo: 'POS-02', campo: 'audiencia_digital_status', operador: '=', valor: 'iniciante' },
      { codigo: 'POS-02', campo: 'audiencia_digital_status', operador: '=', valor: 'ativo' },
      { codigo: 'POS-03', campo: 'audiencia_digital_status', operador: '=', valor: 'ativo' },
      { codigo: 'FIN-09', campo: 'ticket_calibravel', operador: 'truthy', valor: null },
      { codigo: 'COM-21', campo: 'equipa_comercial_count', operador: '>=', valor: 1 },
      { codigo: 'FIN-13', campo: 'faturamento_medio_3m', operador: '>', valor: 20000 },
      { codigo: 'LID-10', campo: 'equipa_total', operador: '>', valor: 2 },
      { codigo: 'COM-26', campo: 'sazonalidade_flag', operador: '=', valor: true },
      { codigo: 'COM-27', campo: 'clientes_recorrentes', operador: '>=', valor: 5 },
      { codigo: 'COM-29', campo: 'sem_contrato', operador: 'truthy', valor: null },
    ],
  },

  // Modelo X — Pronto para Escalar (Pilares: P4→P6→P7)
  X: {
    obrigatorias: ['OPE-01', 'OPE-02', 'LID-01', 'LID-10', 'COM-08', 'COM-10'],
    condicionais: [
      { codigo: 'FIN-13', campo: 'faturamento_medio_3m', operador: '>', valor: 20000 },
      { codigo: 'COM-21', campo: 'equipa_comercial_count', operador: '>=', valor: 1 },
      { codigo: 'LID-04', campo: 'horas_trabalhadas_semana', operador: '>', valor: 40 },
      { codigo: 'OPE-04', campo: 'tem_produto_fisico', operador: 'truthy', valor: null },
      { codigo: 'POS-04', campo: 'audiencia_digital_status', operador: '=', valor: 'ativo' },
      { codigo: 'LID-18', campo: 'horas_trabalhadas_semana', operador: '>', valor: 40 },
      { codigo: 'LID-19', campo: 'equipa_total', operador: '>=', valor: 2 },
      { codigo: 'LID-20', campo: 'equipa_total', operador: '>=', valor: 2 },
    ],
  },

  // Modelo A — Negócio Sem Rumo — Várias Frentes Abertas (Pilares: P5→P3→P4)
  A: {
    obrigatorias: ['FIN-01', 'FIN-02', 'FIN-05', 'COM-01', 'COM-02'],
    condicionais: [
      { codigo: 'FIN-06', campo: 'equipa_total', operador: '>', valor: 1 },
      { codigo: 'POS-01', campo: 'canal_aquisicao', operador: '=', valor: 'conteudo' },
      { codigo: 'COM-03', campo: 'equipa_total', operador: '>', valor: 1 },
      { codigo: 'OPE-01', campo: 'equipa_total', operador: '>', valor: 1 },
      { codigo: 'LID-01', campo: 'equipa_total', operador: '>', valor: 1 },
      { codigo: 'FIN-12', campo: 'o_que_sobra', operador: '=', valor: 'nada' },
      { codigo: 'FIN-14', campo: 'sem_dre_flag', operador: '=', valor: true },
      { codigo: 'OPE-08', campo: 'precificacao_intuitiva', operador: 'truthy', valor: null },
      { codigo: 'LID-10', campo: 'braco_direito_identificado', operador: 'truthy', valor: null },
    ],
  },
};

// ── Per-model metaphors (by primary pillar challenge) ────────────────────────
// Format: "MET-XX — [Título]: [Conceito resumido para orientar o AI]"
export const METAFORAS_POR_MODELO: Record<string, string[]> = {
  // Modelo D — Fatura, mas não sobra (foco: clareza financeira)
  D: [
    'MET-14 — Contabilidade ≠ Financeiro: Contador é o mecânico da lei — cuida do obrigatório fiscal. Financeiro é o piloto do negócio — cuida da rota e do combustível. Confundir os dois é viver no legal mas morrer no caixa.',
    'MET-21 — O Espelho Financeiro: DRE e fluxo de caixa são espelhos — mostram o que realmente é, não o que o dono imagina. Empresário sem espelho financeiro toma decisões baseado em percepção distorcida.',
    'MET-31 — Cockpit de Aeronave: Dashboard financeiro é o cockpit do avião — não pilota sem ver os instrumentos. Altímetro (caixa), combustível (margem), velocidade (faturamento), rota (metas).',
    'MET-42 — O Balde Furado: Dobrar a renda sem gestão = balde furado: corres mais rápido mas perdes mais. O problema nunca foi falta de dinheiro — foi falta de governo.',
    'MET-18 — A Pasta de Boleto: Empresa gerida por pasta de boleto (paga o que chegou) em vez de calendário de pagamentos planejado — vive em modo reativo. Sintoma de falta de controle financeiro.',
  ],

  // Modelo E — Pré-receita / Início (foco: clareza de MVP e validação)
  E: [
    'MET-5 — A Fundação da Casa: Não se constrói segundo andar sem fundação sólida. Crescimento sobre base frágil colapsa. Antes de qualquer ação comercial: validar o MVP com dados reais.',
    'MET-3 — O Agricultor e as Estações: Há tempo de plantar, de cultivar e de colher. Empresários que querem colher sem plantar criam resultados inconsistentes. Respeitar as estações do negócio.',
    'MET-10 — O Foguete e a Estratosfera: Alguns negócios precisam de um investimento concentrado para ultrapassar o momento de tração. Abaixo desse nível, o foguete não sai do chão.',
    'MET-35 — O Garoto de 18 Anos com ChatGPT: A ameaça competitiva não vem de quem tem produto melhor — vem de quem se posiciona melhor. Fundadores técnicos confiam demais na qualidade e subestimam a urgência do posicionamento.',
    'MET-4 — O Ginásio: Resultados vêm da consistência, não da intensidade de um único dia. Rotina semanal simples bate planejamento elaborado que não é executado.',
  ],

  // Modelo C — Gap de Preço (foco: precificação e posicionamento de valor)
  C: [
    'MET-32 — Produto Embrulhado com Jornal: Produto excelente dentro de embalagem horrível não vende. O posicionamento e a comunicação são a embalagem. Se a embalagem não comunica o valor, o cliente não enxerga o produto.',
    'MET-28 — Anabolizante no Negócio: Tráfego pago e marketing amplificam o que já existe. Se o produto é ruim, o processo é falho ou a oferta é confusa, o anabolizante amplifica o problema, não a solução.',
    'MET-6 — A Tomografia do Negócio: O diagnóstico revela o que está dentro, não só o que aparece fora. O empresário pode parecer bem por fora e ter hemorragia interna (preço abaixo do custo real).',
    'MET-30 — Loja no Shopping com Luz Apagada: Ter produto bom mas marketing invisível é como ter loja no shopping com as luzes apagadas: o fluxo está lá, mas ninguém entra.',
    'MET-21 — O Espelho Financeiro: DRE e ficha técnica mostram o que realmente é. Sem espelho de custos, o empresário precifica pela percepção — e a percepção sempre subestima o custo real.',
  ],

  // Modelo F — Dependência de Canal (foco: diversificação comercial)
  F: [
    'MET-33 — Esteira de Venda: Processo de venda bem calibrado é como esteira industrial — entrada de leads de um lado, saída de clientes do outro, com etapas definidas. Sem esteira, cada venda é artesanal e não escala.',
    'MET-9 — Cenoura à Frente: O vendedor precisa ver a recompensa à frente, não atrás. Bônus mensal > bônus trimestral porque mantém o animal em movimento.',
    'MET-8 — O Corredor Territorial: Expansão mais segura é pelo corredor adjacente — região próxima onde já há domínio. Pular regiões é desperdiçar energia em território sem ancoragem.',
    'MET-17 — O Eletricista como Cliente Real: Em distribuição indireta, o intermediário é o verdadeiro cliente — ele indica a marca ao dono final. Estratégia que ignora o intermediário perde a batalha antes de começar.',
    'MET-1 — O Carro e a Gasolina: O negócio é o carro, o tráfego e marketing são a gasolina. Colocar gasolina num carro quebrado não adianta. Antes de investir em captação, garantir que a operação aguenta o volume.',
  ],

  // Modelo G — Dependência Operacional (foco: delegação e processos)
  G: [
    'MET-26 — O Maestro da Orquestra: O dono não toca todos os instrumentos — ele rege. Reger significa ter visão do todo, tempo certo para cada seção, e confiança em que cada músico faz o seu trabalho.',
    'MET-36 — O Martelinho de Ouro: João Bertoncini foi a Portugal com R$30k e construiu 8 oficinas em 4 países. O que o fez expandir não foi talento técnico — foi o método documentado e pessoas treinadas para replicar.',
    'MET-58 — Não Criar um Messias Júnior: O risco de substituir o fundador centralizador por um gestor igualmente centralizador. A solução não é clonar a personalidade do dono — é criar um playbook que qualquer pessoa competente consiga operar.',
    'MET-22 — O Super-Homem: Dono que acredita conseguir fazer tudo sozinho. O negócio cresce até o limite dos dois braços do dono e para. Delegar não é fraqueza — é multiplicação.',
    'MET-24 — A Empresa no Braço do Dono: Empresa que só funciona quando o dono está presente é uma extensão do braço. "Você tem um emprego com CNPJ."',
  ],

  // Modelo H — Centralização (foco: delegação de liderança)
  H: [
    'MET-22 — O Super-Homem: Dono que acredita conseguir fazer tudo sozinho. O negócio cresce até o limite dos dois braços do dono e para.',
    'MET-26 — O Maestro da Orquestra: Transição do dono operacional para dono estratégico. O maestro não toca todos os instrumentos — ele rege. Cria visão do todo e confiança na execução da equipe.',
    'MET-24 — A Empresa no Braço do Dono: Empresa que só funciona quando o dono está presente não é empresa — é extensão do braço. "Se eu faltar, para tudo" não é diferencial, é fragilidade estrutural.',
    'MET-36 — O Martelinho de Ouro: O caminho da expansão é método, não talento. Criar o padrão, criar pessoas para replicar o padrão e avançar.',
    'MET-34 — O Jogador Sozinho: Empresário que joga sozinho pode ser o melhor da região — mas nunca vai ganhar campeonato. Visão é do dono, mas execução precisa de mais dois braços.',
  ],

  // Modelo B — Platô (foco: destravar crescimento estagnado)
  B: [
    'MET-37 — O Motor Parado: Estagnação com estrutura pronta é como ter um motor parado — tudo montado, mas sem movimento. Para negócios que TÊM estrutura, TÊM produto, TÊM equipe — mas não estão em movimento.',
    'MET-27 — O Limite da Mesa: Mesa só aguenta o peso para o qual foi projetada. Negócio sem estrutura financeira e operacional tem um limite de carga — adicionar faturamento sem estrutura é colocar peso em mesa fraca.',
    'MET-28 — Anabolizante no Negócio: Tráfego pago amplifica o que já existe. Se o processo é falho, o anabolizante amplifica o problema. Garantir que o "carro" está pronto antes de colocar gasolina.',
    'MET-33 — Esteira de Venda: Processo de venda bem calibrado é como esteira industrial — escala sem depender do talento individual.',
    'MET-9 — Cenoura à Frente: O vendedor precisa ver a recompensa à frente. Bônus mensal mantém o time em movimento e a urgência ativa.',
  ],

  // Modelo X — Alta Performance / Alavancas (foco: próximo nível sustentável)
  X: [
    'MET-16 — O Ecossistema do Negócio: Negócios adjacentes que se alimentam mutuamente criam mais valor do que negócios isolados. Expansão natural sem abandonar o core.',
    'MET-27 — O Limite da Mesa: Adicionar faturamento sem estrutura é colocar peso em mesa fraca. O próximo nível exige mesa mais forte — não mais peso na mesma mesa.',
    'MET-41 — A Ponte (Generosidade como Posicionamento): Pontes não competem — conectam. Quem conecta, lidera. Generosidade estratégica reposiciona sem investimento adicional.',
    'MET-8 — O Corredor Territorial: Expansão mais segura é pelo corredor adjacente — onde já há domínio logístico e de relacionamento.',
    'MET-7 — A Corrida de Maratona: Negócio sustentável exige ritmo, não sprint. Crescimento rápido sem ritmo leva ao burnout do dono e ao colapso operacional.',
  ],

  // Modelo A — Caos / Múltiplos Desafios (foco: ordem e priorização)
  A: [
    'MET-6 — A Tomografia do Negócio: O diagnóstico revela o que está dentro. O empresário pode parecer bem por fora e ter hemorragia interna. Antes de qualquer ação: tomografia completa.',
    'MET-29 — Bandeira do Brasil — Ordem e Progresso: Primeiro a ordem (estrutura, processo, financeiro), depois o progresso (crescimento, expansão). Tentar o progresso sem ordem gera caos multiplicado.',
    'MET-5 — A Fundação da Casa: Crescimento sobre base frágil colapsa. Sem DRE, sem processo, sem produto validado — o segundo andar derruba o primeiro.',
    'MET-25 — As Duas Portas: Em toda decisão difícil há duas portas: a do conforto (manter o caos) e a do crescimento (mudar, desconfortar, avançar). Ambas são válidas, mas só uma leva ao próximo nível.',
    'MET-14 — Contabilidade ≠ Financeiro: Ter contador não é ter gestão financeira. O financeiro pilota o negócio — o contador cuida do fiscal. Sem gestor financeiro, o caos financeiro persiste.',
  ],
};
