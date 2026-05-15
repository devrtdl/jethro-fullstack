export type TipoMaterial = 'video' | 'template' | 'calc' | 'script' | 'guia';

export type Material = {
  id: string;
  tipo: TipoMaterial;
  emoji: string;
  codigo: string;
  nome: string;
  desc: string;
  acao: string;
  url: string;
  modelos: string[];
  lido?: boolean;
};

export const gdl = (id: string) =>
  `https://drive.google.com/uc?export=download&id=${id}`;

export const TYPE_COLORS: Record<TipoMaterial, { bg: string; text: string }> = {
  video:    { bg: '#E8F0FE', text: '#1A56DB' },
  template: { bg: 'rgba(201,166,85,0.18)', text: '#7A5C10' },
  calc:     { bg: '#E8FAF0', text: '#1A6B3A' },
  script:   { bg: '#FEF3E8', text: '#B45309' },
  guia:     { bg: 'rgba(11,28,53,0.07)', text: '#0B1A3B' },
};

export const TIPO_LABELS: Record<TipoMaterial, string> = {
  video: 'Vídeo', template: 'Template', calc: 'Calculadora', script: 'Script', guia: 'Guia',
};

export const MODEL_PILAR_FOCO: Record<string, string> = {
  A: 'P1', B: 'P3', C: 'P2', D: 'P5',
  E: 'P2', F: 'P6', G: 'P4', H: 'P4', X: 'P6',
};

export const MODEL_RECURSO_SEMANA: Record<string, string> = {
  H: 'T-H1', G: 'T-H1', X: 'T-X1', B: 'T-X1',
  D: 'T-D1', C: 'T-C2', A: 'T11',  E: 'T11', F: 'T11',
};

