import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Provider, Session } from '@supabase/supabase-js';

import { env } from '@/src/config/env';
import { supabase } from '@/src/lib/supabase';
import { appStorage } from '@/src/lib/app-storage';
import { apiClient } from '@/src/services/api/client';
import type { SubmissionResult } from '@/src/types/diagnostic-form';
import { ApiError } from '@/src/types/api';

WebBrowser.maybeCompleteAuthSession();

type FormAccessResponse = {
  success: boolean;
  data: {
    email: string;
    allowed: boolean;
    loginMethod: 'otp';
  };
};

type DiagnosticLookupResponse = {
  success: boolean;
  data: {
    email: string;
    submissionId: string;
    formSlug: string;
    createdAt: string;
    respondent: {
      fullName?: string;
      email?: string;
      whatsappNumber?: string;
      whatsappCountryIso?: string;
    };
    diagnostic: SubmissionResult['diagnostic'];
    derived: SubmissionResult['derived'];
    answersBySlug: Record<string, unknown>;
    payload: {
      answersBySlug: Record<string, unknown>;
    };
  };
};

type OAuthSessionTokens = {
  accessToken: string;
  refreshToken: string;
};

function normalizeDiagnosticResult(data: DiagnosticLookupResponse['data']): SubmissionResult {
  const legacyDiagnostic = data.diagnostic as SubmissionResult['diagnostic'] & {
    title?: string;
    message?: string;
  };

  const normalizedModelCode =
    typeof legacyDiagnostic.modelCode === 'string' && legacyDiagnostic.modelCode.trim()
      ? legacyDiagnostic.modelCode
      : 'Anterior';

  return {
    submissionId: data.submissionId,
    confirmation: {
      title: 'Diagnóstico carregado',
      message: 'Seu último diagnóstico foi restaurado.',
    },
    diagnostic: {
      status: legacyDiagnostic.status ?? 'ready',
      modelCode: normalizedModelCode,
      variant: legacyDiagnostic.variant ?? 'v1',
      block1Title: legacyDiagnostic.block1Title ?? legacyDiagnostic.title ?? 'Seu último diagnóstico',
      block1Body: legacyDiagnostic.block1Body ?? legacyDiagnostic.message ?? 'Seu diagnóstico anterior foi recuperado com sucesso.',
      rootCause: legacyDiagnostic.rootCause,
      scriptureVerse: legacyDiagnostic.scriptureVerse,
      scriptureText: legacyDiagnostic.scriptureText,
      block2Title: legacyDiagnostic.block2Title ?? 'O que fazer agora:',
      block2Body:
        legacyDiagnostic.block2Body ?? 'Você pode seguir para o plano de ação ou refazer o diagnóstico para gerar uma nova leitura.',
      ctaLabel: legacyDiagnostic.ctaLabel ?? 'Quero meu plano de ação',
      generatedAt: legacyDiagnostic.generatedAt ?? data.createdAt,
    },
    derived: data.derived,
  };
}

function requireSupabase() {
  if (!supabase) {
    throw new ApiError('Supabase Auth não configurado no app mobile.', {
      code: 'UNKNOWN_ERROR',
    });
  }

  return supabase;
}

function extractOAuthSessionTokens(url: string): OAuthSessionTokens | null {
  const normalizedUrl = url.replace('#', '?');
  const parsedUrl = new URL(normalizedUrl);
  const accessToken = parsedUrl.searchParams.get('access_token');
  const refreshToken = parsedUrl.searchParams.get('refresh_token');

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
}

function getOAuthRedirectUrl() {
  return env.authRedirectUrl ?? Linking.createURL('/auth/callback');
}

