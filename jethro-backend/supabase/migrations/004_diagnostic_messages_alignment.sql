alter table diagnostic_questions
  drop constraint if exists diagnostic_questions_question_type_check;

alter table diagnostic_questions
  add constraint diagnostic_questions_question_type_check
  check (question_type in ('text', 'textarea', 'email', 'phone', 'single_select', 'money_range', 'number', 'range_with_optional', 'multi_select'));

alter table diagnostic_messages
  add column if not exists root_cause text;

update diagnostic_messages
set root_cause = coalesce(root_cause, '')
where root_cause is null;

alter table diagnostic_messages
  alter column root_cause set not null;
