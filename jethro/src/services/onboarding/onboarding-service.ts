import { apiClient } from '@/src/services/api/client';
import { getAuthHeaders } from '@/src/lib/auth-headers';

export type OnboardingQuestion = {
  code: string;
  order_index: number;
  label: string;
  helper_text: string | null;
  question_type: string;
  is_required: boolean;
  options: { value: string; label: string }[] | null;
  metadata: {
    form: string;
    phase: number;
    showIf?: { question: string; value: string | string[] };
  };
};

export type OnboardingSession = {
  id: string;
  modelo_confirmado: string;
  json_completo: Record<string, unknown>;
  status: string;
};

type QuestionsApiResponse = {
  success: boolean;
  data: OnboardingQuestion[];
};

type SummaryApiResponse = {
  success: boolean;
  data: OnboardingSession;
};

type SubmitApiResponse = {
  success: boolean;
  data: { sessionId: string; modeloConfirmado: string; json: Record<string, unknown> };
};

export const onboardingService = {
  async getQuestions(): Promise<OnboardingQuestion[]> {
    const headers = await getAuthHeaders();
    const response = await apiClient.get<QuestionsApiResponse>('/onboarding/questions', { headers });
    return response.data;
  },

  async getSummary(): Promise<OnboardingSession> {
    const headers = await getAuthHeaders();
    const response = await apiClient.get<SummaryApiResponse>('/onboarding/summary', { headers });
    return response.data;
  },

  async submit(answers: Record<string, unknown>): Promise<SubmitApiResponse['data']> {
    const headers = await getAuthHeaders();
    const response = await apiClient.post<SubmitApiResponse>(
      '/onboarding/submit',
      { answers },
      { headers }
    );
    return response.data;
  },
};
