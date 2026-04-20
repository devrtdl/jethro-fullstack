import { createClient } from '@supabase/supabase-js';
import type { FastifyRequest } from 'fastify';

import { env } from '../config/env.js';
import { getDbPool } from './db.js';
import { AppError } from './errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function userAuthPreHandler(request: FastifyRequest) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError('Autenticacao nao configurada.', 500, 'AUTH_UNCONFIGURED');
  }

  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Token de autenticacao ausente.', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.slice(7);

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new AppError('Token invalido ou expirado.', 401, 'UNAUTHORIZED');
  }

  const authUser = data.user;

  const pool = getDbPool();

  // Tenta por auth_id primeiro, fallback por email
  let userRow = await pool
    .query<{ id: string }>('SELECT id FROM users WHERE auth_id = $1 LIMIT 1', [authUser.id])
    .then((r) => r.rows[0] ?? null);

  if (!userRow && authUser.email) {
    userRow = await pool
      .query<{ id: string }>('SELECT id FROM users WHERE email = $1 LIMIT 1', [authUser.email])
      .then((r) => r.rows[0] ?? null);

    // Backfill auth_id para chamadas futuras
    if (userRow) {
      await pool.query('UPDATE users SET auth_id = $1 WHERE id = $2', [authUser.id, userRow.id]).catch(() => {});
    }
  }

  if (!userRow) {
    // Auto-create user on first authenticated request
    const newUser = await pool
      .query<{ id: string }>(
        `INSERT INTO users (email, auth_id, auth_provider, status)
         VALUES ($1, $2, 'email', 'active')
         ON CONFLICT (email) DO UPDATE SET auth_id = $2, status = 'active'
         RETURNING id`,
        [authUser.email ?? `${authUser.id}@unknown`, authUser.id]
      )
      .then((r) => r.rows[0] ?? null);

    if (!newUser) {
      throw new AppError('Nao foi possivel criar o utilizador.', 500, 'USER_CREATE_FAILED');
    }
    userRow = newUser;
  }

  request.userId = userRow.id;
}
