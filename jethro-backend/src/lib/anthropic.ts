import Anthropic from '@anthropic-ai/sdk';

import { env } from '../config/env.js';

let client: Anthropic | undefined;

export function hasAnthropicConfig() {
  return Boolean(env.ANTHROPIC_API_KEY);
}

export function getAnthropicClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY nao configurada.');
  }
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}
