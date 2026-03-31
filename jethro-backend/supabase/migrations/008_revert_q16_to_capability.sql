-- Reverte Q16 capacidade_operacional para as respostas de capacidade operacional
-- (Daria conta / Precisaria reorganizar / Entraria em colapso)
-- O motor usa C=colapso como gatilho do Modelo G
update forms set
  questions = (
    select jsonb_agg(
      case
        when q->>'slug' = 'capacidade_operacional' then
          jsonb_set(q, '{options}', '[
            {"id":"cap_a","label":"Daria conta normalmente","value":"A","order":0},
            {"id":"cap_b","label":"Precisaria reorganizar algumas partes","value":"B","order":1},
            {"id":"cap_c","label":"A operacao entraria em colapso","value":"C","order":2}
          ]'::jsonb)
        else q
      end
      order by (q->>'order')::int
    )
    from jsonb_array_elements(questions::jsonb) q
  ),
  updated_at = now()
where slug = 'diagnostico-inicial';
