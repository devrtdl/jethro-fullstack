import { Pool } from 'pg';

import { env } from '../config/env.js';

let pool: Pool | undefined;

export function hasDatabaseConfig() {
  return Boolean(env.DATABASE_URL);
}

export function getDbPool() {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL nao configurada.');
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.DATABASE_SSL_REJECT_UNAUTHORIZED ? { rejectUnauthorized: true } : { rejectUnauthorized: false },
    });
  }

  return pool;
}

export async function closeDbPool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
