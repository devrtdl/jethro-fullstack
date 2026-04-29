---
name: Jethro Roadmap — Estado de Implementação
description: Status real de cada bloco/feature do roadmap v2.0 vs o que está implementado no código (Abril 2026)
type: project
originSessionId: 97eb36c6-7203-4c96-8b1c-1dd6fc235933
---
Documento oficial: Roadmap v2.0 (Rogério Teixeira, Abril 2026) — 6 blocos.
Última auditoria de código: 2026-04-29.

**Why:** Manter alinhamento entre o que o PO descreve e o que está no código.
**How to apply:** Consultar antes de implementar qualquer feature para evitar duplicação ou contradição com o roadmap.

---

## Fluxo completo implementado

```
Launch → Auth → Diagnóstico (Q1-Q17) → Resultados (block1/block2)
       → Paywall (Stripe sandbox) → Onboarding v2.0 (O1-O52, ~35 visíveis)
       → Onboarding Result + Gerar Plano → /(tabs)
```

Routing inteligente via `GET /user/flow-status` no LaunchScreen.

---

## B1 — MOTOR

| Feature | Status |
|---|---|
| Formulário diagnóstico Q1–Q17 + Q18 derivado | ✅ OK (motor v2.8, inclui Modelo X) |
| 9 Modelos A–H + Fallback + Modelo X | ✅ OK (v2.8 — X = "Pronto para Escalar") |
| Mensagens V1/V2/V3 (sorteio) | ✅ OK |
| q15_canal_aquisicao: valores únicos por opção | ✅ OK (A=orgânico, B=indicação, C=vários, D=tráfego pago, E=Google Ads) |
| Dead code Q18=D no motor | ⚠️ ABERTO — nenhuma regra produz Q18=D |

---

## B2 — ALMA/RAG

| Feature | Status |
|---|---|
| Alma v5.14 (92 ações, 59 metáforas) | ✅ OK — long-context (Opção A) com prompt caching |
| G01–G14 no contexto do Mentor IA | ✅ OK — índice completo injetado no system prompt (faq-data.ts Camada 3) |
| Planos reais como exemplos RAG (4 cases) | ❌ NÃO implementado |
| Prioridade de indexação por camadas | ❌ NÃO implementado |

---

## B3 — ONBOARDING

| Feature | Status |
|---|---|
| **Onboarding v2.0 — todas as perguntas clicáveis** | ✅ **NOVO** — single_select, range_with_optional, multi_select |
| 52 perguntas no DB (31-38 visíveis por utilizador) | ✅ **NOVO** — fases: identidade, financeiro, comercial, oferta, contexto, adaptativo |
| `showIfAnswer` — condicionais client-side | ✅ **NOVO** — isVisible() avalia metadata em tempo real |
| `RangeWithOptional` + `MultiSelect` components (RN) | ✅ **NOVO** |
| OB condicionais (server-side) | ✅ OK — filtro server-side por modelo |
| O19 follow-up comercial F4 A/B | ✅ OK |
| `buildOnboardingJson()` v2.0 — 75+ campos + aliases legados | ✅ OK (era ⚠️ PARCIAL) |
| `sem_dre_flag` | ✅ OK — raw === 'C' ou 'D' |
| `risco_concentracao`, `risco_plataforma`, `precisa_primeiro_contrato` | ✅ **NOVO** — flags derivadas |
| `CANAL_MOTOR_MAP` + midpoints FAT/CUSTO/TICKET | ✅ **NOVO** |
| Migrations 004 (idempotente) + 020 (novos tipos) | ✅ **NOVO** |
| `proposito_claro_flag` | ❌ NÃO implementado |
| `canal_fragil_flag` | ❌ NÃO implementado |

---

## B4 — PLANO

| Feature | Status |
|---|---|
| POST /plano/generate — Claude + Alma + onboarding JSON → 24 semanas | ✅ OK |
| Persistência: planos_acao + semanas + tarefas_semana + gates_semanais | ✅ OK |
| Tabela Distribuição Modelos A–H (acoes_library seeded) | ✅ OK |
| Camada 3 R01–R33 regras | ⚠️ PARCIAL |
| R34–R43 (sinais secundários) | ❌ NÃO implementado |
| Plano em 2 camadas S1–S8 + S9–S24 | ❌ NÃO implementado |
| System Prompt v1.1 (referência 75+ campos onboarding) | ⚠️ PARCIAL |
| Template 30 Dias (produto de entrada) | ❌ NÃO implementado |

