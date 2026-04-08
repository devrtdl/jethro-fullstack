import type { PoolClient } from 'pg';

import { getDbPool } from '../../lib/db.js';
import { createId } from '../../lib/id.js';
import type { z } from 'zod';
import type { ratingInputSchema } from './schemas.js';

type RatingInput = z.infer<typeof ratingInputSchema>;

export async function createRatingsService() {
  const pool = await getDbPool();

  async function saveRating(input: RatingInput): Promise<{ id: string }> {
    const client: PoolClient = await pool.connect();
    try {
      const id = createId('rating');
      await client.query(
        `insert into diagnostic_ratings (id, submission_id, email, stars)
         values ($1, $2, lower($3), $4)`,
        [id, input.submissionId, input.email, input.stars]
      );
      return { id };
    } finally {
      client.release();
    }
  }

  return { saveRating };
}
