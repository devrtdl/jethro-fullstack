import { env } from '@/src/config/env';
import { ApiError } from '@/src/types/api';

type Primitive = string | number | boolean;

type RequestOptions = RequestInit & {
  query?: Record<string, Primitive | null | undefined>;
  timeoutMs?: number;
};

function buildUrl(path: string, query?: RequestOptions['query']) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${env.apiBaseUrl}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (response.status === 204) {
    return null;
  }

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (payload && typeof payload === 'object') {
    // Backend format: { error: { message: "..." } }
    const error = (payload as Record<string, unknown>).error;
    if (error && typeof error === 'object') {
      const msg = (error as Record<string, unknown>).message;
      if (typeof msg === 'string' && msg.trim()) return msg;
    }
    // Fallback: top-level message field
    const message = (payload as Record<string, unknown>).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallbackMessage;
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? env.apiTimeoutMs;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const hasBody = options.body !== undefined;

  try {
    const response = await fetch(buildUrl(path, options.query), {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });

    const payload = await parseResponse(response);

    if (!response.ok) {
      throw new ApiError(getErrorMessage(payload, 'Não foi possível concluir a requisição.'), {
        code: 'HTTP_ERROR',
        status: response.status,
        details: payload,
      });
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('A API demorou mais do que o esperado para responder.', {
        code: 'TIMEOUT',
      });
    }

    if (error instanceof SyntaxError) {
      throw new ApiError('A resposta da API veio em um formato inválido.', {
        code: 'PARSE_ERROR',
      });
    }

    throw new ApiError('Não foi possível se conectar com a API.', {
      code: 'NETWORK',
      details: error,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
};