---

## B5 — APP

| Feature | Status |
|---|---|
| Tab Início: devocional + KPIs + plano semana + gate | ✅ OK |
| Tab Mentor: chat com Jethro → POST /mentor/chat | ✅ OK |
| Tab Biblioteca: 14 guias × 7 pilares (accordion) | ✅ OK (dados estáticos) |
| Tab Perfil: dados user, subscription, progresso, sign out | ✅ OK |
| Opção "Fazer novo diagnóstico" no Perfil | ✅ OK |
| GET /home: devocional + KPIs + plano + gate (autenticado) | ✅ OK |
| GET /diagnostic/latest | ✅ OK |
| Gate de Avanço (schema + UI) | ✅ OK — progress bar + 5 dots + check-in modal |
| POST /gate/advance | ✅ OK |
| POST /check-in semanal | ✅ OK |
| Paywall (Stripe sandbox) | ✅ OK — PaywallScreen + Stripe Checkout + mock activation |
| GET /user/flow-status | ✅ OK — routing inteligente no LaunchScreen |
| GET /subscription/status | ✅ OK |
| POST /subscription/create-checkout | ✅ OK — Stripe sandbox (sk_test) |
| POST /subscription/activate-sandbox | ✅ OK — bypass sem pagamento para dev |
| GET /subscription/checkout-success | ✅ OK — página HTML + activação automática |
| **FAQ Fixo — tela /faq dedicada** | ✅ **NOVO** — 21 perguntas, 3 blocos accordion, rota registada |
| **Row "Perguntas Frequentes" no Perfil** | ✅ **NOVO** — navega para /faq |
| **Mentor Tier 1 — FAQ sem chamar Claude** | ✅ **NOVO** — match por keywords, threshold 0.5 |
| **Mentor Tier 2 — system prompt enriquecido** | ✅ **NOVO** — modelo, semana, fase, gate, FAQ por modelo, G01-G14 |
| **Mentor chips de sugestão (4 perguntas)** | ✅ **NOVO** — aparecem antes da 1ª interação |
| **faq-data.ts — FAQ Global + por Modelo + Índice** | ✅ **NOVO** — Camadas 1, 2, 3, 4 (estático) |
| API #1 Lead Warming (pré-diagnóstico) | ❌ NÃO implementado |
| API #2 Objection Handling (pós-diagnóstico) | ❌ NÃO implementado |
| Cálculo de horas reais (tracking 120h) | ⚠️ COUNT(check_ins) × 24h |

---

## B6 — QA

| Feature | Status |
|---|---|
| DoubleCheck coerência cruzada v10 | ✅ OK (documentado) |
| Validação 30 leads simulados (98%) | ✅ OK |
| G-34: COM-43–46, FIN-28, LID-22–23 sem gate na Camada 3 | ⚠️ ABERTO — ações referenciadas no alma-content.txt mas NÃO seedadas na acoes_library |
| Modelo I — 12 ações PRE sem activação | ⚠️ ABERTO — prefixo PRE- inexistente no código |
| Exemplo Fallback errado no Roteiro QA | ⚠️ ABERTO |

---

## Contagem actualizada (2026-04-29)

| Status | Count |
|---|---|
| ✅ Implementado | 43 |
| ⚠️ Parcial / Em aberto | 8 |
| ❌ Não implementado | 8 |
| **Total** | **59** |

*(+8 features novas vs auditoria de 2026-04-20: Onboarding v2.0 clicável, JSON 75+ campos, flags derivadas, CANAL_MOTOR_MAP, migrations, FAQ fixo, FAQ Mentor Tier 1+2, chips sugestão)*

---

## Próximas prioridades (v2.1)

1. **`proposito_claro_flag` + `canal_fragil_flag`** — últimos flags em falta do Onboarding v2.0
2. **System Prompt v1.1** — referenciar os 75+ campos do `buildOnboardingJson()` v2.0 no prompt de geração de plano
3. **Camada 3 v1.11** — R34–R43 sinais secundários + Plano 2 camadas S1–S8+S9–S24
4. **G-34 crítico** — seed COM-43–46, FIN-28, LID-22–23 em acoes_library + regras de ativação Camada 3
5. **API #2 Objection Handling** — personalização pós-diagnóstico por modelo A–H+X
6. **RAG real** — 4 planos reais como exemplos + indexação por camadas
7. **Stripe end-to-end em produção** — STRIPE_SECRET_KEY no Render env vars
