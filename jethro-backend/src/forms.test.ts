import test from 'node:test';
import assert from 'node:assert/strict';

process.env.APP_ENV = 'test';
delete process.env.DATABASE_URL;

const { createApp } = await import('./app.js');

const adminHeaders = {
  'x-admin-api-key': 'dev-admin-key',
};

// Cenário Modelo C: propósito forte (Q6=A, Q7=A) + cobra frequentemente abaixo (qPrec=C)
// + canal único Instagram (q15=B) → F dispara mas exceção ativa (precificacaoSevera + propositoForte)
// → motor pula F e captura C.
const validDiagnosticAnswers = [
  { questionId: 'question_nome_completo', value: 'Daniel Lopes' },
  { questionId: 'question_area_atuacao', value: 'Consultoria de negocios' },
  {
    questionId: 'question_whatsapp',
    value: {
      numero: '+5511999999999',
      pais_codigo: '+55',
      pais_iso: 'BR',
    },
  },
  { questionId: 'question_email', value: 'daniel@example.com' },
  { questionId: 'question_fase_negocio', value: 'C' },            // Em crescimento (1-3 anos)
  { questionId: 'question_conexao_dons', value: 'A' },            // Sim, totalmente
  { questionId: 'question_proposito_negocio', value: 'A' },       // Sim, muito claro
  { questionId: 'question_estrutura_negocio', value: 'B' },       // Em desenvolvimento
  { questionId: 'question_organizacao_financeira', value: 'B' },  // Básica
  { questionId: 'question_formalizacao', value: 'formalizada' },
  {
    questionId: 'question_faturamento_mensal',
    value: {
      faixa: '5k_20k',
      moeda: 'BRL',
      pais: 'BR',
    },
  },
  { questionId: 'question_precificacao', value: 'C' },            // Frequentemente cobra abaixo — aciona exceção de F → C
  { questionId: 'question_lucro_crescimento', value: 'B' },       // Estável, sem crescimento
  {
    questionId: 'question_objetivo_futuro',
    value: 'Quero estruturar melhor o negocio, aumentar receita e ganhar previsibilidade comercial.',
  },
  {
    questionId: 'question_desafios',
    value: 'Preciso vender com consistencia, organizar processos internos e melhorar meu financeiro.',
  },
  { questionId: 'question_canal_aquisicao', value: 'B' },         // Instagram (canal único → F seria acionado, mas exceção aplica)
  { questionId: 'question_capacidade_operacional', value: 'B' },  // Precisaria reorganizar algumas partes
  { questionId: 'question_horas_semana', value: 'C' },            // 20-40h
];

test('returns the published public form with 17 documented questions and dynamic runtime metadata', async () => {
  const app = createApp();

  const response = await app.inject({
    method: 'GET',
    url: '/forms/diagnostico-inicial',
  });

  assert.equal(response.statusCode, 200);

  const body = response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.slug, 'diagnostico-inicial');
  assert.equal(body.data.steps.length, 4);
  assert.equal(body.data.questions.length, 17);
  assert.ok(body.data.runtime.revenueBandsByCountry.BR);

  await app.close();
});

test('submits the full diagnostic payload with whatsapp and revenue objects and returns calculated score', async () => {
  const app = createApp();

  const response = await app.inject({
    method: 'POST',
    url: '/forms/diagnostico-inicial/submissions',
    payload: {
      sessionId: 'session-success',
      answers: validDiagnosticAnswers,
    },
  });

  assert.equal(response.statusCode, 201);

  const body = response.json();
  assert.equal(body.success, true);
  assert.equal(body.data.payload.event, 'diagnostic.form.submitted');
  assert.equal(body.data.payload.respondent.email, 'daniel@example.com');
  assert.equal(body.data.payload.respondent.whatsapp.pais_iso, 'BR');
  assert.equal(body.data.payload.answersBySlug.faturamento_mensal.moeda, 'BRL');
  assert.equal(typeof body.data.derived.score, 'number');
  assert.equal(body.data.diagnostic.modelCode, 'C');
  assert.equal(body.data.delivery.status, 'skipped');

  await app.close();
});

