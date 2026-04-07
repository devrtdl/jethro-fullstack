-- Q18 status_empresa: torna visível ao usuário (remove internalOnly).
-- O backend (deriveStatusEmpresa) agora usa a resposta direta do usuário quando presente,
-- com fallback para derivação via Q5+Q10 quando não enviada.
-- Q18 precisa ser exibida nos casos ambíguos (Q5='A' + Q10≠'nao_comecou') para que o
-- usuário possa informar diretamente se já tem empresa, distinguindo Modelo E de Modelo I.

update forms set
  questions = (
    select jsonb_agg(
      case
        when q->>'slug' = 'status_empresa' then
          q
          - 'internalOnly'
          || '{"required":true}'::jsonb
        else q
      end
      order by (q->>'order')::int
    )
    from jsonb_array_elements(questions::jsonb) q
  ),
  updated_at = now()
where slug = 'diagnostico-inicial';