export const authService = {
  async signUpWithPassword(email: string, password: string, fullName?: string) {
    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: fullName?.trim()
        ? {
            data: {
              full_name: fullName.trim(),
            },
          }
        : undefined,
    });

    if (error) {
      throw new ApiError(error.message, {
        code: 'HTTP_ERROR',
        status: 400,
        details: error,
      });
    }

    return data;
  },

  async signInWithPassword(email: string, password: string) {
    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new ApiError(error.message, {
        code: 'HTTP_ERROR',
        status: 400,
        details: error,
      });
    }

    return data;
  },

  async signInWithOAuth(provider: Extract<Provider, 'google' | 'apple'>) {
    const client = requireSupabase();
    const redirectTo = getOAuthRedirectUrl();
    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw new ApiError(error.message, {
        code: 'HTTP_ERROR',
        status: 400,
        details: error,
      });
    }

    if (!data?.url) {
      throw new ApiError('Não foi possível iniciar o login social.', {
        code: 'UNKNOWN_ERROR',
      });
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') {
      throw new ApiError('O login social foi cancelado antes da conclusão.', {
        code: 'UNKNOWN_ERROR',
      });
    }

    await this.completeOAuthSession(result.url);
    return this.getSession();
  },

  async completeOAuthSession(url: string) {
    const client = requireSupabase();
    const tokens = extractOAuthSessionTokens(url);

    if (!tokens) {
      throw new ApiError('Não foi possível concluir o retorno do login social.', {
        code: 'PARSE_ERROR',
      });
    }

    const { data, error } = await client.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });

    if (error) {
      throw new ApiError(error.message, {
        code: 'HTTP_ERROR',
        status: 400,
        details: error,
      });
    }

    return data.session;
  },

  async requestFormAccess(email: string) {
    await apiClient.post<FormAccessResponse>('/auth/form-access/request', { email });
  },

  async sendOtp(email: string) {
    const client = requireSupabase();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      throw new ApiError(error.message, {
        code: 'HTTP_ERROR',
        status: 400,
        details: error,
      });
    }
  },

  async getLatestDiagnostic(email: string) {
    const response = await apiClient.post<DiagnosticLookupResponse>('/auth/form-access/diagnostic', { email });
    return normalizeDiagnosticResult(response.data);
  },

  async verifyOtp(email: string, token: string) {
    const client = requireSupabase();
    const { data, error } = await client.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      throw new ApiError(error.message, {
        code: 'HTTP_ERROR',
        status: 400,
        details: error,
      });
    }

    return data.session;
  },

  async getSession() {
    const client = requireSupabase();
    const { data, error } = await client.auth.getSession();

    if (error) {
      throw new ApiError(error.message, {
        code: 'HTTP_ERROR',
        status: 400,
        details: error,
      });
    }

    return data.session;
  },

  async getUserIdentities() {
    const client = requireSupabase();
    const { data, error } = await client.auth.getUserIdentities();

    if (error) {
      throw new ApiError(error.message, {
        code: 'HTTP_ERROR',
        status: 400,
        details: error,
      });
    }

    return data.identities;
  },

  async linkIdentity(provider: Extract<Provider, 'google' | 'apple'>) {
    const client = requireSupabase();
    const redirectTo = getOAuthRedirectUrl();
    const { data, error } = await client.auth.linkIdentity({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw new ApiError(error.message, {
        code: 'HTTP_ERROR',
        status: 400,
        details: error,
      });
    }

    if (!data?.url) {
      throw new ApiError('Não foi possível iniciar a vinculação da conta.', {
        code: 'UNKNOWN_ERROR',
      });
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') {
      throw new ApiError('A vinculação foi cancelada antes da conclusão.', {
        code: 'UNKNOWN_ERROR',
      });
    }

    await this.completeOAuthSession(result.url);
    return this.getUserIdentities();
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    const client = requireSupabase();
    return client.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },

  async resetPassword(email: string) {
    const client = requireSupabase();
    const redirectTo = getOAuthRedirectUrl();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw new ApiError(error.message, {
        code: 'HTTP_ERROR',
        status: 400,
        details: error,
      });
    }
  },

  async signOut() {
    const client = requireSupabase();
    const { error } = await client.auth.signOut();

    if (error) {
      throw new ApiError(error.message, {
        code: 'HTTP_ERROR',
        status: 400,
        details: error,
      });
    }

    await appStorage.removeItem('onboarding_draft').catch(() => {});
  },
};
