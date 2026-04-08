-- Q18 status_empresa: volta a ser opcional (required: false).
-- Quando não exibida ao usuário (Q5≠'A' ou Q10='nao_comecou'), não é enviada no submit.
-- O backend deriva o valor via deriveStatusEmpresa (fallback Q5+Q10) nesses casos.

update forms set
  questions = (
    select jsonb_agg(
      case
        when q->>'slug' = 'status_empresa' then
          q || '{"required":false}'::jsonb
        else q
      end
      order by (q->>'order')::int
    )
    from jsonb_array_elements(questions::jsonb) q
  ),
  updated_at = now()
where slug = 'diagnostico-inicial';
