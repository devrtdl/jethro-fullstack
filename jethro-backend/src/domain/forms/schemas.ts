import { z } from 'zod';

export const formStatusSchema = z.enum(['draft', 'published', 'archived']);
export const questionTypeSchema = z.enum([
  'text',
  'textarea',
  'email',
  'number',
  'single_select',
  'phone',
  'money_range',
]);
export const questionPresentationSchema = z.enum(['input', 'textarea', 'radio', 'select', 'scale', 'phone']);

const jsonLiteralSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([jsonLiteralSchema, z.array(jsonValueSchema), z.record(z.string(), jsonValueSchema)])
);

const questionOptionInputSchema = z.object({
  id: z.string().min(1).optional(),
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
  order: z.coerce.number().int().nonnegative(),
  metadata: z.record(z.string(), jsonValueSchema).optional(),
});

const questionValidationInputSchema = z.object({
  minLength: z.coerce.number().int().positive().optional(),
  maxLength: z.coerce.number().int().positive().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  minWords: z.coerce.number().int().positive().optional(),
  pattern: z.string().min(1).optional(),
  integer: z.boolean().optional(),
});

const stepInputSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  order: z.coerce.number().int().nonnegative(),
});

const dynamicOptionsByCountrySchema = z.record(z.string(), z.array(questionOptionInputSchema));

export const questionInputSchema = z
  .object({
    id: z.string().min(1).optional(),
    stepId: z.string().min(1),
    slug: z.string().trim().min(1).regex(/^[a-z0-9-_]+$/),
    label: z.string().trim().min(1),
    helperText: z.string().trim().min(1).optional(),
    placeholder: z.string().trim().min(1).optional(),
    type: questionTypeSchema,
    presentation: questionPresentationSchema.default('input'),
    required: z.boolean().default(true),
    internalOnly: z.boolean().optional(),
    order: z.coerce.number().int().nonnegative(),
    options: z.array(questionOptionInputSchema).default([]),
    validation: questionValidationInputSchema.default({}),
    metadata: z.record(z.string(), jsonValueSchema).optional(),
    dynamicOptionsByCountry: dynamicOptionsByCountrySchema.optional(),
  })
  .superRefine((question, ctx) => {
    const singleSelectTypes = new Set(['single_select', 'money_range']);

    if (singleSelectTypes.has(question.type) && question.options.length === 0 && !question.dynamicOptionsByCountry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Perguntas de selecao precisam de opcoes fixas ou dinamicas.',
      });
    }

    if (question.type === 'phone' && question.presentation !== 'phone') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['presentation'],
        message: 'Perguntas do tipo phone devem usar presentation phone.',
      });
    }
  });

export const formInputSchema = z.object({
  slug: z.string().trim().min(3).regex(/^[a-z0-9-_]+$/),
  title: z.string().trim().min(3),
  description: z.string().trim().min(1).optional(),
  status: formStatusSchema.default('draft'),
  steps: z.array(stepInputSchema).min(1),
  questions: z.array(questionInputSchema).min(1),
  settings: z.object({
    successTitle: z.string().trim().min(1).default('Recebemos suas respostas'),
    successMessage: z.string().trim().min(1).default('Seu diagnostico foi enviado com sucesso.'),
    errorMessage: z.string().trim().min(1).default('Nao foi possivel enviar agora. Tente novamente.'),
    allowRetry: z.boolean().default(true),
    webhookUrl: z.url().optional(),
    webhookSecret: z.string().trim().min(8).optional(),
  }),
});

export const formUpdateSchema = formInputSchema.partial();

export const submissionInputSchema = z.object({
  sessionId: z.string().trim().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().trim().min(1),
        value: jsonValueSchema,
      })
    )
    .min(1),
});

export const eventInputSchema = z.object({
  sessionId: z.string().trim().min(1),
  type: z.enum(['form_started', 'step_viewed', 'form_abandoned']),
  stepId: z.string().trim().min(1).optional(),
});

export type FormInput = z.infer<typeof formInputSchema>;
export type FormUpdateInput = z.infer<typeof formUpdateSchema>;
export type QuestionInput = z.infer<typeof questionInputSchema>;
export type SubmissionInput = z.infer<typeof submissionInputSchema>;
export type EventInput = z.infer<typeof eventInputSchema>;
