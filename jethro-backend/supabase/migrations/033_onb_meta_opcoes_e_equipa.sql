-- migration 033: atualiza opções de onb_o3_meta (faturamento meta) e tipo de onb_o2b_equipa_detalhada

-- 1. Atualiza opções da pergunta de meta de faturamento
UPDATE diagnostic_questions
SET
  question_type = 'range_with_optional',
  helper_text   = 'Selecione a faixa. Você pode digitar um valor específico abaixo.',
  options = '[
    {"label": "Manter a faturação atual",  "value": "A"},
    {"label": "R$5 a 10 mil",              "value": "B"},
    {"label": "R$10 a 20 mil",             "value": "C"},
    {"label": "R$20 a 30 mil",             "value": "D"},
    {"label": "R$30 a 50 mil",             "value": "E"},
    {"label": "R$50 a 75 mil",             "value": "F"},
    {"label": "Acima de R$100 mil",        "value": "G"}
  ]'::jsonb
WHERE code = 'onb_o3_meta';

-- 2. Muda pergunta de equipa detalhada de team_slots para textarea
UPDATE diagnostic_questions
SET
  question_type = 'textarea',
  label         = 'Descreva as pessoas-chave da sua equipe',
  helper_text   = 'Escreva livremente: nome e função de cada pessoa (ex: João — Vendas, Maria — Financeiro).',
  options       = '[]'::jsonb,
  metadata      = metadata - 'maxSlots' || '{"form": "onboarding", "phase": "1", "fields": ["equipa_detalhada"], "conditional": true, "showIfAnswer": {"code": "onb_o2_equipa_total", "op": "neq", "value": "1"}}'::jsonb
WHERE code = 'onb_o2b_equipa_detalhada';
