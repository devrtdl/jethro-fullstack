import type { FastifyInstance } from 'fastify';

import { successResponse } from '../lib/api-response.js';
import { ratingInputSchema } from '../domain/ratings/schemas.js';
import { createRatingsService } from '../domain/ratings/service.js';

const ratingsServicePromise = createRatingsService();

export async function registerRatingRoutes(app: FastifyInstance) {
  app.post('/diagnostic-ratings', async (request, reply) => {
    const ratingsService = await ratingsServicePromise;
    const payload = ratingInputSchema.parse(request.body);
    const result = await ratingsService.saveRating(payload);
    return reply.code(201).send(successResponse(result));
  });
}
