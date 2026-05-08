# Jethro — Controle de Pendências Técnicas
**Atualizado:** Maio 2026 · **Referência:** Jethro_Pendencias_Daniel.pdf (Rogério Teixeira)

---

## Legenda de status

| Ícone | Significado |
|---|---|
| ✅ | Já implementado — não precisa fazer |
| 🔧 | Pronto para implementar — sem docs externos |
| 📄 | Bloqueado — aguardando documento de referência |
| ⏳ | Bloqueado — aguardando Rogério ou resultado de testes |
| 🚫 | Fora do escopo de código (infra / conteúdo / lojas) |

---

## 1. Prompt e Geração de Plano

| # | Tarefa | Status | Observação |
|---|---|---|---|
| P1 | Substituir prompt atual pelo Prompt A (Doc5 v2.0) | ✅ | Backend já tem 9 REGRAS ABSOLUTAS, BLOCOS_POR_MODELO (9 modelos × 5 blocos), Action Library Alma |
| P2 | Implementar Prompt B (semana individual por gatilho) | ✅ | Backend tem `promptTipo: 'A' \| 'B'` — geração de semana individual já funciona |
| P3 | Ajustar parsing do JSON de saída | ✅ | Backend retorna `bloco`, `tag`, `materiais_biblioteca` por semana; tipos no frontend refletem esses campos |
| P4 | Nomes dos blocos dinâmicos no frontend | 🔧 | `plano-screen.tsx` ainda usa títulos fixos (`'Fundamento'`, `'Estrutura'`…) em vez de ler `semana.bloco` do JSON (ex: modelo D → "Estancar e Diagnosticar") |
| P5 | Tags por semana no frontend | 🔧 | Backend já retorna `semana.tag`; confirmar que `plano-screen.tsx` exibe a tag correta e não usa fallback fixo `'Escala'` |
| P6 | Link para Biblioteca em cada tarefa | 🔧 | `materiais_biblioteca` já aparece na aba Materiais da semana; falta renderizar link direto da ação individual para a tela Biblioteca quando `acao.tag != null` |

---

## 2. Onboarding v2.0

> **Doc necessário:** `Jethro_Onboarding_v2_0.docx`
> Sem esse documento nenhuma das tarefas abaixo pode ser iniciada.

| # | Tarefa | Status | Observação |
|---|---|---|---|
| O1 | Atualizar perguntas do onboarding para testes 360 | 📄 | Substituir perguntas abertas por perguntas clicáveis do v2.0 em todas as fases (Contexto, Financeiro, Comercial, Diagnóstico, OB, Adaptativas, Fechamento) |
| O2 | Campos de valor opcional nas faixas financeiras | 📄 | O4 (faturamento), O6 (custo fixo), O7B (ticket): faixa obrigatória + campo numérico opcional. Backend tem lógica de faixa mas precisa validar se cobre o v2.0 |
| O3 | Gates condicionais das perguntas OB | 📄 | OB-09 a OB-14 só aparecem se condições forem verdade (equipa > 1, clientes < 15, Q12 in [B,C], etc.) |
| O4 | Bloco X adaptativo (O26–O29) | 📄 | 4 perguntas novas para Modelo X: investimento, processos, barreira, mentoria |
| O5 | JSON de saída com 40+ campos | 📄 | Atualizar `${ctx}` para incluir todos os campos novos do onboarding v2.0. Depende de O1 estar feito |

---

## 3. Motor de Diagnóstico

| # | Tarefa | Status | Observação |
|---|---|---|---|
| M1 | Mensagens Fallback A — V1/V2/V3 | 📄 | 3 variações da mensagem "Várias Frentes Abertas". **Doc necessário:** `Jethro_Fallback_A_Spec_Mensagens.docx` |
| M2 | Mapeamento Q16: 5 opções → 3 valores | ✅ | Marcado FEITO no doc do Rogério |
| M3 | Expansão B: remover Q16=C do trigger | ✅ | Marcado FEITO no doc do Rogério |
| M4 | Reforços G: bloco de contagem mínimo 2 | ✅ | Marcado FEITO no doc do Rogério |
| M5 | Expansão D, X, B para reduzir Fallback A (v2.8) | ⏳ | PENDENTE — aguardar resultado dos testes 360 (T1–T3) |

---

## 4. Frontend e UX do App

| # | Tarefa | Status | Observação |
|---|---|---|---|
| F1 | Atualizar visual do diagnóstico | ✅ | Redesign completo entregue: splash, diagnóstico, resultados, onboarding, início, plano, biblioteca |
| F2 | Pergunta de feedback pós-plano | ⏳ | Capturar se o plano fez sentido; opção de reiniciar. Depende de P1 validado + aprovação do Rogério |
| F3 | Nomes dos blocos dinâmicos (frontend) | 🔧 | Mesma tarefa que P4 — `plano-screen.tsx` |
| F4 | Tags por semana no frontend | 🔧 | Mesma tarefa que P5 — substituir `'Escala'` fixo |
| F5 | Link `recurso_biblioteca` nas tarefas | 🔧 | Mesma tarefa que P6 — link da ação para Biblioteca |

