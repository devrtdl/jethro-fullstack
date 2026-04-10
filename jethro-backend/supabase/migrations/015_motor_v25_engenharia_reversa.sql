-- Motor v2.5 — implementação das recomendações da engenharia reversa dos textos
-- 1. Q15 (canal_aquisicao): torna visível e obrigatório
-- 2. Nova pergunta: precificacao (order 12, step_operacao) — discriminador C vs B
-- 3. Shift das perguntas em order >= 12 para abrir espaço
-- 4. Corrige frase duplicada Modelo D v1 (idêntica à Modelo A)
-- 5. Remove referência Jetro/Êxodo 18:18 do Modelo G v2 (exclusiva do Modelo H)

-- ─── 1. Form: shift orders >= 11, insert precificacao at 11, fix canal_aquisicao ─
-- Guard: só executa se precificacao ainda não existe no form (idempotente).
update forms set
  questions = (
    select jsonb_agg(q_final order by (q_final->>'order')::int)
    from (
      -- Perguntas existentes: shift +1 em order>=11, e remove internalOnly de canal_aquisicao
      select
        case
          when q->>'slug' = 'canal_aquisicao' then
            jsonb_set(
              (q - 'internalOnly') || '{"required":true,"internalOnly":false}'::jsonb,
              '{order}',
              to_jsonb((q->>'order')::int + 1)
            )
          when (q->>'order')::int >= 11 then
            jsonb_set(q, '{order}', to_jsonb((q->>'order')::int + 1))
          else q
        end as q_final
      from jsonb_array_elements(questions::jsonb) q

      union all

      -- Nova pergunta: precificacao (order 11 → exibe como q12, step_operacao)
      select '{
        "id":          "question_precificacao",
        "stepId":      "step_operacao",
        "slug":        "precificacao",
        "label":       "Voce sente que cobra o valor justo pelo que entrega?",
        "type":        "single_select",
        "presentation":"radio",
        "required":    true,
        "order":       11,
        "options": [
          {"id":"prec_a","label":"Sim, cobro o valor que merece",           "value":"A","order":0},
          {"id":"prec_b","label":"As vezes cobro abaixo do valor real",     "value":"B","order":1},
          {"id":"prec_c","label":"Frequentemente cobro abaixo do que entrego","value":"C","order":2}
        ],
        "validation":  {}
      }'::jsonb as q_final
    ) sq
  ),
  updated_at = now()
where slug = 'diagnostico-inicial'
  and not exists (
    select 1 from jsonb_array_elements(questions::jsonb) q
    where q->>'slug' = 'precificacao'
  );

-- ─── 2. diagnostic_questions: shift + registra precificacao ─────────────────────
-- Guard: shift só roda se q_precificacao ainda não existe (idempotente).
-- Dois passos para evitar conflito de unique durante o shift em lote:
--   passo 1 → negativa temporária (sem conflito com positivos existentes)
--   passo 2 → valor final positivo +1
do $$
begin
  if not exists (select 1 from diagnostic_questions where code = 'q_precificacao') then
    update diagnostic_questions set order_index = -order_index - 1 where order_index >= 12;
    update diagnostic_questions set order_index = -order_index     where order_index  < 0;
  end if;
end $$;

insert into diagnostic_questions (
  code, order_index, label, question_type, is_required, is_internal, validation, options, metadata
) values (
  'q_precificacao',
  12,
  'Voce sente que cobra o valor justo pelo que entrega?',
  'single_select',
  true,
  false,
  '{}'::jsonb,
  '[
    {"label":"Sim, cobro o valor que merece",              "value":"A"},
    {"label":"As vezes cobro abaixo do valor real",        "value":"B"},
    {"label":"Frequentemente cobro abaixo do que entrego", "value":"C"}
  ]'::jsonb,
  '{}'::jsonb
)
on conflict (code) do update set
  order_index  = excluded.order_index,
  label        = excluded.label,
  is_required  = excluded.is_required,
  is_internal  = excluded.is_internal,
  options      = excluded.options,
  updated_at   = now();

-- ─── 3. Modelo D v1 — remove frase quase idêntica à do Modelo A ─────────────────
-- Antes: "O dinheiro entra, circula e some antes de você sentir que existiu"
-- Depois: foco em custo absorvendo margem (narrativa exclusiva de D)
update diagnostic_messages
set
  block_1_body = replace(
    block_1_body,
    E'→ O dinheiro entra, circula e some antes de você sentir que existiu',
    E'→ O dinheiro entra, o custo absorve — e a margem que deveria sobrar some antes de se tornar resultado'
  ),
  updated_at = now()
where model_code = 'D' and variant = 'v1';

-- ─── 4. Modelo G v2 — remove referência Jetro/Êxodo 18:18 (exclusiva do Modelo H) ─
-- Troca por versículo e palavraIntro sobre estrutura/processo
update diagnostic_messages
set
  block_1_body = replace(
    block_1_body,
    E'→ O dono é o gargalo central: tudo trava quando você não está',
    E'→ Não há processo documentado: quando alguém falta ou sai, a operação regride'
  ),
  root_cause    = 'operação reativa + ausência de padrão + capacidade estrutural insuficiente',
  palavra_intro = 'Casa construída sem estrutura cai com a primeira carga pesada. Processo não é burocracia — é proteção do que você construiu.',
  scripture_verse = 'Provérbios 24:3',
  scripture_text  = '"Pela sabedoria a casa se edifica; pela inteligência se firma."',
  updated_at    = now()
where model_code = 'G' and variant = 'v2';
