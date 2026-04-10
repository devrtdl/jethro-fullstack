-- Migration 016: Corrige order de precificacao e lucro_crescimento no form JSONB
-- Contexto: migration 015 inseriu precificacao em order=12 (→ exibia como q13)
--           e lucro_crescimento ficou em order=11 (→ exibia como q12).
--           O correto é: precificacao em order=11 (→ q12) e lucro em order=12 (→ q13).
-- Idempotente: só executa se precificacao não está em order=11.

update forms set
  questions = (
    select jsonb_agg(
      case
        when q->>'slug' = 'precificacao'      then jsonb_set(q, '{order}', '11')
        when q->>'slug' = 'lucro_crescimento' then jsonb_set(q, '{order}', '12')
        else q
      end
      order by (
        case
          when q->>'slug' = 'precificacao'      then 11
          when q->>'slug' = 'lucro_crescimento' then 12
          else (q->>'order')::int
        end
      )
    )
    from jsonb_array_elements(questions::jsonb) q
  ),
  updated_at = now()
where slug = 'diagnostico-inicial'
  and exists (
    select 1 from jsonb_array_elements(questions::jsonb) q
    where q->>'slug' = 'precificacao'
      and (q->>'order')::int <> 11
  );
