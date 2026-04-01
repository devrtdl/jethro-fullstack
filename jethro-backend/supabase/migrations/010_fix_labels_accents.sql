-- Corrige acentuação de todos os labels do formulário diagnóstico-inicial.
-- Esta migration roda por último e garante que os textos corretos prevaleçam
-- independente do que migrações anteriores (005, 006, 007, 008) tenham inserido.

update forms set
  steps = '[
    {"id":"step_identificacao","title":"Identificação","description":"Dados básicos do empreendedor.","order":0},
    {"id":"step_negocio","title":"Negócio","description":"Contexto e maturidade do negócio.","order":1},
    {"id":"step_operacao","title":"Operação","description":"Operação, receita e crescimento.","order":2},
    {"id":"step_objetivos","title":"Objetivos","description":"Visão de futuro e desafios.","order":3}
  ]'::jsonb,
  questions = '[
    {
      "id":"question_nome_completo","stepId":"step_identificacao","slug":"nome_completo",
      "label":"Qual é o seu nome e sobrenome?",
      "helperText":"Informe nome completo com pelo menos duas palavras.",
      "type":"text","presentation":"input","required":true,"order":0,"options":[],
      "validation":{"minLength":3,"minWords":2,"pattern":"^[A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u00FF'' -]+$"}
    },
    {
      "id":"question_area_atuacao","stepId":"step_identificacao","slug":"area_atuacao",
      "label":"Qual é a área de atuação do seu negócio?",
      "type":"text","presentation":"input","required":true,"order":1,"options":[],
      "validation":{"minLength":3,"maxLength":100}
    },
    {
      "id":"question_whatsapp","stepId":"step_identificacao","slug":"whatsapp",
      "label":"Qual é o seu número de WhatsApp?","helperText":"",
      "type":"phone","presentation":"phone","required":true,"order":2,"options":[],"validation":{}
    },
    {
      "id":"question_email","stepId":"step_identificacao","slug":"email",
      "label":"Qual é o seu endereço de email?",
      "type":"email","presentation":"input","required":true,"order":3,"options":[],
      "validation":{"maxLength":150}
    },
    {
      "id":"question_fase_negocio","stepId":"step_negocio","slug":"fase_negocio",
      "label":"Qual é a fase do seu negócio?",
      "type":"single_select","presentation":"radio","required":true,"order":4,
      "options":[
        {"id":"fase_a","label":"Ideia","value":"A","order":0},
        {"id":"fase_b","label":"Início (0-1 ano)","value":"B","order":1},
        {"id":"fase_c","label":"Em crescimento (1-3 anos)","value":"C","order":2},
        {"id":"fase_d","label":"Consolidado (3+ anos)","value":"D","order":3}
      ],"validation":{}
    },
    {
      "id":"question_conexao_dons","stepId":"step_negocio","slug":"conexao_dons",
      "label":"Você sente que seu negócio está conectado com seus dons e talentos?",
      "type":"single_select","presentation":"scale","required":true,"order":5,
      "options":[
        {"id":"dons_a","label":"Sim, totalmente","value":"A","order":0},
        {"id":"dons_b","label":"Parcialmente","value":"B","order":1},
        {"id":"dons_c","label":"Não, ainda não","value":"C","order":2}
      ],"validation":{}
    },
    {
      "id":"question_proposito_negocio","stepId":"step_negocio","slug":"proposito_negocio",
      "label":"Você sabe exatamente qual é o propósito do seu negócio e como ele entrega valor?",
      "type":"single_select","presentation":"radio","required":true,"order":6,
      "options":[
        {"id":"prop_a","label":"Sim, muito claro","value":"A","order":0},
        {"id":"prop_b","label":"Tenho ideia, mas não está definido","value":"B","order":1},
        {"id":"prop_c","label":"Não tenho clareza","value":"C","order":2}
      ],"validation":{}
    },
    {
      "id":"question_estrutura_negocio","stepId":"step_negocio","slug":"estrutura_negocio",
      "label":"Seu negócio tem estrutura sólida, visão de futuro e planejamento estratégico?",
      "type":"single_select","presentation":"radio","required":true,"order":7,
      "options":[
        {"id":"est_a","label":"Sim, bem estruturado","value":"A","order":0},
        {"id":"est_b","label":"Em desenvolvimento","value":"B","order":1},
        {"id":"est_c","label":"Ainda não","value":"C","order":2}
      ],"validation":{}
    },
    {
      "id":"question_organizacao_financeira","stepId":"step_operacao","slug":"organizacao_financeira",
      "label":"Como você enxerga a organização financeira do seu negócio?",
      "type":"single_select","presentation":"select","required":true,"order":8,
      "options":[
        {"id":"fin_a","label":"Estruturada","value":"A","order":0},
        {"id":"fin_b","label":"Básica","value":"B","order":1},
        {"id":"fin_c","label":"Desorganizada / Confusa","value":"C","order":2}
      ],"validation":{}
    },
    {
      "id":"question_formalizacao","stepId":"step_operacao","slug":"formalizacao",
      "label":"Qual é a situação formal do seu negócio?",
      "type":"single_select","presentation":"select","required":true,"order":9,
      "options":[
        {"id":"for_inf","label":"Informal","value":"informal","order":0},
        {"id":"for_for","label":"Formalizada / Empresa registrada","value":"formalizada","order":1},
        {"id":"for_med","label":"Empresa de médio ou grande porte","value":"medio_grande_porte","order":2},
        {"id":"for_nao","label":"Ainda não comecei","value":"nao_comecou","order":3},
        {"id":"for_out","label":"Outro","value":"outro","order":4}
      ],"validation":{}
    },
    {
      "id":"question_faturamento_mensal","stepId":"step_operacao","slug":"faturamento_mensal",
      "label":"Qual é o faturamento médio mensal do seu negócio?",
      "helperText":"As opções mudam conforme o país detectado no WhatsApp.",
      "type":"money_range","presentation":"select","required":true,"order":10,"options":[],
      "metadata":{"dependsOnCountryField":"pais_iso","dependsOnQuestionSlug":"whatsapp"},
      "validation":{}
    },
    {
      "id":"question_lucro_crescimento","stepId":"step_operacao","slug":"lucro_crescimento",
      "label":"Você sente que o seu negócio está gerando lucro e crescendo?",
      "type":"single_select","presentation":"scale","required":true,"order":11,
      "options":[
        {"id":"luc_a","label":"Sim, crescendo","value":"A","order":0},
        {"id":"luc_b","label":"Estável, sem crescimento","value":"B","order":1},
        {"id":"luc_c","label":"Não, estamos regredindo","value":"C","order":2}
      ],"validation":{}
    },
    {
      "id":"question_objetivo_futuro","stepId":"step_objetivos","slug":"objetivo_futuro",
      "label":"Onde você deseja estar com seu negócio nos próximos 6 a 12 meses?",
      "type":"textarea","presentation":"textarea","required":true,"order":12,"options":[],
      "validation":{"minLength":20,"maxLength":500}
    },
    {
      "id":"question_desafios","stepId":"step_objetivos","slug":"desafios",
      "label":"Quais são os 3 maiores desafios que você está enfrentando hoje no seu negócio?",
      "type":"textarea","presentation":"textarea","required":true,"order":13,"options":[],
      "validation":{"minLength":20,"maxLength":600}
    },
    {
      "id":"question_canal_aquisicao","stepId":"step_objetivos","slug":"canal_aquisicao",
      "label":"Como a maioria dos seus clientes chega até você hoje?",
      "type":"single_select","presentation":"select","required":false,"internalOnly":true,"order":14,
      "metadata":{"internalField":true},
      "options":[
        {"id":"can_b","label":"Instagram","value":"B","order":0},
        {"id":"can_a","label":"Indicação","value":"A","order":1},
        {"id":"can_c","label":"Tráfego pago","value":"C","order":2},
        {"id":"can_d","label":"LinkedIn","value":"D","order":3},
        {"id":"can_e","label":"Eu vou atrás ativamente","value":"E","order":4},
        {"id":"can_f","label":"Uso vários canais","value":"F","order":5},
        {"id":"can_g","label":"Outro","value":"G","order":6}
      ],"validation":{}
    },
    {
      "id":"question_capacidade_operacional","stepId":"step_operacao","slug":"capacidade_operacional",
      "label":"Se o número de clientes dobrasse amanhã, o que aconteceria?",
      "type":"single_select","presentation":"radio","required":true,"order":15,
      "options":[
        {"id":"cap_a","label":"Daria conta normalmente","value":"A","order":0},
        {"id":"cap_b","label":"Precisaria reorganizar algumas partes","value":"B","order":1},
        {"id":"cap_c","label":"A operação entraria em colapso","value":"C","order":2}
      ],"validation":{}
    },
    {
      "id":"question_horas_semana","stepId":"step_operacao","slug":"horas_semana",
      "label":"Quantas horas por semana você dedica ao seu negócio?",
      "type":"single_select","presentation":"radio","required":true,"order":16,
      "options":[
        {"id":"hrs_a","label":"Menos de 10h","value":"A","order":0},
        {"id":"hrs_b","label":"10-20h","value":"B","order":1},
        {"id":"hrs_c","label":"20-40h","value":"C","order":2},
        {"id":"hrs_d","label":"Entre 40 e 60h","value":"D","order":3},
        {"id":"hrs_e","label":"Mais de 60h, estou sempre no negócio","value":"E","order":4}
      ],"validation":{}
    },
    {
      "id":"question_status_empresa","stepId":"step_negocio","slug":"status_empresa",
      "label":"Em que estado real está a sua empresa ou produto hoje?",
      "helperText":"Pergunta adicionada no motor v2.4 para separar validação de pré-início.",
      "type":"single_select","presentation":"radio","required":false,"internalOnly":true,"order":17,
      "options":[
        {"id":"sta_a","label":"Ainda não comecei","value":"A","order":0},
        {"id":"sta_b","label":"Já tenho empresa ou produto em desenvolvimento","value":"B","order":1},
        {"id":"sta_c","label":"Tenho a ideia, mas ainda não estruturei","value":"C","order":2},
        {"id":"sta_d","label":"Estou parado entre ideia e execução","value":"D","order":3}
      ],"validation":{}
    }
  ]'::jsonb,
  updated_at = now()
where slug = 'diagnostico-inicial';
