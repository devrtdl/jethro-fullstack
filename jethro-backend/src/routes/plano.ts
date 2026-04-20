import type { FastifyInstance } from 'fastify';

import { successResponse } from '../lib/api-response.js';
import { userAuthPreHandler } from '../lib/user-auth.js';
import { generatePlano } from '../domain/plano/service.js';

export async function registerPlanoRoutes(app: FastifyInstance) {
  /**
   * POST /plano/generate
   * Gera o plano de 24 semanas com Claude + Alma + onboarding JSON.
   * Idempotente: se já existe plano, devolve o existente.
   */
  app.post('/plano/generate', { preHandler: userAuthPreHandler }, async (request) => {
    const userId = request.userId!;
    const result = await generatePlano(userId);
    return successResponse(result);
  });
}
