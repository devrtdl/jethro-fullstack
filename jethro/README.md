# Jethro Mobile

Base mobile em React Native com Expo, Expo Router e uma camada inicial de integracao com API preparada para dev e prod.

## Requisitos

- Node.js 20+
- npm 10+
- Expo Go no celular
- Expo CLI disponivel no PC via `npx expo` ou, se preferir global, `npm install -g expo`

## Setup local

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

3. Ajuste a URL da API no `.env`.

- Em emulador Android, `http://10.0.2.2:<porta>`
- Em iOS Simulator, `http://localhost:<porta>`
- Em dispositivo fisico, use o IP da maquina na mesma rede, por exemplo `http://192.168.0.10:3000`

4. Inicie o app:

```bash
npm run start
```

5. Abra no Expo Go:

- Escaneie o QR code com o app Expo Go no dispositivo
- Ou use `a` / `i` no terminal para abrir em emuladores

## Variaveis de ambiente

Veja `.env.example`.

- `EXPO_PUBLIC_API_URL`: URL base da API
- `EXPO_PUBLIC_API_TIMEOUT_MS`: timeout padrao das requisicoes
- `EXPO_PUBLIC_API_PORT`: porta usada no fallback de dev quando a URL nao estiver definida
- `EXPO_PUBLIC_APP_ENV`: `development` ou `production`

## Estrutura base

```text
app/                    rotas do Expo Router
src/screens/            composicao das telas
src/components/         componentes reutilizaveis
src/hooks/              hooks de estado e integracao
src/services/           cliente HTTP e services de API
src/config/             configuracao por ambiente
src/types/              tipos compartilhados
```

## Qualidade

```bash
npm run lint
npm run typecheck
```

## Health check

A tela inicial faz uma chamada para `GET /health/check` usando a camada `service`, com timeout e tratamento padronizado de erro HTTP.

Se a API nao estiver acessivel, o app exibe erro amigavel e permite tentar novamente.