test('rejects invalid full name submissions with a clear validation error', async () => {
  const app = createApp();

  const response = await app.inject({
    method: 'POST',
    url: '/forms/diagnostico-inicial/submissions',
    payload: {
      sessionId: 'session-invalid-name',
      answers: validDiagnosticAnswers.map((answer) =>
        answer.questionId === 'question_nome_completo' ? { ...answer, value: 'Daniel 123' } : answer
      ),
    },
  });

  assert.equal(response.statusCode, 400);

  const body = response.json();
  assert.equal(body.success, false);
  assert.equal(body.error.code, 'INVALID_TEXT_PATTERN');

  await app.close();
});

test('rejects revenue band incompatible with whatsapp country', async () => {
  const app = createApp();

  const response = await app.inject({
    method: 'POST',
    url: '/forms/diagnostico-inicial/submissions',
    payload: {
      sessionId: 'session-invalid-revenue',
      answers: validDiagnosticAnswers.map((answer) =>
        answer.questionId === 'question_faturamento_mensal'
          ? {
              ...answer,
              value: {
                faixa: '2k_10k',
                moeda: 'EUR',
                pais: 'PT',
              },
            }
          : answer
      ),
    },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error.code, 'INVALID_REVENUE_RANGE');

  await app.close();
});

test('tracks start and abandonment events and exposes average score in analytics', async () => {
  const app = createApp();

  await app.inject({
    method: 'POST',
    url: '/forms/diagnostico-inicial/events',
    payload: {
      sessionId: 'analytics-session-1',
      type: 'form_started',
      stepId: 'step_identificacao',
    },
  });

  await app.inject({
    method: 'POST',
    url: '/forms/diagnostico-inicial/events',
    payload: {
      sessionId: 'analytics-session-1',
      type: 'form_abandoned',
      stepId: 'step_identificacao',
    },
  });

  const listResponse = await app.inject({
    method: 'GET',
    url: '/admin/forms',
    headers: adminHeaders,
  });
  const formId = listResponse.json().data.find((item: { slug: string }) => item.slug === 'diagnostico-inicial').id;

  await app.inject({
    method: 'POST',
    url: '/forms/diagnostico-inicial/submissions',
    payload: {
      sessionId: 'analytics-session-2',
      answers: validDiagnosticAnswers,
    },
  });

  const summaryResponse = await app.inject({
    method: 'GET',
    url: `/admin/forms/${formId}/analytics/summary`,
    headers: adminHeaders,
  });

  assert.equal(summaryResponse.statusCode, 200);

  const body = summaryResponse.json();
  assert.equal(body.success, true);
  assert.equal(body.data.startedSessions >= 1, true);
  assert.equal(body.data.abandonedSessions >= 1, true);
  assert.equal(typeof body.data.averageScore, 'number');

  await app.close();
});

test('lists admin results and opens submission detail for a specific answer', async () => {
  const app = createApp();

  const submitResponse = await app.inject({
    method: 'POST',
    url: '/forms/diagnostico-inicial/submissions',
    payload: {
      sessionId: 'results-session-1',
      answers: validDiagnosticAnswers,
    },
  });

  assert.equal(submitResponse.statusCode, 201);

  const listFormsResponse = await app.inject({
    method: 'GET',
    url: '/admin/forms',
    headers: adminHeaders,
  });

  const formId = listFormsResponse.json().data.find((item: { slug: string }) => item.slug === 'diagnostico-inicial').id;

  const resultsResponse = await app.inject({
    method: 'GET',
    url: `/admin/forms/${formId}/results`,
    headers: adminHeaders,
  });

  assert.equal(resultsResponse.statusCode, 200);

  const resultsBody = resultsResponse.json();
  assert.equal(resultsBody.success, true);
  assert.equal(Array.isArray(resultsBody.data), true);
  assert.equal(resultsBody.data.length >= 1, true);
  assert.equal(resultsBody.data[0].respondent.email, 'daniel@example.com');
  assert.equal(typeof resultsBody.data[0].derived.score, 'number');

  const submissionId = resultsBody.data[0].id;

  const detailResponse = await app.inject({
    method: 'GET',
    url: `/admin/forms/${formId}/results/${submissionId}`,
    headers: adminHeaders,
  });

  assert.equal(detailResponse.statusCode, 200);

  const detailBody = detailResponse.json();
  assert.equal(detailBody.success, true);
  assert.equal(detailBody.data.id, submissionId);
  assert.equal(detailBody.data.answersBySlug.email, 'daniel@example.com');
  assert.equal(detailBody.data.payload.respondent.whatsapp.pais_iso, 'BR');

  await app.close();
});
