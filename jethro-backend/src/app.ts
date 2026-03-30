import Fastify from 'fastify';
import { ZodError } from 'zod';

import { env } from './config/env.js';
import { errorResponse } from './lib/api-response.js';
import { closeDbPool } from './lib/db.js';
import { isAppError } from './lib/errors.js';
import { registerAuthBridgeRoutes } from './routes/auth-bridge.js';
import { registerFormRoutes } from './routes/forms.js';
import { registerHealthRoutes } from './routes/health.js';

export function createApp() {
  const app = Fastify({
    logger: true,
  });

  app.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin;
    const allowOrigin = origin === env.FRONTEND_ORIGIN ? origin : env.FRONTEND_ORIGIN;

    reply.header('Access-Control-Allow-Origin', allowOrigin);
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, x-admin-api-key');
  });

  app.options('/*', async (_request, reply) => {
    return reply.code(204).send();
  });

  app.register(registerAuthBridgeRoutes);
  app.register(registerHealthRoutes);
  app.register(registerFormRoutes);
  app.addHook('onClose', async () => {
    await closeDbPool();
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (error instanceof ZodError) {
      return reply.code(400).send(
        errorResponse({
          code: 'VALIDATION_ERROR',
          message: 'Payload invalido.',
          details: error.issues,
        })
      );
    }

    if (isAppError(error)) {
      return reply.code(error.statusCode).send(
        errorResponse({
          code: error.code,
          message: error.message,
          details: error.details,
          retryable: error.retryable,
        })
      );
    }

    return reply.code(500).send(
      errorResponse({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro interno do servidor.',
        retryable: false,
      })
    );
  });

  return app;
}
