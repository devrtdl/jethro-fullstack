export function successResponse<T>(data: T, meta?: Record<string, unknown>) {
  return {
    success: true as const,
    data,
    ...(meta ? { meta } : {}),
  };
}

export function errorResponse(input: {
  code: string;
  message: string;
  details?: unknown;
  retryable?: boolean;
}) {
  return {
    success: false as const,
    error: {
      code: input.code,
      message: input.message,
      retryable: input.retryable ?? false,
      ...(input.details ? { details: input.details } : {}),
    },
  };
}
