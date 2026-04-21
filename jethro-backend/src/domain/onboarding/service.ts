type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type OnboardingJson = {
  // Fase 1
  area_negocio: string | null;
  tempo_negocio: string | null;
  equipa: string | null;
  ativos_fisicos: string | null;
  audiencia_digital: string | null;
  meta_6_meses: string | null;
  // Fase 3 universal
  o_que_sobra: string | null;
  modelo_recebimento: string | null;
  separacao_pf_pj: string | null;
  pro_labore: string | null;
  custo_fixo_mensal: number | null;
  margem_estimada_pct: number | null;
  sem_dre_flag: boolean;
  canal_principal: string | null;
  clientes_ativos_total: number | null;
  clientes_recorrentes: number | null;
  ticket_medio: number | null;
  conversao_de_10: number | null;
  objeccao_principal: string | null;
  sazonalidade_meses_fortes: string | null;
  sazonalidade_meses_fracos: string | null;
  maior_problema_percebido: string | null;
  ja_tentou: string | null;
  impacto_pessoal: string | null;
  // Fase 3 condicional OB-09 a OB-14
  equipe_desafio: string | null;
  concentracao_receita: string | null;
  razao_subpreco: string | null;
  tem_socio: string | null;
  inadimplencia_nivel: string | null;
  dependencia_plataforma: string | null;
  // Fase 4 adaptativa por modelo
  o12_mix_margem: string | null;       // C/D: mix de produtos/margem
  o13_recebimento_cd: string | null;   // C/D: detalhe de recebimento
  posicionamento_1_frase: string | null;
  ticket_posicionamento_potencial: string | null;
  script_venda: string | null;
  proposta_comercial: string | null;
  followup_processo: string | null;
  processos_dependentes_dono: string | null;
  ferias_impacto: string | null;
  metas_equipa: string | null;
  dividas_curto_prazo: number | null;
  ofertas_atuais: string | null;
  equipa_comercial_count: number | null;
  // Fase 6
  confirmacao_dados: string | null;
  // Flags derivadas
  risco_concentracao: boolean;
  risco_plataforma: boolean;
  precisa_primeiro_contrato: boolean;
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

// Nota: perguntas com múltiplos campos JSON (ex: O1, O2, O4) capturam uma
// resposta textarea livre. Os campos partilham o mesmo texto — o modelo Claude
// extrai os valores individuais ao gerar o plano.
export function buildOnboardingJson(
  answers: Record<string, JsonValue>,
  diagnosticModel: string
): OnboardingJson {
  const equipe_desafio = str(answers['onb_ob09_equipe']);
  const concentracao_receita = str(answers['onb_ob10_concentracao']);
  const dependencia_plataforma = str(answers['onb_ob14_plataforma']);
  const sem_dre_raw = str(answers['onb_o6a_dre']);

  // sem_dre_flag: true se opção C (Não, nunca tive)
  const sem_dre_flag = sem_dre_raw === 'C';

  return {
    // Fase 1 — textos livres; campos múltiplos partilham a mesma resposta textarea
    area_negocio: str(answers['onb_o1_contexto']),
    tempo_negocio: str(answers['onb_o1_contexto']),
    equipa: str(answers['onb_o2_equipa']),
    ativos_fisicos: str(answers['onb_o2_equipa']),
    audiencia_digital: str(answers['onb_o2_equipa']),
    meta_6_meses: str(answers['onb_o3_meta']),
    // Fase 3 universal
    o_que_sobra: str(answers['onb_o4_financeiro']),
    modelo_recebimento: str(answers['onb_o4_financeiro']),
    separacao_pf_pj: str(answers['onb_o5_pf_pj']),
    pro_labore: str(answers['onb_o5_pf_pj']),
    custo_fixo_mensal: num(answers['onb_o6_custos']),
    margem_estimada_pct: num(answers['onb_o6_custos']),
    sem_dre_flag,
    canal_principal: str(answers['onb_o7_canal']),
    clientes_ativos_total: num(answers['onb_o7a_clientes']),
    clientes_recorrentes: num(answers['onb_o7a_clientes']),
    ticket_medio: num(answers['onb_o7b_ticket']),
    conversao_de_10: num(answers['onb_o8_conversao']),
    objeccao_principal: str(answers['onb_o8a_objeccao']),
    sazonalidade_meses_fortes: str(answers['onb_o8b_sazonalidade']),
    sazonalidade_meses_fracos: str(answers['onb_o8b_sazonalidade']),
    maior_problema_percebido: str(answers['onb_o9_problema']),
    ja_tentou: str(answers['onb_o10_tentou']),
    impacto_pessoal: str(answers['onb_o11_impacto']),
    // OB condicional
    equipe_desafio,
    concentracao_receita,
    razao_subpreco: str(answers['onb_ob11_subpreco']),
    tem_socio: str(answers['onb_ob12_socio']),
    inadimplencia_nivel: str(answers['onb_ob13_inadimplencia']),
    dependencia_plataforma,
    // Fase 4 adaptativa
    o12_mix_margem: str(answers['onb_o12_margem']),
    o13_recebimento_cd: str(answers['onb_o13_recebimento']),
    posicionamento_1_frase: str(answers['onb_o24_posicionamento']),
    ticket_posicionamento_potencial: str(answers['onb_o25_ticket_potencial']),
    script_venda: str(answers['onb_o16_script_venda']),
    proposta_comercial: str(answers['onb_o18_proposta']),
    followup_processo: str(answers['onb_o19_followup']),
    processos_dependentes_dono: str(answers['onb_o20_processos']),
    ferias_impacto: str(answers['onb_o21_ferias']),
    metas_equipa: str(answers['onb_o22_metas_equipa']),
    dividas_curto_prazo: num(answers['onb_o14_dividas']),
    ofertas_atuais: str(answers['onb_o23_confirmacao']),
    equipa_comercial_count: num(answers['onb_o22_metas_equipa']),
    // Fase 6
    confirmacao_dados: str(answers['onb_o23_confirmacao']),
    // Flags derivadas
    risco_concentracao: concentracao_receita === 'C',
    risco_plataforma: dependencia_plataforma === 'B' || dependencia_plataforma === 'C',
    precisa_primeiro_contrato:
      equipe_desafio === 'A' && ['G', 'H', 'B'].includes(diagnosticModel),
  };
}
