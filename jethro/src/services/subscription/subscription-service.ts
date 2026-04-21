import { apiClient } from '@/src/services/api/client';
import { getAuthHeaders } from '@/src/lib/auth-headers';

export type FlowStatus = {
  hasDiagnostic: boolean;
  hasSubscription: boolean;
  hasOnboarding: boolean;
  hasPlan: boolean;
};

export type SubscriptionStatus = {
  status: string;
  plano: string;
  validade_ate: string | null;
} | null;

type ApiResponse<T> = { success: boolean; data: T };

export const subscriptionService = {
  async getFlowStatus(): Promise<FlowStatus> {
    const headers = await getAuthHeaders();
    const response = await apiClient.get<ApiResponse<FlowStatus>>('/user/flow-status', { headers });
    return response.data;
  },

  async createCheckout(): Promise<{ url: string; sessionId: string }> {
    const headers = await getAuthHeaders();
    const response = await apiClient.post<ApiResponse<{ url: string; sessionId: string }>>(
      '/subscription/create-checkout',
      {},
      { headers }
    );
    return response.data;
  },

  async getStatus(): Promise<SubscriptionStatus> {
    const headers = await getAuthHeaders();
    const response = await apiClient.get<ApiResponse<SubscriptionStatus>>('/subscription/status', {
      headers,
    });
    return response.data;
  },

  async activateSandbox(): Promise<void> {
    const headers = await getAuthHeaders();
    await apiClient.post('/subscription/activate-sandbox', {}, { headers });
  },
};
