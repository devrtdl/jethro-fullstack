-- Rename q18_status_empresa to q18_formalizacao to match the actual question slug
alter table diagnostico_respostas
  rename column q18_status_empresa to q18_formalizacao;

-- Seed the canonical diagnostic form
-- Uses ON CONFLICT so re-running is safe
insert into forms (id, slug, title, description, status, steps, questions, settings)
values (
  'form_diagnostico_inicial',
  'diagnostico-inicial',
  'Diagnostico Inicial Jethro',
  'Formulario tecnico de diagnostico conforme especificacao do Jethro.',
  'published',
  '[
    {"id":"step_identificacao","title":"Identificacao","description":"Dados basicos do empreendedor.","order":0},
    {"id":"step_negocio","title":"Negocio","description":"Contexto e maturidade do negocio.","order":1},
    {"id":"step_operacao","title":"Operacao","description":"Operacao, receita e crescimento.","order":2},
    {"id":"step_objetivos","title":"Objetivos","description":"Visao de futuro e desafios.","order":3}
  ]'::jsonb,
  '[
    {
      "id":"question_nome_completo","stepId":"step_identificacao","slug":"nome_completo",
      "label":"Qual e o seu nome e sobrenome?",
      "helperText":"Informe nome completo com pelo menos duas palavras.",
      "type":"text","presentation":"input","required":true,"order":0,"options":[],
      "validation":{"minLength":3,"minWords":2,"pattern":"^[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF'' -]+$"}
    },
    {
      "id":"question_area_atuacao","stepId":"step_identificacao","slug":"area_atuacao",
      "label":"Qual e a area de atuacao do seu negocio?",
      "type":"text","presentation":"input","required":true,"order":1,"options":[],
      "validation":{"minLength":3,"maxLength":100}
    },
    {
      "id":"question_whatsapp","stepId":"step_identificacao","slug":"whatsapp",
      "label":"Qual e o seu numero de WhatsApp?",
      "helperText":"",
      "type":"phone","presentation":"phone","required":true,"order":2,"options":[],
      "validation":{}
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
        {"id":"fase_ideia","label":"Ideia","value":"ideia","order":0},
        {"id":"fase_inicio","label":"Inicio (0-1 ano)","value":"inicio","order":1},
        {"id":"fase_crescimento","label":"Em crescimento (1-3 anos)","value":"crescimento","order":2},
        {"id":"fase_consolidado","label":"Consolidado (3+ anos)","value":"consolidado","order":3}
      ],
      "validation":{}
    },
    {
      "id":"question_conexao_dons","stepId":"step_negocio","slug":"conexao_dons",
      "label":"Voce sente que seu negocio esta conectado com seus dons e talentos?",
      "type":"single_select","presentation":"scale","required":true,"order":5,
      "options":[
        {"id":"dons_total","label":"Sim, totalmente","value":"total","order":0},
        {"id":"dons_parcial","label":"Parcialmente","value":"parcial","order":1},
        {"id":"dons_nao","label":"Nao, ainda nao","value":"nao","order":2}
      ],
      "validation":{}
    },
    {
      "id":"question_proposito_negocio","stepId":"step_negocio","slug":"proposito_negocio",
      "label":"Voce sabe exatamente qual e o proposito do seu negocio e como ele entrega valor?",
      "type":"single_select","presentation":"radio","required":true,"order":6,
      "options":[
        {"id":"prop_claro","label":"Sim, muito claro","value":"claro","order":0},
        {"id":"prop_ideia","label":"Tenho ideia, mas nao esta definido","value":"em_definicao","order":1},
        {"id":"prop_nao","label":"Nao tenho clareza","value":"sem_clareza","order":2}
      ],
      "validation":{}
    },
    {
      "id":"question_estrutura_negocio","stepId":"step_negocio","slug":"estrutura_negocio",
      "label":"Seu negocio tem estrutura solida, visao de futuro e planejamento estrategico?",
      "type":"single_select","presentation":"radio","required":true,"order":7,
      "options":[
        {"id":"est_bem","label":"Sim, bem estruturado","value":"estruturado","order":0},
        {"id":"est_dev","label":"Em desenvolvimento","value":"desenvolvimento","order":1},
        {"id":"est_nao","label":"Ainda nao","value":"inexistente","order":2}
      ],
      "validation":{}
    },
    {
      "id":"question_organizacao_financeira","stepId":"step_operacao","slug":"organizacao_financeira",
      "label":"Como voce enxerga a organizacao financeira do seu negocio?",
      "type":"single_select","presentation":"select","required":true,"order":8,
      "options":[
        {"id":"fin_estr","label":"Estruturada","value":"estruturada","order":0},
        {"id":"fin_bas","label":"Basica","value":"basica","order":1},
        {"id":"fin_conf","label":"Desorganizada / Confusa","value":"desorganizada","order":2}
      ],
      "validation":{}
    },
    {
      "id":"question_formalizacao","stepId":"step_operacao","slug":"formalizacao",
      "label":"Qual e a situacao formal do seu negocio?",
      "type":"single_select","presentation":"select","required":true,"order":9,
      "options":[
        {"id":"for_informal","label":"Informal","value":"informal","order":0},
        {"id":"for_formalizada","label":"Formalizada / Empresa registrada","value":"formalizada","order":1},
        {"id":"for_media","label":"Empresa de medio/grande porte","value":"empresa_media_grande","order":2},
        {"id":"for_nao","label":"Ainda nao comecei","value":"nao_comecei","order":3},
        {"id":"for_outro","label":"Outro","value":"outro","order":4}
      ],
      "validation":{}
    },
    {
      "id":"question_faturamento_mensal","stepId":"step_operacao","slug":"faturamento_mensal",
      "label":"Qual e o faturamento medio mensal do seu negocio?",
      "helperText":"As opcoes mudam conforme o pais detectado no WhatsApp.",
      "type":"money_range","presentation":"select","required":true,"order":10,
      "options":[],
      "validation":{},
      "metadata":{"dependsOnQuestionSlug":"whatsapp","dependsOnCountryField":"pais_iso"}
    },
    {
      "id":"question_lucro_crescimento","stepId":"step_operacao","slug":"lucro_crescimento",
      "label":"Voce sente que o seu negocio esta gerando lucro e crescendo?",
      "type":"single_select","presentation":"scale","required":true,"order":11,
      "options":[
        {"id":"luc_cresce","label":"Sim, crescendo","value":"crescendo","order":0},
        {"id":"luc_estavel","label":"Estavel, sem crescimento","value":"estavel","order":1},
        {"id":"luc_regredindo","label":"Nao, estamos regredindo","value":"regredindo","order":2}
      ],
      "validation":{}
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
      "type":"single_select","presentation":"select","required":true,"order":14,
      "options":[
        {"id":"can_instagram","label":"Instagram","value":"instagram","order":0},
        {"id":"can_indicacao","label":"Indicacao","value":"indicacao","order":1},
        {"id":"can_pago","label":"Trafego pago","value":"trafego_pago","order":2},
        {"id":"can_linkedin","label":"LinkedIn","value":"linkedin","order":3},
        {"id":"can_ativo","label":"Eu vou atras ativamente","value":"ativo","order":4},
        {"id":"can_varios","label":"Uso varios canais","value":"varios","order":5},
        {"id":"can_outro","label":"Outro","value":"outro","order":6}
      ],
      "validation":{}
    },
    {
      "id":"question_capacidade_operacional","stepId":"step_operacao","slug":"capacidade_operacional",
      "label":"Se o numero de clientes dobrasse amanha, o que aconteceria?",
      "type":"single_select","presentation":"radio","required":true,"order":15,
      "options":[
        {"id":"cap_sozinho","label":"Sozinho(a)","value":"sozinho","order":0},
        {"id":"cap_2_5","label":"2-5 pessoas","value":"equipe_2_5","order":1},
        {"id":"cap_6_10","label":"6-10 pessoas","value":"equipe_6_10","order":2},
        {"id":"cap_mais_10","label":"Mais de 10","value":"mais_10","order":3}
      ],
      "validation":{}
    },
    {
      "id":"question_horas_semana","stepId":"step_operacao","slug":"horas_semana",
      "label":"Quantas horas por semana voce dedica ao seu negocio?",
      "type":"number","presentation":"input","required":true,"order":16,"options":[],
      "validation":{"min":1,"max":168,"integer":true},
      "metadata":{"suggestedRanges":["Menos de 10h","10-20h","20-40h","Entre 40 e 60h","Mais de 60h"]}
    }
  ]'::jsonb,
  '{"successTitle":"Diagnostico enviado","successMessage":"Recebemos suas respostas e vamos processar seu diagnostico.","errorMessage":"Nao foi possivel enviar agora. Revise os dados e tente novamente.","allowRetry":true}'::jsonb
)
on conflict (slug) do update set
  title      = excluded.title,
  description = excluded.description,
  status     = excluded.status,
  steps      = excluded.steps,
  questions  = excluded.questions,
  settings   = excluded.settings,
  updated_at = now();
