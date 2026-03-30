import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Provider, Session } from '@supabase/supabase-js';

import { supabase } from '@/src/lib/supabase';
import { apiClient } from '@/src/services/api/client';
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
    diagnostic: {
      status: 'pending';
      title: string;
      message: string;
      generatedAt: string;
    };
    derived: {
      score: number;
      scoreBand: 'baixo' | 'medio' | 'alto';
      whatsappCountryIso?: string;
      revenueCurrency?: string;
      revenueBand?: string;
    };
    answersBySlug: Record<string, unknown>;
    payload: {
      answersBySlug: Record<string, unknown>;
    };
  };
};

function requireSupabase() {
  if (!supabase) {
    throw new ApiError('Supabase Auth nao configurado no app mobile.', {
      code: 'UNKNOWN_ERROR',
    });
  }

  return supabase;
}

export const authService = {
  async signUpWithPassword(email: string, password: string) {
    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
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
    const redirectTo = Linking.createURL('/auth/callback');
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
      throw new ApiError('Nao foi possivel iniciar o login social.', {
        code: 'UNKNOWN_ERROR',
      });
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' && result.type !== 'dismiss') {
      throw new ApiError('O login social foi cancelado antes da conclusao.', {
        code: 'UNKNOWN_ERROR',
      });
    }

    return this.getSession();
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
    return response.data;
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
    const redirectTo = Linking.createURL('/auth/callback');
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
      throw new ApiError('Nao foi possivel iniciar a vinculacao da conta.', {
        code: 'UNKNOWN_ERROR',
      });
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' && result.type !== 'dismiss') {
      throw new ApiError('A vinculacao foi cancelada antes da conclusao.', {
        code: 'UNKNOWN_ERROR',
      });
    }

    return this.getUserIdentities();
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    const client = requireSupabase();
    return client.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
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
  },
};
