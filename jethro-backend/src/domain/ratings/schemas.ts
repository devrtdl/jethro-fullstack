import { z } from 'zod';

export const ratingInputSchema = z.object({
  submissionId: z.string().trim().min(1),
  email: z.string().trim().email(),
  stars: z.number().int().min(1).max(5),
});