export const CATALOGO: Material[] = [
  // Guias PBN
  { id: 'G01', tipo: 'guia', emoji: '📖', codigo: 'G01', nome: 'Liderança Eficaz',                     desc: 'Os 5 Níveis de Maxwell para PMEs',              acao: 'Acessar PDF', url: gdl('1vKPgSjXTR7M1UInman979UmekULyFz1g'), modelos: ['H','G','A'] },
  { id: 'G02', tipo: 'guia', emoji: '📖', codigo: 'G02', nome: 'Finanças para PME',                     desc: 'Clareza financeira e indicadores essenciais',   acao: 'Acessar PDF', url: gdl('19dAsQWKvbiSmPRC2FRwnry2snz9bwost'), modelos: ['D','C','E'] },
  { id: 'G03', tipo: 'guia', emoji: '📖', codigo: 'G03', nome: 'Proposta de Valor e Precificação',      desc: 'Como posicionar e cobrar pelo que você entrega', acao: 'Acessar PDF', url: gdl('1qNAXtu9Yn9MRP2Xvw3_ZrVvxO3lnidzW'), modelos: ['C','E','F'] },
  { id: 'G04', tipo: 'guia', emoji: '📖', codigo: 'G04', nome: 'Gestão do Tempo',                       desc: 'Produtividade e prioridades para o empreendedor',acao: 'Acessar PDF', url: gdl('1CN9tfyioZy1c9_8Z-3r76akxYzoS4Vmt'), modelos: ['A','H','G'] },
  { id: 'G05', tipo: 'guia', emoji: '📖', codigo: 'G05', nome: 'Do Operacional ao Estratégico',         desc: 'Sair do operacional e assumir o papel de líder', acao: 'Acessar PDF', url: gdl('16jx-6Du3JS9z8izHoWEiYQU-3eJnPJN8'), modelos: ['G','H','X'] },
  { id: 'G06', tipo: 'guia', emoji: '📖', codigo: 'G06', nome: 'Seleção por Competências',              desc: 'Contratar as pessoas certas para o time certo',  acao: 'Acessar PDF', url: gdl('1VbVDRHsUS_wkzMg1KhJMAQdbQMUBjmXF'), modelos: ['G','H','X'] },
  { id: 'G07', tipo: 'guia', emoji: '📖', codigo: 'G07', nome: 'Funil de Vendas para PME',              desc: 'Estruture seu processo comercial do zero',       acao: 'Acessar PDF', url: gdl('1-2ginhgNtG3TdGLMMly7wCQsNv1vjcGr'), modelos: ['F','E','D','B'] },
  { id: 'G08', tipo: 'guia', emoji: '📖', codigo: 'G08', nome: 'Processos e SOPs',                      desc: 'Documente e automatize como um negócio profissional', acao: 'Acessar PDF', url: gdl('15n7ysI_-PKRcSoIQMNPhc1N8-Cmb50gF'), modelos: ['G','H','X','B'] },
  { id: 'G09', tipo: 'guia', emoji: '📖', codigo: 'G09', nome: 'Planejamento Estratégico para PME',     desc: 'Defina metas e execute com método',              acao: 'Acessar PDF', url: gdl('1a_gOPbbCYAIV63Z8t6q3px82l-qAPL1h'), modelos: ['A','B','X'] },
  { id: 'G10', tipo: 'guia', emoji: '📖', codigo: 'G10', nome: 'Hábitos Atômicos',                      desc: 'Pequenas mudanças que geram resultados reais',   acao: 'Acessar PDF', url: gdl('1lFsS8dq4bF6XG3V9wWIBuYnS2da_GhHE'), modelos: ['universal'] },
  { id: 'G11', tipo: 'guia', emoji: '📖', codigo: 'G11', nome: 'StoryBrand — Comunicação que Converte', desc: 'Clareza na mensagem que atrai e vende',          acao: 'Acessar PDF', url: gdl('1hADmmh3Mp1SO4sz4Nmo6JL8lCTUepKkY'), modelos: ['F','E','C','B'] },
  { id: 'G12', tipo: 'guia', emoji: '📖', codigo: 'G12', nome: 'Profit First — Lucro como Prioridade',  desc: 'Método para tornar seu negócio lucrativo agora',acao: 'Acessar PDF', url: gdl('1dcG2wY2thSieTtoEGIBA5Dg9HpkXKFRW'), modelos: ['D','C','F','X'] },
  { id: 'G13', tipo: 'guia', emoji: '📖', codigo: 'G13', nome: 'Traction — Sistema EOS',                desc: 'Gestão empresarial com clareza e tração',        acao: 'Acessar PDF', url: gdl('14UHNSPtFurXQLXl1wna3A5y6krEHanSp'), modelos: ['B','X','G'] },
  { id: 'G14', tipo: 'guia', emoji: '📖', codigo: 'G14', nome: 'Start With Why — O Poder do Propósito', desc: 'Por que o propósito é o maior diferencial',      acao: 'Acessar PDF', url: gdl('14bVTiiuJyy-GAOVO_TjF_Jj297EErrhQ'), modelos: ['universal'] },
  { id: 'G15', tipo: 'guia', emoji: '📖', codigo: 'G15', nome: 'Validação e Primeira Venda',             desc: 'Prove sua ideia antes de investir',              acao: 'Acessar PDF', url: gdl('1KI_UWK7Yv8jZv-h4cCEpSKIE8x6nniKc'), modelos: ['E'] },
  { id: 'G16', tipo: 'guia', emoji: '📖', codigo: 'G16', nome: 'Cobrar o Que Vale',                      desc: 'Supere o medo de cobrar o preço justo',          acao: 'Acessar PDF', url: gdl('1-ZZ-VThtHYtCtUc0ZkzLeXHmx-DnVTYj'), modelos: ['C'] },
  { id: 'G17', tipo: 'guia', emoji: '📖', codigo: 'G17', nome: 'Recuperação Financeira',                 desc: 'Saia do vermelho com método e clareza',          acao: 'Acessar PDF', url: gdl('1s7PKGQXJW1BWvaN7GGhFv_r9hw2yuAoO'), modelos: ['D'] },
  { id: 'G18', tipo: 'guia', emoji: '📖', codigo: 'G18', nome: 'Marketing Digital para PME',             desc: 'Atraia clientes com consistência e estratégia',  acao: 'Acessar PDF', url: gdl('1skoTSl2KHvoCQLmt1SQTrEMiK2NcjjKs'), modelos: ['F','E','B'] },
  { id: 'G19', tipo: 'guia', emoji: '📖', codigo: 'G19', nome: 'Essencialismo — O Poder do Foco',        desc: 'Menos, mas melhor: a arte de eliminar o desnecessário', acao: 'Acessar PDF', url: gdl('1XUatL3NVPZQGBarsxFREajHRvkPDdKGN'), modelos: ['A'] },
  { id: 'G20', tipo: 'guia', emoji: '📖', codigo: 'G20', nome: 'Cultura de Time',                        desc: 'Construa uma equipe que carrega a visão',        acao: 'Acessar PDF', url: gdl('1AvQoG2PHFTrsFHW5-c-EXy6UwPERvk_0'), modelos: ['G','H','X'] },
  { id: 'G21', tipo: 'guia', emoji: '📖', codigo: 'G21', nome: 'O Segundo em Comando',                   desc: 'COO, 2IC e transição de autoridade operacional', acao: 'Acessar PDF', url: gdl('TODO_G21_DRIVE_ID'), modelos: ['H'] },
  { id: 'G22', tipo: 'guia', emoji: '📖', codigo: 'G22', nome: 'Retenção e Crescimento pela Base',       desc: 'Retenha clientes e reduza churn com método',     acao: 'Acessar PDF', url: gdl('TODO_G22_DRIVE_ID'), modelos: ['B','F','C'] },
  { id: 'G23', tipo: 'guia', emoji: '📖', codigo: 'G23', nome: 'Parcerias e Novos Canais de Crescimento',desc: 'Abra novos canais e parcerias estratégicas',     acao: 'Acessar PDF', url: gdl('TODO_G23_DRIVE_ID'), modelos: ['X','B'] },
  // Templates
  { id: 'T-H1', tipo: 'template', emoji: '📋', codigo: 'T-H1', nome: 'Matriz Só Eu Faço vs. Delegar', desc: 'Mapeie e decida o que delegar agora',        acao: 'Baixar', url: gdl('1PvuHwjZDNar2DSk38yfAMHYjdmZ7zXay'), modelos: ['H'] },
  { id: 'T-X1', tipo: 'template', emoji: '📋', codigo: 'T-X1', nome: 'Mapa de Escala',                 desc: 'Planeje os próximos passos de crescimento',  acao: 'Baixar', url: gdl('1NrrploHRzebxNxbuI3QhSjG_CzTpT2wD'), modelos: ['X','B'] },
  { id: 'T11',  tipo: 'template', emoji: '📋', codigo: 'T11',  nome: 'Planilha de Clientes Ativos',    desc: 'Rastreamento e gestão da carteira',           acao: 'Baixar', url: gdl('1IQoNreEFZw80OYhqw-tYd0nm8A4nB7Ww'), modelos: ['universal'] },
  // Calculadoras
  { id: 'T02',  tipo: 'calc', emoji: '🧮', codigo: 'T02',  nome: 'Planilha de Custos Fixos', desc: 'Com diagnóstico e semáforo automático',          acao: 'Baixar', url: gdl('1Rz0J4FWrqT0qWuylURwfO9sYHsY1V1XR'), modelos: ['universal'] },
  { id: 'T-C2', tipo: 'calc', emoji: '🧮', codigo: 'T-C2', nome: 'Quanto Vale Sua Hora',     desc: 'Calcule o valor real da sua hora de trabalho',   acao: 'Baixar', url: gdl('1OXCmIN1fUGLe5__uFfpWuQfYIoqVjxLi'), modelos: ['C'] },
  // Scripts
  { id: 'T-D1', tipo: 'script', emoji: '📝', codigo: 'T-D1', nome: 'Script de Renegociação com Fornecedores', desc: 'Roteiro pronto para renegociar dívidas',       acao: 'Baixar', url: gdl('1h6aIIvPOgnURnam0fpNCkK_l-I2pcRlO'), modelos: ['D'] },
  { id: 'T-D2', tipo: 'script', emoji: '📝', codigo: 'T-D2', nome: 'Régua de Cobranças',                      desc: 'Sequência de mensagens para cobrar clientes',  acao: 'Baixar', url: gdl('1yV29t3GFNVRNR1nDewg6aJxo4LxRjw9E'), modelos: ['D'] },
];
