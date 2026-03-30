# Jethro Delivery Checkpoints

Objetivo: chegar na apresentacao de 30/03/2026 as 14:00 com o fluxo principal do produto pronto ate o paywall, deixando o paywall como mock navegavel.

## Escopo Fechado

Production ready:
- Auth no app com email e senha
- Base preparada para login social
- Diagnostico nativo no app
- Persistencia das respostas no backend
- Classificacao por modelo A-I
- Resultado do diagnostico no app
- Banco e backend alinhados ao dominio principal
- Seeds de perguntas, modelos, mensagens, action library, devocionais
- Estrutura inicial da Alma para RAG

Mockado por enquanto:
- Paywall
- Assinatura real / billing

Fora do corte desta entrega:
- Onboarding conversacional completo
- Geracao final automatica do plano de 24 semanas
- RAG em producao com busca final

## Checkpoints

### Bloco 1 - Hoje
- [x] Consolidar schema alvo do banco
- [x] Criar migrations iniciais do dominio novo
- [x] Criar seeds para perguntas do formulario
- [x] Criar seeds para modelos A-I
- [x] Criar seeds para mensagens V1/V2/V3
- [x] Criar seeds para acoes library
- [x] Criar seeds para devocionais
- [x] Criar estrutura base para documentos/chunks de RAG

### Bloco 2 - Amanha 07:00-09:00
- [x] Ajustar auth do app para email/senha
- [x] Preparar estrutura para login social
- [ ] Criar fluxo de onboarding inicial do app apos login
- [x] Portar o diagnostico do frontend web para o app mobile

### Bloco 3 - Amanha 09:00-10:30
- [x] Conectar diagnostico nativo ao backend
- [ ] Salvar respostas vinculadas ao usuario
- [ ] Executar classificacao do modelo no backend
- [x] Exibir tela de resultado no app

### Bloco 4 - Amanha 10:30-11:30
- [x] Criar tela mock de paywall
- [x] Encadear navegacao resultado -> paywall
- [ ] Preparar dados iniciais do plano semanal no dominio
- [ ] Validar estados de erro e loading principais

### Bloco 5 - Amanha 11:30-12:00
- [ ] Rodar verificacoes finais
- [ ] Revisar fluxo de demo ponta a ponta
- [ ] Ajustar textos e pontos visuais mais evidentes
- [ ] Preparar roteiro da apresentacao

## Ordem de Execucao Recomendada

1. Banco e backend
2. Seeds de conteudo
3. Auth
4. Diagnostico nativo
5. Resultado
6. Paywall mock
7. Revisao final de demo

## Criterio de Pronto Para Demo

- Usuario cria conta ou entra
- Usuario responde o diagnostico no app
- Backend salva respostas e classifica modelo
- App mostra resultado coerente com mensagem do modelo
- App leva para paywall mock
- Banco contem tabelas e seeds principais do produto

## Riscos Principais

- Login social pode exigir configuracao externa adicional
- Seeds da Alma para RAG podem ser grandes demais para fechar com parsing perfeito na primeira passada
- Plano semanal completo pode precisar ficar como estrutura pronta, sem geracao total

## Decisao de Escopo se o tempo apertar

Prioridade maxima:
- Auth email/senha
- Diagnostico nativo
- Resultado
- Tabelas e seeds principais

Prioridade media:
- Paywall mock
- Estrutura de RAG

Prioridade baixa para esta entrega:
- Login social completo
- Regras completas do plano semanal
