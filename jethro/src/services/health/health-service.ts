import { apiClient } from '@/src/services/api/client';

export type HealthCheckResponse = {
  status: string;
  message?: string;
  environment?: string;
  timestamp?: string;
  version?: string;
  [key: string]: unknown;
};

export const healthService = {
  getHealthCheck() {
    return apiClient.get<HealthCheckResponse>('/health/check');
  },
};
