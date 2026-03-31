-- Q15 canal_aquisicao: Instagram exibido primeiro (order=0), Indicacao second (order=1)
-- Valores A=Indicacao e B=Instagram NAO mudam — motor depende de A=Indicacao
-- Q16 capacidade_operacional: opcoes de tamanho de equipe conforme spec
-- Q17 horas_semana: label completo na ultima opcao
-- Q18 status_empresa: torna internalOnly — derivada de Q5+Q10 no backend

update forms set
  questions = (
    select jsonb_agg(
      case
        -- Q15: apenas reordena exibicao (Instagram=order 0, Indicacao=order 1)
        when q->>'slug' = 'canal_aquisicao' then
          jsonb_set(q, '{options}', '[
            {"id":"can_b","label":"Instagram","value":"B","order":0},
            {"id":"can_a","label":"Indicacao","value":"A","order":1},
            {"id":"can_c","label":"Trafego pago","value":"C","order":2},
            {"id":"can_d","label":"LinkedIn","value":"D","order":3},
            {"id":"can_e","label":"Eu vou atras ativamente","value":"E","order":4},
            {"id":"can_f","label":"Uso varios canais","value":"F","order":5},
            {"id":"can_g","label":"Outro","value":"G","order":6}
          ]'::jsonb)

        -- Q16: opcoes de equipe conforme spec (A=Sozinho ... D=Mais de 10)
        when q->>'slug' = 'capacidade_operacional' then
          jsonb_set(q, '{options}', '[
            {"id":"cap_a","label":"Sozinho(a)","value":"A","order":0},
            {"id":"cap_b","label":"2-5 pessoas","value":"B","order":1},
            {"id":"cap_c","label":"6-10 pessoas","value":"C","order":2},
            {"id":"cap_d","label":"Mais de 10","value":"D","order":3}
          ]'::jsonb)

        -- Q17: label completo na ultima opcao
        when q->>'slug' = 'horas_semana' then
          jsonb_set(q, '{options}', '[
            {"id":"hrs_a","label":"Menos de 10h","value":"A","order":0},
            {"id":"hrs_b","label":"10-20h","value":"B","order":1},
            {"id":"hrs_c","label":"20-40h","value":"C","order":2},
            {"id":"hrs_d","label":"Entre 40 e 60h","value":"D","order":3},
            {"id":"hrs_e","label":"Mais de 60h, estou sempre no negocio","value":"E","order":4}
          ]'::jsonb)

        -- Q18 status_empresa: torna internalOnly (derivada no backend)
        when q->>'slug' = 'status_empresa' then
          q || '{"internalOnly":true,"required":false}'::jsonb

        else q
      end
      order by (q->>'order')::int
    )
    from jsonb_array_elements(questions::jsonb) q
  ),
  updated_at = now()
where slug = 'diagnostico-inicial';
