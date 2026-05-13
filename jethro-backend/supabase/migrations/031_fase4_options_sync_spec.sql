-- Sincroniza opções da Fase 4 com a spec oficial (Jethro_Fase4_Gates_Daniel.pdf)

-- O12: opção 1
UPDATE diagnostic_questions
SET options = '[
  {"label": "Sim, tenho claro", "value": "A"},
  {"label": "Mais ou menos", "value": "B"},
  {"label": "Não, nunca calculei", "value": "C"}
]'::jsonb
WHERE code = 'onb_o12_precificacao';

-- O16: opção 3 "Mudo toda vez" → "Não consigo", opção 1 ajustada
UPDATE diagnostic_questions
SET options = '[
  {"label": "Sim, tenho claro", "value": "A"},
  {"label": "Mais ou menos", "value": "B"},
  {"label": "Não consigo", "value": "C"}
]'::jsonb
WHERE code = 'onb_o16_clareza_pos';

-- O19: 4 opções → 3 (Quase tudo / Metade / Poucas)
UPDATE diagnostic_questions
SET options = '[
  {"label": "Quase tudo", "value": "A"},
  {"label": "Metade", "value": "B"},
  {"label": "Poucas", "value": "C"}
]'::jsonb
WHERE code = 'onb_o19_dependencia_dono';

-- O21: 4 opções → 3 (Quase nada / Algumas coisas / Tudo)
UPDATE diagnostic_questions
SET options = '[
  {"label": "Quase nada", "value": "A"},
  {"label": "Algumas coisas", "value": "B"},
  {"label": "Tudo", "value": "C"}
]'::jsonb
WHERE code = 'onb_o21_ferias';

-- O22: 4 opções → 3 (Sim, com clareza / Mais ou menos / Ninguém tem meta clara)
UPDATE diagnostic_questions
SET options = '[
  {"label": "Sim, com clareza", "value": "A"},
  {"label": "Mais ou menos", "value": "B"},
  {"label": "Ninguém tem meta clara", "value": "C"}
]'::jsonb
WHERE code = 'onb_o22_metas_equipa';

-- O22A: multi_select 6 opções → single_select 3 opções (Poucas / Metade / Quase tudo)
UPDATE diagnostic_questions
SET
  label = 'Quais decisões ainda passam por você?',
  question_type = 'single_select',
  options = '[
    {"label": "Poucas", "value": "A"},
    {"label": "Metade", "value": "B"},
    {"label": "Quase tudo", "value": "C"}
  ]'::jsonb
WHERE code = 'onb_o22a_decisoes';

-- O25: opções completamente diferentes conforme spec
UPDATE diagnostic_questions
SET options = '[
  {"label": "Mesmo valor", "value": "A"},
  {"label": "1.5x mais", "value": "B"},
  {"label": "2-3x mais", "value": "C"},
  {"label": "Não sei", "value": "D"}
]'::jsonb
WHERE code = 'onb_o25_gap_ticket';

-- O26: 4 opções → 3 (Sim, tenho reserva / Pouco / Não)
UPDATE diagnostic_questions
SET options = '[
  {"label": "Sim, tenho reserva", "value": "A"},
  {"label": "Pouco", "value": "B"},
  {"label": "Não", "value": "C"}
]'::jsonb
WHERE code = 'onb_o26_capacidade_invest';

-- O29: remover opção D "Já tentei, não funcionou"
UPDATE diagnostic_questions
SET options = '[
  {"label": "Nunca tive", "value": "A"},
  {"label": "Já tive", "value": "B"},
  {"label": "Tenho atualmente", "value": "C"}
]'::jsonb
WHERE code = 'onb_o29_mentoria';
