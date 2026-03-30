import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { hasSupabaseConfig } from '@/src/lib/supabase';
import { authService } from '@/src/services/auth/auth-service';

type Identity = Awaited<ReturnType<typeof authService.getUserIdentities>>[number];

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function refreshIdentities() {
    if (!hasSupabaseConfig()) {
      setIdentities([]);
      return;
    }

    try {
      setIdentities(await authService.getUserIdentities());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel carregar as vinculacoes.');
    }
  }

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setIsReady(true);
      return;
    }

    void authService
      .getSession()
      .then((nextSession) => {
        setSession(nextSession);
        if (nextSession?.user) {
          void refreshIdentities();
        }
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel carregar a sessao.');
      })
      .finally(() => setIsReady(true));

    const listener = authService.onAuthStateChange((nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void refreshIdentities();
      } else {
        setIdentities([]);
      }
    });

    return () => {
      listener.data.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    identities,
    isReady,
    errorMessage,
    setErrorMessage,
    refreshIdentities,
  };
}
