import { apiClient } from '@/src/services/api/client';
import { getAuthHeaders } from '@/src/lib/auth-headers';

export type MentorMessage = {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
};

type MentorChatApiResponse = {
  success: boolean;
  data: { reply: string; sessionId: string };
};

export const mentorService = {
  async chat(sessionId: string, message: string): Promise<{ reply: string; sessionId: string }> {
    const headers = await getAuthHeaders();
    const response = await apiClient.post<MentorChatApiResponse>(
      '/mentor/chat',
      { sessionId, message },
      { headers }
    );
    return response.data;
  },
};
