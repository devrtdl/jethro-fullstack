-- Onboarding v2.0: adiciona novos tipos de pergunta ao check constraint
alter table diagnostic_questions
  drop constraint if exists diagnostic_questions_question_type_check;

alter table diagnostic_questions
  add constraint diagnostic_questions_question_type_check
  check (question_type in (
    'text', 'textarea', 'email', 'phone',
    'single_select', 'money_range', 'number',
    'range_with_optional', 'multi_select'
  ));
