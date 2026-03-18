import type { FastifyRequest } from 'fastify';

import { env } from '../config/env.js';
import { AppError } from './errors.js';

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitRecord>();

function getClientKey(request: FastifyRequest) {
  return request.ip || 'unknown';
}

export async function submissionRateLimitPreHandler(request: FastifyRequest) {
  const key = getClientKey(request);
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + env.SUBMISSION_RATE_LIMIT_WINDOW_MS,
    });
    return;
  }

  if (existing.count >= env.SUBMISSION_RATE_LIMIT_MAX) {
    throw new AppError(
      'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.',
      429,
      'RATE_LIMIT_EXCEEDED',
      {
        resetAt: new Date(existing.resetAt).toISOString(),
      },
      true
    );
  }

  existing.count += 1;
}
