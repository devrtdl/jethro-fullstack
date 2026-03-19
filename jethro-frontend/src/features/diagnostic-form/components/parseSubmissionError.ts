type FieldErrors = Record<string, string>;

type ParsedError = {
  fieldErrors: FieldErrors;
  globalError: string;
  retryable: boolean;
};

export function parseSubmissionError(error: unknown): ParsedError {
  const fallback: ParsedError = {
    fieldErrors: {},
    globalError: 'Ocorreu um erro inesperado. Tente novamente.',
    retryable: true,
  };

  if (!(error instanceof Error)) return fallback;

  const err = error as any;
  const globalError = err.message ?? fallback.globalError;
  const retryable = err.retryable ?? true;
  const fieldErrors: FieldErrors = {};

  // tenta ler erros por campo vindos do backend
  // ex: details: { fields: { email: 'Email já cadastrado.' } }
  if (err.details && typeof err.details === 'object') {
    const fields = err.details.fields;
    if (fields && typeof fields === 'object') {
      for (const [slug, message] of Object.entries(fields)) {
        if (typeof message === 'string') {
          fieldErrors[slug] = message;
        }
      }
    }
  }

  return { fieldErrors, globalError, retryable };
}