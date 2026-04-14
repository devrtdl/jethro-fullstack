-- Alinha os titulos e trechos dos diagnosticos com o documento
-- "02-Jethro — Mensagens de Diagnóstico v2.1" (abril/2026).

update diagnostic_models
set
  title = case code
    when 'A' then 'Negócio Sem Rumo — Várias Frentes Abertas'
    when 'B' then 'Base Sólida, Faturamento Estagnado'
    when 'C' then 'Entrega Bem, Cobra Mal'
    when 'D' then 'Fatura, Mas Não Sobra'
    when 'E' then 'Começou, Mas o Mercado Ainda Não Respondeu'
    when 'F' then 'Vende Bem, Mas Não Sabe Trazer o Próximo Cliente'
    when 'G' then 'A Operação Não Aguenta Crescer'
    when 'H' then 'Sem Você, Nada Anda'
    else title
  end,
  updated_at = now()
where code in ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H');

update diagnostic_messages
set
  block_1_body = replace(
    block_1_body,
    E'→ O fluxo financeiro é uma corda bamba — aperta, você dá desconto',
    E'→ O preço não reflete o valor real do que você faz — e você sabe disso'
  ),
  root_cause = 'propósito sem modelo financeiro + precificação abaixo do valor real',
  block_2_body = replace(
    block_2_body,
    E'Aperto de caixa rouba liberdade — e liberdade é parte do chamado.',
    E'Cobrar abaixo do que vale rouba liberdade — e liberdade é parte do chamado.'
  ),
  updated_at = now()
where model_code = 'C' and variant = 'v1';

update diagnostic_messages
set
  root_cause = 'valor sem modelo + preço sem regra',
  updated_at = now()
where model_code = 'C' and variant = 'v2';

update diagnostic_messages
set
  block_1_body = replace(
    block_1_body,
    E'[NOME], você provou que sabe entregar. Agora precisa provar que sabe crescer.',
    E'[NOME], você provou que sabe entregar. Agora precisa provar que sabe atrair.'
  ),
  updated_at = now()
where model_code = 'F' and variant = 'v2';

update diagnostic_messages
set
  block_1_body = replace(
    block_1_body,
    E'→ Tudo passa por você — a equipe executa, mas depende das suas decisões',
    E'→ Não há padrão de entrega: cada projeto é uma reinvenção'
  ),
  updated_at = now()
where model_code = 'G' and variant = 'v1';

update diagnostic_messages
set
  root_cause = 'operação reativa + ausência de padrão documentado + estrutura que não acompanhou o crescimento',
  palavra_intro = 'Sem sabedoria, a casa mais bonita desmorona. Estrutura é o que sustenta o que você construiu.',
  scripture_verse = 'Provérbios 24:3',
  scripture_text = '"Com sabedoria se constrói a casa, e com entendimento ela se firma."',
  block_2_body = replace(
    block_2_body,
    E'Uma operação em caos não glorifica o Deus de ordem.',
    E'Uma operação sem processo não glorifica o Deus de ordem.'
  ),
  updated_at = now()
where model_code = 'G' and variant = 'v2';

update diagnostic_messages
set
  block_1_body = replace(
    block_1_body,
    E'→ Equipe sem autonomia: sem você, a operação trava',
    E'→ Equipe sem autonomia de processo: sem padrão, não há como delegar resultado'
  ),
  updated_at = now()
where model_code = 'G' and variant = 'v3';
