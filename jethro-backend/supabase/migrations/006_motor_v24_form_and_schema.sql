-- Rename q18_formalizacao back to q18_status_empresa (Motor v2.4 uses status_empresa for Q18)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'diagnostico_respostas' and column_name = 'q18_formalizacao'
  ) then
    alter table diagnostico_respostas rename column q18_formalizacao to q18_status_empresa;
  end if;
end $$;

-- Update the diagnostic form to use single-letter codes (A/B/C/D) as option values
-- matching domain-seed.ts and Motor v2.4 specification
update forms set
  questions = '[
    {
      "id":"question_nome_completo","stepId":"step_identificacao","slug":"nome_completo",
      "label":"Qual e o seu nome e sobrenome?",
      "helperText":"Informe nome completo com pelo menos duas palavras.",
      "type":"text","presentation":"input","required":true,"order":0,"options":[],
      "validation":{"minLength":3,"minWords":2,"pattern":"^[A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u00FF'' -]+$"}
    },
    {
      "id":"question_area_atuacao","stepId":"step_identificacao","slug":"area_atuacao",
      "label":"Qual e a area de atuacao do seu negocio?",
      "type":"text","presentation":"input","required":true,"order":1,"options":[],
      "validation":{"minLength":3,"maxLength":100}
    },
    {
      "id":"question_whatsapp","stepId":"step_identificacao","slug":"whatsapp",
      "label":"Qual e o seu numero de WhatsApp?","helperText":"",
      "type":"phone","presentation":"phone","required":true,"order":2,"options":[],"validation":{}
    },
    {
      "id":"question_email","stepId":"step_identificacao","slug":"email",
      "label":"Qual e o seu endereco de email?",
      "type":"email","presentation":"input","required":true,"order":3,"options":[],
      "validation":{"maxLength":150}
    },
    {
      "id":"question_fase_negocio","stepId":"step_negocio","slug":"fase_negocio",
      "label":"Qual e a fase do seu negocio?",
      "type":"single_select","presentation":"radio","required":true,"order":4,
      "options":[
        {"id":"fase_a","label":"Ideia","value":"A","order":0},
        {"id":"fase_b","label":"Inicio (0-1 ano)","value":"B","order":1},
        {"id":"fase_c","label":"Em crescimento (1-3 anos)","value":"C","order":2},
        {"id":"fase_d","label":"Consolidado (3+ anos)","value":"D","order":3}
      ],"validation":{}
    },
    {
      "id":"question_conexao_dons","stepId":"step_negocio","slug":"conexao_dons",
      "label":"Voce sente que seu negocio esta conectado com seus dons e talentos?",
      "type":"single_select","presentation":"scale","required":true,"order":5,
      "options":[
        {"id":"dons_a","label":"Sim, totalmente","value":"A","order":0},
        {"id":"dons_b","label":"Parcialmente","value":"B","order":1},
        {"id":"dons_c","label":"Nao, ainda nao","value":"C","order":2}
      ],"validation":{}
    },
    {
      "id":"question_proposito_negocio","stepId":"step_negocio","slug":"proposito_negocio",
      "label":"Voce sabe exatamente qual e o proposito do seu negocio e como ele entrega valor?",
      "type":"single_select","presentation":"radio","required":true,"order":6,
      "options":[
        {"id":"prop_a","label":"Sim, muito claro","value":"A","order":0},
        {"id":"prop_b","label":"Tenho ideia, mas nao esta definido","value":"B","order":1},
        {"id":"prop_c","label":"Nao tenho clareza","value":"C","order":2}
      ],"validation":{}
    },
    {
      "id":"question_estrutura_negocio","stepId":"step_negocio","slug":"estrutura_negocio",
      "label":"Seu negocio tem estrutura solida, visao de futuro e planejamento estrategico?",
      "type":"single_select","presentation":"radio","required":true,"order":7,
      "options":[
        {"id":"est_a","label":"Sim, bem estruturado","value":"A","order":0},
        {"id":"est_b","label":"Em desenvolvimento","value":"B","order":1},
        {"id":"est_c","label":"Ainda nao","value":"C","order":2}
      ],"validation":{}
    },
    {
      "id":"question_organizacao_financeira","stepId":"step_operacao","slug":"organizacao_financeira",
      "label":"Como voce enxerga a organizacao financeira do seu negocio?",
      "type":"single_select","presentation":"select","required":true,"order":8,
      "options":[
        {"id":"fin_a","label":"Estruturada","value":"A","order":0},
        {"id":"fin_b","label":"Basica","value":"B","order":1},
        {"id":"fin_c","label":"Desorganizada / Confusa","value":"C","order":2}
      ],"validation":{}
    },
    {
      "id":"question_formalizacao","stepId":"step_operacao","slug":"formalizacao",
      "label":"Qual e a situacao formal do seu negocio?",
      "type":"single_select","presentation":"select","required":true,"order":9,
      "options":[
        {"id":"for_inf","label":"Informal","value":"informal","order":0},
        {"id":"for_for","label":"Formalizada / Empresa registrada","value":"formalizada","order":1},
        {"id":"for_med","label":"Empresa de medio/grande porte","value":"medio_grande_porte","order":2},
        {"id":"for_nao","label":"Ainda nao comecei","value":"nao_comecou","order":3},
        {"id":"for_out","label":"Outro","value":"outro","order":4}
      ],"validation":{}
    },
    {
      "id":"question_faturamento_mensal","stepId":"step_operacao","slug":"faturamento_mensal",
      "label":"Qual e o faturamento medio mensal do seu negocio?",
      "helperText":"As opcoes mudam conforme o pais detectado no WhatsApp.",
      "type":"money_range","presentation":"select","required":true,"order":10,
      "options":[],"validation":{},
      "metadata":{"dependsOnQuestionSlug":"whatsapp","dependsOnCountryField":"pais_iso"}
    },
    {
      "id":"question_lucro_crescimento","stepId":"step_operacao","slug":"lucro_crescimento",
      "label":"Voce sente que o seu negocio esta gerando lucro e crescendo?",
      "type":"single_select","presentation":"scale","required":true,"order":11,
      "options":[
        {"id":"luc_a","label":"Sim, crescendo","value":"A","order":0},
        {"id":"luc_b","label":"Estavel, sem crescimento","value":"B","order":1},
        {"id":"luc_c","label":"Nao, estamos regredindo","value":"C","order":2}
      ],"validation":{}
    },
    {
      "id":"question_objetivo_futuro","stepId":"step_objetivos","slug":"objetivo_futuro",
      "label":"Onde voce deseja estar com seu negocio nos proximos 6 a 12 meses?",
      "type":"textarea","presentation":"textarea","required":true,"order":12,"options":[],
      "validation":{"minLength":20,"maxLength":500}
    },
    {
      "id":"question_desafios","stepId":"step_objetivos","slug":"desafios",
      "label":"Quais sao os 3 maiores desafios que voce esta enfrentando hoje?",
      "type":"textarea","presentation":"textarea","required":true,"order":13,"options":[],
      "validation":{"minLength":20,"maxLength":600}
    },
    {
      "id":"question_canal_aquisicao","stepId":"step_objetivos","slug":"canal_aquisicao",
      "label":"Como a maioria dos seus clientes chega ate voce hoje?",
      "type":"single_select","presentation":"select","required":false,"internalOnly":true,"order":14,
      "options":[
        {"id":"can_a","label":"Indicacao","value":"A","order":0},
        {"id":"can_b","label":"Instagram","value":"B","order":1},
        {"id":"can_c","label":"Trafego pago","value":"C","order":2},
        {"id":"can_d","label":"LinkedIn","value":"D","order":3},
        {"id":"can_e","label":"Eu vou atras ativamente","value":"E","order":4},
        {"id":"can_f","label":"Uso varios canais","value":"F","order":5},
        {"id":"can_g","label":"Outro","value":"G","order":6}
      ],"validation":{},"metadata":{"internalField":true}
    },
    {
      "id":"question_capacidade_operacional","stepId":"step_operacao","slug":"capacidade_operacional",
      "label":"Se o numero de clientes dobrasse amanha, o que aconteceria?",
      "type":"single_select","presentation":"radio","required":true,"order":15,
      "options":[
        {"id":"cap_a","label":"Daria conta normalmente","value":"A","order":0},
        {"id":"cap_b","label":"Precisaria reorganizar algumas partes","value":"B","order":1},
        {"id":"cap_c","label":"A operacao entraria em colapso","value":"C","order":2}
      ],"validation":{}
    },
    {
      "id":"question_horas_semana","stepId":"step_operacao","slug":"horas_semana",
      "label":"Quantas horas por semana voce dedica ao seu negocio?",
      "type":"single_select","presentation":"radio","required":true,"order":16,
      "options":[
        {"id":"hrs_a","label":"Menos de 10h","value":"A","order":0},
        {"id":"hrs_b","label":"10-20h","value":"B","order":1},
        {"id":"hrs_c","label":"20-40h","value":"C","order":2},
        {"id":"hrs_d","label":"Entre 40 e 60h","value":"D","order":3},
        {"id":"hrs_e","label":"Mais de 60h","value":"E","order":4}
      ],"validation":{}
    },
    {
      "id":"question_status_empresa","stepId":"step_negocio","slug":"status_empresa",
      "label":"Em que estado real esta a sua empresa ou produto hoje?",
      "helperText":"Pergunta Q18 do Motor v2.4 — separa pre-inicio de validacao.",
      "type":"single_select","presentation":"radio","required":true,"order":17,
      "options":[
        {"id":"sta_a","label":"Ainda nao comecei","value":"A","order":0},
        {"id":"sta_b","label":"Ja tenho empresa ou produto em desenvolvimento","value":"B","order":1},
        {"id":"sta_c","label":"Tenho a ideia, mas ainda nao estruturei","value":"C","order":2},
        {"id":"sta_d","label":"Estou parado entre ideia e execucao","value":"D","order":3}
      ],"validation":{}
    }
  ]'::jsonb,
  updated_at = now()
where slug = 'diagnostico-inicial';
