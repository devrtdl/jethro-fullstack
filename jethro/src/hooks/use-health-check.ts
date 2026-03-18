import { useEffect, useState } from 'react';

import { healthService, type HealthCheckResponse } from '@/src/services/health/health-service';
import { ApiError } from '@/src/types/api';

type HealthCheckState = {
  data: HealthCheckResponse | null;
  error: ApiError | null;
  isLoading: boolean;
};

const initialState: HealthCheckState = {
  data: null,
  error: null,
  isLoading: true,
};

export function useHealthCheck() {
  const [state, setState] = useState<HealthCheckState>(initialState);

  async function loadHealthCheck() {
    setState((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }));

    try {
      const data = await healthService.getHealthCheck();
      setState({
        data,
        error: null,
        isLoading: false,
      });
    } catch (error) {
      setState({
        data: null,
        error: error instanceof ApiError ? error : new ApiError('Erro inesperado ao consultar a API.', { code: 'UNKNOWN_ERROR' }),
        isLoading: false,
      });
    }
  }

  useEffect(() => {
    loadHealthCheck();
  }, []);

  return {
    ...state,
    refetch: loadHealthCheck,
  };
}
