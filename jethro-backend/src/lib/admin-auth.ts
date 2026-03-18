import type { FastifyRequest } from 'fastify';

import { env } from '../config/env.js';
import { AppError } from './errors.js';

export async function adminAuthPreHandler(request: FastifyRequest) {
  const providedKey = request.headers['x-admin-api-key'];

  if (providedKey !== env.ADMIN_API_KEY) {
    throw new AppError(
      'Chave administrativa ausente ou invalida.',
      401,
      'ADMIN_UNAUTHORIZED'
    );
  }
}
