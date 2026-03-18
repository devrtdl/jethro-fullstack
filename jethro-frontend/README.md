# Jethro Frontend

Frontend inicial do formulario de diagnostico do Jethro.

## Objetivo

- Dar uma base de projeto organizada
- Consumir o backend atual via `GET /forms/:slug` e `POST /forms/:slug/submissions`
- Implementar multi-step, validacao local basica 
- Deixar uma base parcial para continuar sem precisar refazer arquitetura

## Estrutura sugerida

- `src/types/form.ts`: contratos do backend
- `src/lib/api.ts`: client HTTP pequeno
- `src/features/diagnostic-form/useDiagnosticForm.ts`: regra de negocio do form
- `src/features/diagnostic-form/DiagnosticFormPage.tsx`: pagina principal
- `src/features/diagnostic-form/components/`: componentes simples e substituiveis

## Observacoes para Pollynerd

- A validacao final continua no backend
- O campo de telefone aqui esta simplificado; voce pode trocar depois por `react-phone-input-2`
- O campo de faturamento depende do `pais_iso` vindo do WhatsApp
- O `score` nao aparece no form; ele volta na resposta do backend
- O objetivo aqui foi subir a espinha dorsal do fluxo e deixar os pontos de extensao claros

## TODOs

- `TODO Pollynerd 1 - melhorar telefone`
  HINT: trocar os 3 campos simples por um componente melhor, mas sem mudar o payload final que o backend espera.
  O backend espera:
  ```json
  {
    "numero": "+5511999999999",
    "pais_codigo": "+55",
    "pais_iso": "BR"
  }
  ```

- `TODO Pollynerd 2 - melhorar validacao local`
  HINT: hoje a validacao local esta basica de proposito.
  Pode evoluir para validar email, nome completo, min/max de texto e feedback por campo antes do submit.

- `TODO Pollynerd 3 - melhorar tratamento de erro`
  HINT: hoje o client so joga erro generico.
  O ideal e ler melhor o retorno do backend e mostrar mensagem util por campo ou por etapa.

- `TODO Pollynerd 4 - melhorar tela de confirmacao`
  HINT: a tela atual so prova o fluxo.
  Pode virar uma tela melhor com resumo, proximo passo e CTA.

- `TODO Pollynerd 5 - organizar melhor estado/API`
  HINT: se o fluxo crescer, vale subir fetch/cache para React Query ou uma camada parecida.

- `TODO Pollynerd 6 - polir UI`
  HINT: os componentes estao simples de proposito.
  A ideia aqui era deixar o fluxo montado primeiro e depois refinar layout, acessibilidade e estados visuais.

- `TODO Pollynerd 7 - subir a base visual com shadcn/ui ou similar`
  HINT: vale usar `shadcn/ui` ou alguma lib parecida do mercado para acelerar a camada visual.
  Prioridade aqui e padronizar `Button`, `Input`, `Textarea`, `Select`, `Card` e `Alert`.
  So nao quero que isso vire refactor grande de arquitetura nem quebra de contrato com o backend.

## Campos que precisa revisar/completar

- `Nome completo`
  HINT: hoje o fluxo ja envia esse campo, mas vale melhorar a validacao local para garantir nome e sobrenome antes do submit.

- `Telefone`
  HINT: esse e o campo mais sensivel do form.
  O backend espera `numero`, `pais_codigo` e `pais_iso`, entao qualquer troca de componente precisa preservar esse contrato.

- `Email`
  HINT: o campo existe, mas o ideal e ter validacao local melhor antes de bater no backend.

- `Faturamento mensal`
  HINT: esse campo depende do pais vindo do WhatsApp.
  Se mudar o componente ou a regra visual, nao pode quebrar essa dependencia.

- `Mensagens por campo`
  HINT: ainda falta amarrar melhor os erros por input.
  Hoje a base segura o fluxo, mas ainda nao esta com cara de formulario final.

## Cenarios de sucesso que precisa garantir

- `Cenario 1 - carregamento do formulario`
  HINT: a pagina precisa buscar `GET /forms/:slug`, montar as etapas e renderizar sem travar.

- `Cenario 2 - avancar entre etapas`
  HINT: o usuario precisa conseguir seguir no multi-step sem bloqueio indevido quando os campos minimos da etapa estiverem ok.

- `Cenario 3 - envio final com sucesso`
  HINT: no submit, o frontend precisa mandar `POST /forms/:slug/submissions` no formato esperado e mostrar a confirmacao.

- `Cenario 4 - retorno com score/dados finais`
  HINT: o backend devolve dados derivados.
  Mesmo que o score nao apareca agora, o frontend precisa estar preparado para consumir esse retorno sem quebrar.

## Cenarios de erro que precisa garantir

- `Cenario 1 - falha ao carregar o formulario`
  HINT: se `GET /forms/:slug` falhar, mostrar mensagem clara e opcao de tentar de novo.

- `Cenario 2 - validacao local incompleta`
  HINT: se o usuario tentar avancar ou enviar com campo obrigatorio vazio, o erro precisa aparecer de forma clara.

- `Cenario 3 - erro de validacao vindo do backend`
  HINT: quando o backend responder erro de email, telefone, nome ou faturamento, a tela precisa traduzir isso melhor.

- `Cenario 4 - falha de envio`
  HINT: se o submit falhar por erro de rede ou erro `502`, mostrar mensagem objetiva e liberar nova tentativa.

- `Cenario 5 - estado de loading`
  HINT: enquanto estiver buscando ou enviando, precisa travar a acao duplicada para evitar clique repetido e submit duplicado.
