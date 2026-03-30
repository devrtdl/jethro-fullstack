import type { PublicFormResponse, SubmissionPayload, SubmissionResponse } from '../types/form';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'http://localhost:3000';

async function parseJson(response: Response) {
  return response.json() as Promise<unknown>;
}

export async function getPublicForm(slug: string) {
  // TODO Pollynerd: se a gente precisar trocar ambiente depois, mover isso para env/config.
  // por enquanto deixei fixo para facilitar teste local sem inventar muita coisa.
  const response = await fetch(`${API_BASE_URL}/forms/${slug}`);
  const payload = (await parseJson(response)) as PublicFormResponse;

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar o formulario.');
  }

  return payload.data;
}


export async function submitForm(slug: string, payload: SubmissionPayload) {
  const response = await fetch(`${API_BASE_URL}/forms/${slug}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = (await parseJson(response)) as SubmissionResponse;

  if (!response.ok) {
    // lê o erro real que o backend mandou
    const errorBody = body as unknown as {
      success: false;
      error: { code: string; message: string; retryable: boolean; details?: unknown };
    };
    const message = errorBody?.error?.message ?? 'Nao foi possivel enviar o formulario.';
    const error = new Error(message);
    // carrega os detalhes junto pra poder ler no catch
    (error as any).details = errorBody?.error?.details;
    (error as any).code = errorBody?.error?.code;
    (error as any).retryable = errorBody?.error?.retryable;
    throw error;
  }

  return body.data;
}
