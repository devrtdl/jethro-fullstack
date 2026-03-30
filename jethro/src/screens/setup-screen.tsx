import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/src/components/screen-container';
import { useAuthSession } from '@/src/hooks/use-auth-session';
import { authService } from '@/src/services/auth/auth-service';

const palette = {
  background: '#070D18',
  surface: '#0D1B2A',
  surfaceAlt: '#1E2D40',
  cardBorder: 'rgba(232, 201, 122, 0.18)',
  gold: '#C9A84C',
  goldSoft: '#E8C97A',
  cream: '#F7F3EC',
  muted: '#98A4B5',
  success: '#8DBA88',
  danger: '#E07C6C',
};

const providerCards = [
  { id: 'google', title: 'Google', description: 'Acesso rapido em novos dispositivos usando sua conta Google.' },
  { id: 'apple', title: 'Apple', description: 'Ideal para iPhone e iPad, mantendo o email principal protegido.' },
] as const;

export function SetupScreen() {
  const { session, identities, isReady, refreshIdentities } = useAuthSession();
  const [isLinkingProvider, setIsLinkingProvider] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLinkProvider(provider: 'google' | 'apple') {
    setIsLinkingProvider(provider);
    setMessage(null);
    setError(null);

    try {
      await authService.linkIdentity(provider);
      await refreshIdentities();
      setMessage(`${provider === 'google' ? 'Google' : 'Apple'} vinculado com sucesso.`);
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : 'Nao foi possivel concluir a vinculacao.');
    } finally {
      setIsLinkingProvider(null);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    setError(null);
    setMessage(null);

    try {
      await authService.signOut();
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Nao foi possivel encerrar a sessao.');
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <ScreenContainer backgroundColor={palette.background} contentStyle={styles.container} padded={false}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Conta</Text>
        <Text style={styles.title}>Vincule provedores opcionais sem atrito no primeiro acesso.</Text>
        <Text style={styles.subtitle}>
          O login principal continua sendo por email e codigo. Aqui voce pode adicionar Google ou Apple para acelerar
          acessos futuros em outros dispositivos.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Sessao atual</Text>
        {session?.user?.email ? (
          <View style={styles.stack}>
            <Text style={styles.value}>{session.user.email}</Text>
            <Text style={styles.supportText}>
              Esse e o email que autentica e puxa o diagnostico vinculado ao formulario.
            </Text>
          </View>
        ) : (
          <Text style={styles.supportText}>Entre primeiro na aba Home para habilitar a vinculacao de provedores.</Text>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Contas vinculadas</Text>
        <View style={styles.identityRow}>
          {(identities.length ? identities : [{ provider: 'email' }]).map((identity, index) => (
            <View key={`${identity.provider}-${index}`} style={styles.identityChip}>
              <Text style={styles.identityLabel}>{String(identity.provider).toUpperCase()}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Vincular agora</Text>
        <Text style={styles.supportText}>
          Opcional. Isso reduz atrito quando voce trocar de aparelho ou quiser usar outro metodo de entrada.
        </Text>

        <View style={styles.stack}>
          {providerCards
            .filter((item) => item.id !== 'apple' || Platform.OS === 'ios')
            .map((provider) => (
              <View key={provider.id} style={styles.providerCard}>
                <View style={styles.providerHeader}>
                  <Text style={styles.providerTitle}>{provider.title}</Text>
                  <Text style={styles.providerHint}>Opcional</Text>
                </View>
                <Text style={styles.supportText}>{provider.description}</Text>
                <Pressable
                  style={[styles.linkButton, !session?.user?.email || !isReady ? styles.linkButtonDisabled : null]}
                  disabled={!session?.user?.email || !isReady || isLinkingProvider !== null}
                  onPress={() => void handleLinkProvider(provider.id)}>
                  {isLinkingProvider === provider.id ? (
                    <ActivityIndicator color={palette.surface} />
                  ) : (
                    <Text style={styles.linkButtonLabel}>Vincular {provider.title}</Text>
                  )}
                </Pressable>
              </View>
            ))}
        </View>

        {message ? <Text style={styles.successText}>{message}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      {session?.user?.email ? (
        <Pressable style={styles.logoutButton} onPress={() => void handleSignOut()} disabled={isSigningOut}>
          {isSigningOut ? <ActivityIndicator color={palette.cream} /> : <Text style={styles.logoutLabel}>Sair deste dispositivo</Text>}
        </Pressable>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 40,
    gap: 18,
  },
  heroCard: {
    borderRadius: 30,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 22,
    gap: 14,
  },
  eyebrow: {
    color: palette.goldSoft,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.cream,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '400',
  },
  subtitle: {
    color: palette.muted,
    fontSize: 17,
    lineHeight: 28,
  },
  panel: {
    borderRadius: 24,
    backgroundColor: palette.surfaceAlt,
    padding: 20,
    gap: 14,
  },
  sectionTitle: {
    color: palette.goldSoft,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  stack: {
    gap: 12,
  },
  value: {
    color: palette.cream,
    fontSize: 26,
    fontWeight: '600',
  },
  supportText: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 26,
  },
  identityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  identityChip: {
    borderRadius: 999,
    backgroundColor: 'rgba(247, 243, 236, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  identityLabel: {
    color: palette.cream,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  providerCard: {
    borderRadius: 22,
    backgroundColor: palette.surface,
    padding: 18,
    gap: 12,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  providerTitle: {
    color: palette.cream,
    fontSize: 22,
    fontWeight: '600',
  },
  providerHint: {
    color: palette.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  linkButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: palette.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonDisabled: {
    opacity: 0.45,
  },
  linkButtonLabel: {
    color: palette.surface,
    fontSize: 17,
    fontWeight: '800',
  },
  successText: {
    color: palette.success,
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    color: palette.danger,
    fontSize: 15,
    lineHeight: 22,
  },
  logoutButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(247, 243, 236, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(247, 243, 236, 0.08)',
  },
  logoutLabel: {
    color: palette.cream,
    fontSize: 16,
    fontWeight: '700',
  },
});
