import type { PublicFormResponse, SubmissionPayload, SubmissionResponse } from '../types/form';

const API_BASE_URL = 'http://localhost:3000';

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
    // TODO Pollynerd: melhorar isso para ler o erro real do backend.
    // aqui ainda esta generico porque eu quis primeiro fechar o fluxo ponta a ponta.
    throw new Error('Nao foi possivel enviar o formulario.');
  }

  return body.data;
}
