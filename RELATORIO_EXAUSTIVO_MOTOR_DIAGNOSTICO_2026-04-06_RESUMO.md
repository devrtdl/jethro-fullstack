# Relatorio Exaustivo do Motor de Diagnostico (06/04/2026)

- Total de cenarios avaliados: **2.041.200**
- Motor aplicado: regras atuais de `jethro-backend/src/domain/forms/service.ts` (E sem Q15 na fase inicial e F com Q9 em [A,B]).

## Distribuicao por modelo

| Modelo | Titulo | Cenarios |
|---|---|---:|
| A | Negocio travado e baguncado | 249.480 |
| B | Negocio saudavel no plato | 55.440 |
| C | Boa base, caixa apertado | 51.480 |
| D | Fatura, mas sangra | 311.850 |
| E | Ja comecou, mas nao validou | 561.330 |
| F | Vende sem motor comercial | 17.820 |
| G | Operacao no limite | 340.200 |
| H | Gargalo do dono | 249.480 |
| I | Pre-receita / ainda nao comecou | 204.120 |

## Cenarios homogeneos (tudo A / B / C / D / E)

| Padrao | q5 | q6 | q7 | q8 | q9 | q10 | q11 | q12 | q15 | q16 | q17 | Modelo | Motivo | Consequencia pratica |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tudo A | A | A | A | A | A | nao_comecou | A | A | A | A | A | I | Q11='A' e Q18 em [A,C,D] | Sem tracao de receita; foco em validacao rapida e primeiras vendas. |
| Tudo B | B | B | B | B | B | informal | B | B | B | B | B | E | Q5<='B' e Q11='B' | Validacao comercial insuficiente; foco em proposta, oferta e tracao inicial. |
| Tudo C | C | C | C | C | C | formalizada | C | C | C | C | C | G | Q11>='C' e Q16='C' | Crescimento gera colapso operacional; padronizar processos e capacidade antes de escalar. |
| Tudo D | D | C | C | C | C | formalizada | D | C | D | C | D | G | Q11>='C' e Q16='C' | Crescimento gera colapso operacional; padronizar processos e capacidade antes de escalar. |
| Tudo E | D | C | C | C | C | formalizada | D | C | E | C | E | G | Q11>='C' e Q16='C' | Crescimento gera colapso operacional; padronizar processos e capacidade antes de escalar. |

## Arquivos gerados

- RELATORIO_EXAUSTIVO_MOTOR_DIAGNOSTICO_2026-04-06.csv
- RELATORIO_EXAUSTIVO_MOTOR_DIAGNOSTICO_2026-04-06_RESUMO.md
- RELATORIO_EXAUSTIVO_MOTOR_DIAGNOSTICO_2026-04-06_PRETO_BRANCO_PRINT.html