---

## 5. Biblioteca, FAQ e Materiais

| # | Tarefa | Status | Observação |
|---|---|---|---|
| L1 | Definir FAQ fixa vs FAQ da IA | ⏳ | Decisão de produto: quais perguntas são estáticas (mais barato) vs IA contextual. Aguarda alinhamento com Rogério |
| L2 | Subir materiais técnicos na Biblioteca | ⏳ | Rogério produz os materiais (Fase 1: 6 templates; Fase 2: 4 vídeos). Daniel sobe quando entregues |
| L3 | Seção Biblioteca no app | ✅ | Tela Biblioteca implementada com P1–P7, busca, carrossel "Recomendados", grid de pilares |
| L4 | FAQ contextual por semana | ⏳ | Quando usuário abre chat, IA recebe contexto da semana atual + modelo. Depende de P1 e P2 validados |

---

## 6. Publicação nas Lojas

| # | Tarefa | Status | Observação |
|---|---|---|---|
| PB1 | Configurar Google Play Console | 🚫 | Conta: MEI Jethro (Nubank) + info@jethroapp.com. Daniel acessa e configura ficha |
| PB2 | Configurar Apple App Store Connect | 🚫 | Conta Individual (CPF). Configurar ficha, screenshots, compliance |
| PB3 | Assets para as lojas | 🚫 | Screenshots (5-8 por plataforma), ícone 1024×1024, feature graphic 1024×500. Depende de F1 finalizado |
| PB4 | Logo vetorial | 🚫 | Logo atual é raster (AI-rendered). Precisa versão SVG/PDF para as lojas |
| PB5 | Build de produção e submissão | 🚫 | APK/AAB (Android) + IPA (iOS). Depende de PB1–PB4 |
| PB6 | Pagamentos in-app | 🚫 | Google Play Billing + Apple In-App Purchase. Assinatura mensal R$87,90. Depende de PB5 |

---

## 7. Monitoramento e Infraestrutura

| # | Tarefa | Status | Observação |
|---|---|---|---|
| I1 | Log de custo por chamada API | ✅ | Backend já registra `tokens_entrada`, `tokens_saida`, `custo_estimado_usd`, `prompt_tipo`, `semana_numero` por chamada |
| I2 | Dashboard de custo | ⏳ | Custo médio por modelo, total dia/semana/mês. Visível para Rogério. Depende de I1 (feito) |
| I3 | Alertas automáticos | ⏳ | Prompt A > USD 0,50 \| Prompt B > USD 0,15 \| Saldo < USD 20 \| Warm-up > 2× média |
| I4 | Recarregar saldo API | 🚫 | Saldo atual: USD 47,31. Recomendado: USD 100 antes do piloto. **Rogério autoriza** |

---

## 8. Sequência de execução recomendada (do doc do Rogério)

```
AGORA
  1. Daniel: P4, P5, P6 / F3, F4, F5  — frontend, sem bloqueio
  2. Daniel: O1–O5 (aguardando Jethro_Onboarding_v2_0.docx)
  3. Daniel: M1    (aguardando Jethro_Fallback_A_Spec_Mensagens.docx)

APÓS DOCS + TESTES 360
  4. Rogério: re-testa D, E, C com prompt v2.0 (T1, T3)
  5. Rogério: testa G, H, B, X (T2)
  6. Daniel: M5 — expansões v2.8 (após T1–T3)
  7. Rogério: testa expansões + Fallback A (T4, T5)

PARALELO
  8. Daniel:  L1 (FAQ fixa vs IA) — alinhamento com Rogério
  9. Rogério: L2 (produção dos materiais)

APÓS TESTES
 10. Daniel + Rogério: PB1–PB6 (lojas)
 11. Daniel: I2, I3 (dashboard + alertas)
 12. Equipa: T6 — piloto 50 usuários
```

---

## Documentos necessários para desbloquear tarefas

| Documento | Desbloqueia |
|---|---|
| `Jethro_Onboarding_v2_0.docx` | O1, O2, O3, O4, O5 |
| `Jethro_Fallback_A_Spec_Mensagens.docx` | M1 |
| `Jethro_Doc5_v2_0.docx` | Validação de P1/P2 (confirmar se backend já está alinhado) |
| `Jethro_Tarefas_Biblioteca.docx` | L2 (Rogério produz, Daniel sobe) |
| `Jethro_Previsibilidade_Custo_IA.docx` | I2, I3 |

---

*Jethro Mentor PBN · Equipa: Rogério Teixeira, Pollianna Machado, Daniel Lopes*
