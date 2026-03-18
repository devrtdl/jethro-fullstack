import type { FastifyInstance } from 'fastify';

import { env } from '../config/env.js';

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health/check', async () => {
    return {
      status: 'ok',
      message: 'Jethro backend is healthy.',
      environment: env.APP_ENV,
      timestamp: new Date().toISOString(),
    };
  });
}
