# Jethro Backend

API do projeto Jethro com suporte a formularios multi-step, validacao forte, webhook de processamento e monitoramento minimo de abandono.

## Requisitos

- Node.js 20+
- npm 10+

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run db:migrate
```

## Endpoints principais

- `GET /health/check`
- `GET /forms/:slug`
- `POST /forms/:slug/submissions`
- `POST /forms/:slug/events`
- `GET /admin/forms`
- `POST /admin/forms`
- `PATCH /admin/forms/:formId`
- `DELETE /admin/forms/:formId`
- `POST /admin/forms/:formId/questions`
- `PATCH /admin/forms/:formId/questions/:questionId`
- `DELETE /admin/forms/:formId/questions/:questionId`
- `GET /admin/forms/:formId/analytics/summary`

## Seguranca e validacao

- Rotas admin protegidas por header `x-admin-api-key`
- Validacao de payload com Zod
- Tipos suportados por pergunta: `text`, `email`, `number`, `single_select`
- Rate limit basico em submissao e tracking de eventos
- Webhook com assinatura opcional via `x-jethro-signature`

## Supabase

- Configure `DATABASE_URL` com a connection string Postgres do Supabase
- Rode `npm run db:migrate` para criar `forms`, `form_submissions` e `form_events`
- Com `DATABASE_URL` presente, o backend usa Postgres real; sem ela, cai no repositório em memoria

## Payload de saida para processamento

```json
{
  "event": "diagnostic.form.submitted",
  "submittedAt": "2026-03-17T19:00:00.000Z",
  "form": {
    "id": "form_xxx",
    "slug": "diagnostico-inicial",
    "title": "Diagnostico Inicial"
  },
  "respondent": {
    "email": "usuario@dominio.com"
  },
  "answers": [
    {
      "questionId": "question_email",
      "slug": "email",
      "label": "Qual e o seu melhor email?",
      "type": "email",
      "value": "usuario@dominio.com"
    }
  ],
  "answersBySlug": {
    "email": "usuario@dominio.com"
  }
}
```

## Seed inicial

- Formulario publicado: `diagnostico-inicial`
- Cenarios cobertos em teste: sucesso, email invalido, falha de webhook com retry e abandono inicial
