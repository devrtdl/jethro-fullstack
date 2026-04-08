import { apiClient } from '@/src/services/api/client';
import type {
  PublicFormResponse,
  SubmissionPayload,
  SubmissionResponse,
} from '@/src/types/diagnostic-form';

const FORM_SLUG = 'diagnostico-inicial';

export const diagnosticService = {
  async getPublicForm() {
    const response = await apiClient.get<PublicFormResponse>(`/forms/${FORM_SLUG}`);
    return response.data;
  },

  async submitForm(payload: SubmissionPayload) {
    const response = await apiClient.post<SubmissionResponse>(`/forms/${FORM_SLUG}/submissions`, payload);
    return response.data;
  },

  async submitRating(payload: { submissionId: string; email: string; stars: number }) {
    await apiClient.post('/diagnostic-ratings', payload);
  },
};
