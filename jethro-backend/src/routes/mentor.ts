import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { successResponse } from '../lib/api-response.js';
import { userAuthPreHandler } from '../lib/user-auth.js';
import { createMentorChat } from '../domain/mentor/service.js';

const mentorChatSchema = z.object({
  sessionId: z.string().min(1).max(100),
  message: z.string().min(1).max(4000),
});

export async function registerMentorRoutes(app: FastifyInstance) {
  app.post(
    '/mentor/chat',
    { preHandler: userAuthPreHandler },
    async (request) => {
      const { sessionId, message } = mentorChatSchema.parse(request.body);
      const result = await createMentorChat(request.userId!, sessionId, message);
      return successResponse(result);
    }
  );
}
