type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type OnboardingJson = {
  // IDENTIDADE
  area_negocio: string | null;
  tempo_negocio: string | null;
  regime_dedicacao: string | null;
  // EQUIPE E ATIVOS
  equipa_total: number | null;
  equipa_comercial_count: number | null;
  equipa_detalhada: Array<{ nome: string; funcao: string }> | null;
  ativo_fisico: string | null;
  audiencia_digital_status: string | null;
  audiencia_tamanho: string | null;
  // META E PERCEPÇÃO
  meta_6_meses: string | null;
  maior_problema_percebido: string | null;
  impacto_pessoal: string | null;
  ja_tentou: string | null;
  nota_adicional: string | null;
  // FINANCEIRO
  faturamento_medio_3m: number | null;
  o_que_sobra: string | null;
  modelo_recebimento: string | null;
  custo_fixo_mensal: number | null;
  margem_estimada_pct: number | null;
  separacao_pf_pj: string | null;
  pro_labore: string | null;
  sem_dre_flag: boolean;
  dividas_curto_prazo: number | null;
  margem_oferta_principal: string | null;
  // COMERCIAL
  canal_principal: string | null;
  ticket_medio: number | null;
  clientes_ativos_total: number | null;
  clientes_recorrentes: number | null;
  conversao_de_10: number | null;
  objeccao_principal: string | null;
  sazonalidade_flag: string | null;
  sazonalidade_meses_fortes: string | null;
  sazonalidade_meses_fracos: string | null;
  // OFERTA
  tipo_oferta_principal: string | null;
  receita_recorrente: string | null;
  ofertas_atuais: string | null;
  // CONTEXTO EXPANDIDO (OB)
  equipe_desafio: string | null;
  concentracao_receita: string | null;
  razao_subpreco: string | null;
  tem_socio: string | null;
  inadimplencia_nivel: string | null;
  dependencia_plataforma: string | null;
  // ADAPTATIVO C/D
  precificacao_intuitiva: string | null;
  dividas_fornecedores: string | null;
  clareza_custos: string | null;
  // ADAPTATIVO A/B
  clareza_posicionamento: string | null;
  numero_ofertas: string | null;
  oferta_principal: string | null;
  // ADAPTATIVO G
  dependencia_dono_pct: string | null;
  processos_documentados: string | null;
  teste_ferias: string | null;
  // ADAPTATIVO H
  clareza_metas_equipe: string | null;
  decisoes_centralizadas: string | null;
  // ADAPTATIVO E/F
  posicionamento_1_frase: string | null;
  gap_ticket: string | null;
  // ADAPTATIVO X
  capacidade_investimento: string | null;
  barreira_escala: string | null;
  experiencia_mentoria: string | null;
  // FLAGS DERIVADAS
  risco_concentracao: boolean;
  risco_plataforma: boolean;
  precisa_primeiro_contrato: boolean;
  pre_receita: boolean;
  // CAMPOS LEGADOS (compatibilidade com plano/IA)
  equipa: string | null;
  ativos_fisicos: string | null;
  audiencia_digital: string | null;
  o12_mix_margem: string | null;
  o13_recebimento_cd: string | null;
  ticket_posicionamento_potencial: string | null;
  script_venda: string | null;
  proposta_comercial: string | null;
  followup_processo: string | null;
  processos_dependentes_dono: string | null;
  ferias_impacto: string | null;
  metas_equipa: string | null;
  confirmacao_dados: string | null;
};

function str(v: JsonValue | undefined): string | null {
  if (v == null || v === '') return null;
  return String(v);
}

function num(v: JsonValue | undefined): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// Midpoints para faturamento (O4)
const FAT_MIDPOINTS: Record<string, number | null> = {
  A: 3500, B: 7500, C: 15000, D: 35000, E: 75000, F: 125000, G: null,
};

// Midpoints para custo fixo (O6)
const CUSTO_MIDPOINTS: Record<string, number | null> = {
  A: 2000, B: 5500, C: 11500, D: 22500, E: 45000, F: 75000, G: null,
};

// Midpoints para ticket médio (O7B)
const TICKET_MIDPOINTS: Record<string, number | null> = {
  A: 50, B: 300, C: 1000, D: 3250, E: 7500, F: null,
};

// Midpoints para clientes ativos (O7A)
const CLIENTES_ATIVOS_MAP: Record<string, number | null> = {
  A: 3, B: 10, C: 23, D: 40, E: 75, F: null,
};

// Midpoints para clientes recorrentes (O7A2)
const CLIENTES_REC_MAP: Record<string, number | null> = {
  A: 0, B: 3, C: 10, D: 20, E: null,
};

