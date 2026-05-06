-- Adiciona tipo team_slots para pergunta O2B (pessoas-chave da equipa)
ALTER TABLE diagnostic_questions
  DROP CONSTRAINT IF EXISTS diagnostic_questions_question_type_check;

ALTER TABLE diagnostic_questions
  ADD CONSTRAINT diagnostic_questions_question_type_check
  CHECK (question_type IN (
    'text', 'textarea', 'email', 'phone',
    'single_select', 'money_range', 'number',
    'range_with_optional', 'multi_select', 'team_slots'
  ));
