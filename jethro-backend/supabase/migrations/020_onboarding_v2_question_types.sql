-- Limpa qualquer question_type inválido antes de aplicar a nova constraint
-- (pode existir se migrações anteriores falharam parcialmente)
UPDATE diagnostic_questions
SET question_type = 'text'
WHERE question_type NOT IN (
  'text', 'textarea', 'email', 'phone',
  'single_select', 'money_range', 'number',
  'range_with_optional', 'multi_select', 'team_slots'
);

-- Onboarding v2.0: alarga check constraint para incluir novos tipos de pergunta
ALTER TABLE diagnostic_questions
  DROP CONSTRAINT IF EXISTS diagnostic_questions_question_type_check;

ALTER TABLE diagnostic_questions
  ADD CONSTRAINT diagnostic_questions_question_type_check
  CHECK (question_type IN (
    'text', 'textarea', 'email', 'phone',
    'single_select', 'money_range', 'number',
    'range_with_optional', 'multi_select', 'team_slots'
  ));