// Conversão de 10 (O8)
const CONVERSAO_MAP: Record<string, number | null> = {
  A: 1.5, B: 3.5, C: 5.5, D: 8, E: null,
};

// Dívidas de curto prazo (O14)
const DIVIDAS_MAP: Record<string, number | null> = {
  A: 0, B: 2500, C: 12500, D: 25000, E: null,
};

// Canal principal: 5 opções app → valor motor (A/B/C)
const CANAL_MOTOR_MAP: Record<string, string> = {
  A: 'A', // rede social orgânica
  B: 'B', // indicação
  C: 'A', // rede social tráfego pago
  D: 'A', // Google Ads
  E: 'C', // vários canais
};

// Lê resposta range_with_optional: formato "A" ou "A|7000"
// Se valor opcional preenchido → usa esse; senão → midpoint da faixa
function resolveRange(
  raw: string | null | undefined,
  midpoints: Record<string, number | null>
): number | null {
  if (!raw) return null;
  const [rangeCode, optVal] = raw.split('|');
  if (optVal?.trim()) {
    const n = parseFloat(optVal.trim().replace(/[^\d.]/g, ''));
    if (!isNaN(n) && n > 0) return n;
  }
  return midpoints[rangeCode ?? ''] ?? null;
}

export function buildOnboardingJson(
  answers: Record<string, JsonValue>,
  diagnosticModel: string,
  revenueLevel?: string | null
): OnboardingJson {
  // Lê valores chave
  const equipa_total_raw = str(answers['onb_o2_equipa_total']);
  const equipa_total_num = equipa_total_raw ? (num(equipa_total_raw) ?? 1) : 1;

  const equipa_comercial_raw = str(answers['onb_o2a_equipa_comercial']);
  const equipa_comercial_num = equipa_comercial_raw ? (num(equipa_comercial_raw) ?? 0) : 0;

  const equipa_detalhada_raw = str(answers['onb_o2b_equipa_detalhada']);
  let equipa_detalhada: Array<{ nome: string; funcao: string }> | null = null;
  if (equipa_detalhada_raw) {
    try {
      const parsed = JSON.parse(equipa_detalhada_raw) as unknown;
      if (Array.isArray(parsed)) {
        equipa_detalhada = (parsed as Array<{ nome?: string; funcao?: string }>)
          .filter((p) => p.funcao)
          .map((p) => ({ nome: p.nome ?? '', funcao: p.funcao! }));
        if (equipa_detalhada.length === 0) equipa_detalhada = null;
      }
    } catch {
      equipa_detalhada = null;
    }
  }

  const sem_dre_raw = str(answers['onb_o6a_dre']);
  // C=só contador, D=nenhum controle → sem_dre_flag=true
  const sem_dre_flag = sem_dre_raw === 'C' || sem_dre_raw === 'D';

  const canal_raw = str(answers['onb_o7_canal']);
  const canal_motor = canal_raw ? (CANAL_MOTOR_MAP[canal_raw] ?? canal_raw) : null;

  const concentracao_receita = str(answers['onb_ob10_concentracao']);
  const dependencia_plataforma = str(answers['onb_ob14_plataforma']);
  const equipe_desafio = str(answers['onb_ob09_equipe']);

  const faturamento = resolveRange(str(answers['onb_o4_faturamento']), FAT_MIDPOINTS);
  const custo_fixo = resolveRange(str(answers['onb_o6_custos']), CUSTO_MIDPOINTS);
  const ticket = resolveRange(str(answers['onb_o7b_ticket']), TICKET_MIDPOINTS);
  const clientes_ativos = (() => {
    const raw = str(answers['onb_o7a_clientes']);
    return raw ? (CLIENTES_ATIVOS_MAP[raw] ?? null) : null;
  })();
  const clientes_rec = (() => {
    const raw = str(answers['onb_o7a2_recorrentes']);
    return raw ? (CLIENTES_REC_MAP[raw] ?? null) : null;
  })();
  const conversao = (() => {
    const raw = str(answers['onb_o8_conversao']);
    return raw ? (CONVERSAO_MAP[raw] ?? null) : null;
  })();
  const dividas = (() => {
    const raw = str(answers['onb_o14_dividas']);
    return raw ? (DIVIDAS_MAP[raw] ?? null) : null;
  })();

  // Labels legíveis para campos que o plano usa como texto
  const meta_labels: Record<string, string> = {
    A: 'Manter o atual', B: 'R$10 mil', C: 'R$20 mil',
    D: 'R$50 mil', E: 'R$100 mil', F: 'Acima de R$100 mil',
  };
  const problema_labels: Record<string, string> = {
    A: 'Vender mais', B: 'Cobrar melhor', C: 'Organizar finanças',
    D: 'Montar equipe', E: 'Ter mais tempo', F: 'Ter mais clareza de direção',
  };
  const impacto_labels: Record<string, string> = {
    A: 'Mais tempo com a família', B: 'Liberdade financeira',
    C: 'Menos pressão e ansiedade', D: 'Investir no que acredito (ministério)',
    E: 'Parar de trabalhar tanto', F: 'Outro',
  };
  const sobra_labels: Record<string, string> = {
    A: 'Nada ou quase nada', B: 'Sobra pouco',
    C: 'Sobra razoável', D: 'Sobra bem', E: 'Não controlo',
  };
  const receb_labels: Record<string, string> = {
    A: 'À vista', B: 'Transferência bancária', C: 'Cartão à vista',
    D: 'Parcelado', E: 'Boleto com prazo', F: 'Misto',
  };
  const sep_labels: Record<string, string> = {
    A: 'Sim, totalmente', B: 'Parcialmente', C: 'Não, mesma conta',
  };
  const prolabore_labels: Record<string, string> = {
    A: 'Sim, valor fixo', B: 'Tiro o que sobra', C: 'Não tiro',
  };

  const objeccao_labels: Record<string, string> = {
    A: 'Está caro', B: 'Vou pensar (e some)', C: 'Já tem alguém que faz',
    D: 'Não entendeu o que ofereço', E: 'Não chega gente', F: 'Outro',
  };
  const ja_tentou_labels: Record<string, string> = {
    A: 'Contratou marketing/tráfego', B: 'Fez curso ou mentoria',
    C: 'Tentou reorganizar sozinho', D: 'Contratou funcionário',
    E: 'Nunca tentou', F: 'Outro',
  };

  const objeccao_raw = str(answers['onb_o8a_objeccao']);
  const ja_tentou_raw = str(answers['onb_o10_tentou']);
  const ja_tentou_label = ja_tentou_raw
    ? ja_tentou_raw.split(',').map((c) => ja_tentou_labels[c.trim()] ?? c).filter(Boolean).join(', ')
    : null;

  const meta_raw = str(answers['onb_o3_meta']);
  const problema_raw = str(answers['onb_o3a_problema']);
  const impacto_raw = str(answers['onb_o11_impacto']);
  const sobra_raw = str(answers['onb_o4a_sobra']);
  const receb_raw = str(answers['onb_o4b_recebimento']);
  const sep_raw = str(answers['onb_o5_separacao']);
  const prolabore_raw = str(answers['onb_o5a_prolabore']);

  // Margem estimada pct: se faturamento e custo ambos conhecidos, calcula %
  const margem_estimada_pct = faturamento && custo_fixo && faturamento > 0
    ? Math.round(((faturamento - custo_fixo) / faturamento) * 100)
    : null;

  // Flags derivadas
  const risco_concentracao = concentracao_receita === 'A'; // depende de poucos
  const risco_plataforma = dependencia_plataforma === 'A' || dependencia_plataforma === 'B';
  const precisa_primeiro_contrato =
    equipe_desafio === 'A' && ['G', 'H', 'B'].includes(diagnosticModel);
  const pre_receita = revenueLevel === 'A' || faturamento === 0;

  // Campos adaptativos (Fase 4)
  const clareza_posicionamento = str(answers['onb_o16_clareza_pos']);
  const numero_ofertas = str(answers['onb_o17_num_ofertas']);
  const oferta_principal = str(answers['onb_o18_oferta_principal']);
  const dependencia_dono_pct = str(answers['onb_o19_dependencia_dono']);
  const processos_documentados =
    str(answers['onb_o20_processos']) ?? str(answers['onb_o27_processos_x']);
  const teste_ferias = str(answers['onb_o21_ferias']);
  const clareza_metas_equipe = str(answers['onb_o22_metas_equipa']);
  const decisoes_centralizadas = str(answers['onb_o22a_decisoes']);
  const posicionamento_1_frase = str(answers['onb_o24_posicionamento']);
  const gap_ticket = str(answers['onb_o25_gap_ticket']);
  const capacidade_investimento = str(answers['onb_o26_capacidade_invest']);
  const barreira_escala = str(answers['onb_o28_barreira_escala']);
  const experiencia_mentoria = str(answers['onb_o29_mentoria']);

  return {
    // IDENTIDADE (área/tempo vêm do diagnóstico; onboarding não os coleta diretamente)
    area_negocio: null,
    tempo_negocio: null,
    regime_dedicacao: str(answers['onb_o1_dedicacao']),
    // EQUIPE E ATIVOS
    equipa_total: equipa_total_num,
    equipa_comercial_count: equipa_comercial_num,
    equipa_detalhada,
    ativo_fisico: str(answers['onb_o2c_ativo_fisico']),
    audiencia_digital_status: str(answers['onb_o7c_audiencia']),
    audiencia_tamanho: str(answers['onb_o7d_seguidores']),
    // META E PERCEPÇÃO
    meta_6_meses: meta_raw ? (meta_labels[meta_raw] ?? meta_raw) : null,
    maior_problema_percebido: problema_raw ? (problema_labels[problema_raw] ?? problema_raw) : null,
    impacto_pessoal: impacto_raw ? (impacto_labels[impacto_raw] ?? impacto_raw) : null,
    ja_tentou: ja_tentou_label,
    nota_adicional: str(answers['onb_o23c_nota']),
    // FINANCEIRO
    faturamento_medio_3m: faturamento,
    o_que_sobra: sobra_raw ? (sobra_labels[sobra_raw] ?? sobra_raw) : null,
    modelo_recebimento: receb_raw ? (receb_labels[receb_raw] ?? receb_raw) : null,
    custo_fixo_mensal: custo_fixo,
    margem_estimada_pct,
    separacao_pf_pj: sep_raw ? (sep_labels[sep_raw] ?? sep_raw) : null,
    pro_labore: prolabore_raw ? (prolabore_labels[prolabore_raw] ?? prolabore_raw) : null,
    sem_dre_flag,
    dividas_curto_prazo: dividas,
    margem_oferta_principal: str(answers['onb_o23b_margem']),
    // COMERCIAL
    canal_principal: canal_motor,
    ticket_medio: ticket,
    clientes_ativos_total: clientes_ativos,
    clientes_recorrentes: clientes_rec,
    conversao_de_10: conversao,
    objeccao_principal: objeccao_raw ? (objeccao_labels[objeccao_raw] ?? objeccao_raw) : null,
    sazonalidade_flag: str(answers['onb_o8b_sazonalidade']),
    sazonalidade_meses_fortes: null,
    sazonalidade_meses_fracos: null,
    // OFERTA
    tipo_oferta_principal: str(answers['onb_o23_tipo_oferta']),
    receita_recorrente: str(answers['onb_o23a_recorrencia']),
    ofertas_atuais: str(answers['onb_o23_tipo_oferta']),
    // CONTEXTO EXPANDIDO (OB)
    equipe_desafio,
    concentracao_receita,
    razao_subpreco: str(answers['onb_ob11_subpreco']),
    tem_socio: str(answers['onb_ob12_socio']),
    inadimplencia_nivel: str(answers['onb_ob13_inadimplencia']),
    dependencia_plataforma,
    // ADAPTATIVO C/D
    precificacao_intuitiva: str(answers['onb_o12_precificacao']),
    dividas_fornecedores: str(answers['onb_o13_dividas_forn']),
    clareza_custos: str(answers['onb_o15_clareza_custos']),
    // ADAPTATIVO A/B
    clareza_posicionamento,
    numero_ofertas,
    oferta_principal,
    // ADAPTATIVO G
    dependencia_dono_pct,
    processos_documentados,
    teste_ferias,
    // ADAPTATIVO H
    clareza_metas_equipe,
    decisoes_centralizadas,
    // ADAPTATIVO E/F
    posicionamento_1_frase,
    gap_ticket,
    // ADAPTATIVO X
    capacidade_investimento,
    barreira_escala,
    experiencia_mentoria,
    // FLAGS DERIVADAS
    risco_concentracao,
    risco_plataforma,
    precisa_primeiro_contrato,
    pre_receita,
    // CAMPOS LEGADOS (aliases para compatibilidade com plano/IA existente)
    equipa: equipa_total_num ? String(equipa_total_num) : null,
    ativos_fisicos: str(answers['onb_o2c_ativo_fisico']),
    audiencia_digital: str(answers['onb_o7c_audiencia']),
    o12_mix_margem: str(answers['onb_o12_precificacao']),
    o13_recebimento_cd: str(answers['onb_o13_dividas_forn']),
    ticket_posicionamento_potencial: gap_ticket,
    script_venda: clareza_posicionamento,
    proposta_comercial: numero_ofertas,
    followup_processo: oferta_principal,
    processos_dependentes_dono: dependencia_dono_pct,
    ferias_impacto: teste_ferias,
    metas_equipa: clareza_metas_equipe,
    confirmacao_dados: str(answers['onb_o23_tipo_oferta']),
  };
}
