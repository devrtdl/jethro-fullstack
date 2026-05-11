-- Garante que todas as perguntas da Fase 4 têm conditional=true e showIf.diagnosticModel correto.
-- Sem esta migration, o backend devolve as perguntas de todos os blocos para todos os modelos
-- porque: conditional=false → sempre exibir, ou showIf ausente → frontend gere (passa tudo).

-- Bloco C/D — Gestão de custos e dívidas
UPDATE diagnostic_questions
SET metadata = metadata
  || '{"conditional": true}'::jsonb
  || jsonb_build_object('showIf', '{"diagnosticModel": ["C", "D"]}'::jsonb)
WHERE code IN ('onb_o12_precificacao', 'onb_o13_dividas_forn', 'onb_o15_clareza_custos');

-- Bloco A/B — Clareza de oferta e posicionamento
UPDATE diagnostic_questions
SET metadata = metadata
  || '{"conditional": true}'::jsonb
  || jsonb_build_object('showIf', '{"diagnosticModel": ["A", "B"]}'::jsonb)
WHERE code IN ('onb_o16_clareza_pos', 'onb_o17_num_ofertas', 'onb_o18_oferta_principal');

-- Bloco G — Operação e processos
UPDATE diagnostic_questions
SET metadata = metadata
  || '{"conditional": true}'::jsonb
  || jsonb_build_object('showIf', '{"diagnosticModel": ["G"]}'::jsonb)
WHERE code IN ('onb_o19_dependencia_dono', 'onb_o20_processos', 'onb_o21_ferias');

-- Bloco H — Liderança e governo pessoal
UPDATE diagnostic_questions
SET metadata = metadata
  || '{"conditional": true}'::jsonb
  || jsonb_build_object('showIf', '{"diagnosticModel": ["H"]}'::jsonb)
WHERE code IN ('onb_o22_metas_equipa', 'onb_o22a_decisoes');

-- Bloco E/F — Posicionamento e aquisição
UPDATE diagnostic_questions
SET metadata = metadata
  || '{"conditional": true}'::jsonb
  || jsonb_build_object('showIf', '{"diagnosticModel": ["E", "F"]}'::jsonb)
WHERE code IN ('onb_o24_posicionamento', 'onb_o25_gap_ticket');

-- Bloco X — Pronto para Escalar
UPDATE diagnostic_questions
SET metadata = metadata
  || '{"conditional": true}'::jsonb
  || jsonb_build_object('showIf', '{"diagnosticModel": ["X"]}'::jsonb)
WHERE code IN (
  'onb_o26_capacidade_invest',
  'onb_o27_processos_x',
  'onb_o28_barreira_escala',
  'onb_o29_mentoria'
);
