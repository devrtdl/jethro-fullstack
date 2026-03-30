import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { adminAuthPreHandler } from '../lib/admin-auth.js';
import { successResponse } from '../lib/api-response.js';
import { submissionRateLimitPreHandler } from '../lib/rate-limit.js';
import {
  diagnosticLookupSchema,
  eventInputSchema,
  formAccessRequestSchema,
  formInputSchema,
  formUpdateSchema,
  questionInputSchema,
  submissionInputSchema,
} from '../domain/forms/schemas.js';
import { createFormsService } from '../domain/forms/service.js';

const formsServicePromise = createFormsService();

export async function registerFormRoutes(app: FastifyInstance) {
  app.get('/admin/forms', { preHandler: adminAuthPreHandler }, async () => {
    const formsService = await formsServicePromise;
    return successResponse(await formsService.listForms());
  });

  app.post('/admin/forms', { preHandler: adminAuthPreHandler }, async (request, reply) => {
    const formsService = await formsServicePromise;
    const payload = formInputSchema.parse(request.body);
    const form = await formsService.createForm(payload);
    return reply.code(201).send(successResponse(form));
  });

  app.get('/admin/forms/:formId', { preHandler: adminAuthPreHandler }, async (request) => {
    const formsService = await formsServicePromise;
    const params = zodParams(request.params);
    const form = await formsService.getFormOrThrow(params.formId);
    return successResponse(form);
  });

  app.patch('/admin/forms/:formId', { preHandler: adminAuthPreHandler }, async (request) => {
    const formsService = await formsServicePromise;
    const params = zodParams(request.params);
    const payload = formUpdateSchema.parse(request.body);
    const form = await formsService.updateForm(params.formId, payload);
    return successResponse(form);
  });

  app.delete('/admin/forms/:formId', { preHandler: adminAuthPreHandler }, async (request, reply) => {
    const formsService = await formsServicePromise;
    const params = zodParams(request.params);
    await formsService.deleteForm(params.formId);
    return reply.code(204).send();
  });

  app.post(
    '/admin/forms/:formId/questions',
    { preHandler: adminAuthPreHandler },
    async (request, reply) => {
      const formsService = await formsServicePromise;
      const params = zodParams(request.params);
      const payload = questionInputSchema.parse(request.body);
      const question = await formsService.createQuestion(params.formId, payload);
      return reply.code(201).send(successResponse(question));
    }
  );

  app.patch(
    '/admin/forms/:formId/questions/:questionId',
    { preHandler: adminAuthPreHandler },
    async (request) => {
      const formsService = await formsServicePromise;
      const params = zodQuestionParams(request.params);
      const payload = questionInputSchema.partial().parse(request.body);
      const question = await formsService.updateQuestion(params.formId, params.questionId, payload);
      return successResponse(question);
    }
  );

  app.delete(
    '/admin/forms/:formId/questions/:questionId',
    { preHandler: adminAuthPreHandler },
    async (request, reply) => {
      const formsService = await formsServicePromise;
      const params = zodQuestionParams(request.params);
      await formsService.deleteQuestion(params.formId, params.questionId);
      return reply.code(204).send();
    }
  );

  app.get('/admin/forms/:formId/analytics/summary', { preHandler: adminAuthPreHandler }, async (request) => {
    const formsService = await formsServicePromise;
    const params = zodParams(request.params);
    const summary = await formsService.getAnalyticsSummary(params.formId);
    return successResponse(summary);
  });

  app.get('/admin/forms/:formId/results', { preHandler: adminAuthPreHandler }, async (request) => {
    const formsService = await formsServicePromise;
    const params = zodParams(request.params);
    const results = await formsService.getFormResults(params.formId);
    return successResponse(results);
  });

  app.get('/admin/forms/:formId/results/:submissionId', { preHandler: adminAuthPreHandler }, async (request) => {
    const formsService = await formsServicePromise;
    const params = zodResultParams(request.params);
    const result = await formsService.getFormResultById(params.formId, params.submissionId);
    return successResponse(result);
  });

  app.get('/forms/:slug', async (request) => {
    const formsService = await formsServicePromise;
    const params = zodSlugParams(request.params);
    const form = await formsService.getPublicForm(params.slug);
    return successResponse(form);
  });

  app.post(
    '/forms/:slug/submissions',
    { preHandler: submissionRateLimitPreHandler },
    async (request, reply) => {
      const formsService = await formsServicePromise;
      const params = zodSlugParams(request.params);
      const payload = submissionInputSchema.parse(request.body);
      const result = await formsService.submitForm(params.slug, payload);
      return reply.code(201).send(successResponse(result));
    }
  );

  app.post('/forms/:slug/events', { preHandler: submissionRateLimitPreHandler }, async (request, reply) => {
    const formsService = await formsServicePromise;
    const params = zodSlugParams(request.params);
    const payload = eventInputSchema.parse(request.body);
    const event = await formsService.trackEvent(params.slug, payload);
    return reply.code(201).send(successResponse(event));
  });

  app.post('/auth/form-access/request', async (request) => {
    const formsService = await formsServicePromise;
    const payload = formAccessRequestSchema.parse(request.body);
    return successResponse(await formsService.prepareFormAccess(payload));
  });

  app.post('/auth/form-access/diagnostic', async (request) => {
    const formsService = await formsServicePromise;
    const payload = diagnosticLookupSchema.parse(request.body);
    return successResponse(await formsService.getLatestDiagnosticByEmail(payload));
  });
}

function zodParams(input: unknown) {
  return paramSchema.parse(input);
}

function zodSlugParams(input: unknown) {
  return slugParamSchema.parse(input);
}

function zodQuestionParams(input: unknown) {
  return questionParamSchema.parse(input);
}

function zodResultParams(input: unknown) {
  return resultParamSchema.parse(input);
}

const paramSchema = z.object({
  formId: z.string().min(1),
  questionId: z.string().min(1).optional(),
});

const slugParamSchema = z.object({
  slug: z.string().min(1),
});

const questionParamSchema = z.object({
  formId: z.string().min(1),
  questionId: z.string().min(1),
});

const resultParamSchema = z.object({
  formId: z.string().min(1),
  submissionId: z.string().min(1),
});
