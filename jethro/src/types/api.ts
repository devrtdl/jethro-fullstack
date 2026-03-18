export type ApiErrorCode =
  | 'TIMEOUT'
  | 'NETWORK'
  | 'HTTP_ERROR'
  | 'PARSE_ERROR'
  | 'UNKNOWN_ERROR';

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number | null;
  details?: unknown;

  constructor(message: string, options: { code: ApiErrorCode; status?: number | null; details?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.code = options.code;
    this.status = options.status ?? null;
    this.details = options.details;
  }
}
