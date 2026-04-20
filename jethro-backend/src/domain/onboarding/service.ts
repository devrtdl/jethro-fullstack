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

export function buildOnboardingJson(
  answers: Record<string, JsonValue>,
  diagnosticModel: string
): OnboardingJson {
  const equipe_desafio = str(answers['ob_equipe_desafio']);
  const concentracao_receita = str(answers['ob_concentracao_receita']);
  const dependencia_plataforma = str(answers['ob_dependencia_plataforma']);
  const sem_dre_raw = str(answers['o6a_sem_dre']);

  // sem_dre_flag: true se opção C (Não, nunca tive)
  const sem_dre_flag = sem_dre_raw === 'C';

  return {
    // Fase 1
    area_negocio: str(answers['o1_area_negocio']),
    tempo_negocio: str(answers['o1_tempo_negocio']),
    equipa: str(answers['o2_equipa']),
    ativos_fisicos: str(answers['o2_ativos_fisicos']),
    audiencia_digital: str(answers['o2_audiencia_digital']),
    meta_6_meses: str(answers['o3_meta_6_meses']),
    // Fase 3 universal
    o_que_sobra: str(answers['o4_o_que_sobra']),
    modelo_recebimento: str(answers['o4_modelo_recebimento']),
    separacao_pf_pj: str(answers['o5_separacao_pf_pj']),
    pro_labore: str(answers['o5_pro_labore']),
    custo_fixo_mensal: num(answers['o6_custo_fixo_mensal']),
    margem_estimada_pct: num(answers['o6_margem_estimada_pct']),
    sem_dre_flag,
    canal_principal: str(answers['o7_canal_principal']),
    clientes_ativos_total: num(answers['o7a_clientes_ativos_total']),
    clientes_recorrentes: num(answers['o7a_clientes_recorrentes']),
    ticket_medio: num(answers['o7b_ticket_medio']),
    conversao_de_10: num(answers['o8_conversao_de_10']),
    objeccao_principal: str(answers['o8a_objeccao_principal']),
    sazonalidade_meses_fortes: str(answers['o8b_sazonalidade_fortes']),
    sazonalidade_meses_fracos: str(answers['o8b_sazonalidade_fracos']),
    maior_problema_percebido: str(answers['o9_maior_problema']),
    ja_tentou: str(answers['o10_ja_tentou']),
    impacto_pessoal: str(answers['o11_impacto_pessoal']),
    // OB condicional
    equipe_desafio,
    concentracao_receita,
    razao_subpreco: str(answers['ob_razao_subpreco']),
    tem_socio: str(answers['ob_tem_socio']),
    inadimplencia_nivel: str(answers['ob_inadimplencia_nivel']),
    dependencia_plataforma,
    // Fase 4 adaptativa
    posicionamento_1_frase: str(answers['o24_posicionamento']),
    ticket_posicionamento_potencial: str(answers['o25_ticket_posicionamento_potencial']),
    script_venda: str(answers['o16_script_venda']),
    proposta_comercial: str(answers['o18_proposta_comercial']),
    followup_processo: str(answers['o19_followup_processo']),
    processos_dependentes_dono: str(answers['o20_processos_dependentes_dono']),
    ferias_impacto: str(answers['o21_ferias_impacto']),
    metas_equipa: str(answers['o22_metas_equipa']),
    dividas_curto_prazo: num(answers['o14_dividas_curto_prazo']),
    ofertas_atuais: str(answers['o23_ofertas_atuais']),
    equipa_comercial_count: num(answers['o22_equipa_comercial_count']),
    // Fase 6
    confirmacao_dados: str(answers['o23_confirmacao']),
    // Flags derivadas
    risco_concentracao: concentracao_receita === 'C',
    risco_plataforma: dependencia_plataforma === 'B' || dependencia_plataforma === 'C',
    precisa_primeiro_contrato:
      equipe_desafio === 'A' && ['G', 'H', 'B'].includes(diagnosticModel),
  };
}
