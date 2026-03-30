import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/src/services/auth/auth-service';

type AuthScreenMode = 'login' | 'register';

const palette = {
  background: '#07111D',
  surface: '#0D1B2A',
  surfaceAlt: '#132235',
  cardBorder: 'rgba(215, 184, 110, 0.18)',
  gold: '#D7B86E',
  cream: '#F6F1E8',
  muted: '#A5B1BF',
  success: '#8DBA88',
  danger: '#E07C6C',
};

export function AuthScreen({ mode }: { mode: AuthScreenMode }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegister = mode === 'register';

  async function handlePasswordAction() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim() || (isRegister && !fullName.trim())) {
      setError(isRegister ? 'Preencha nome, email e senha.' : 'Preencha email e senha.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      if (isRegister) {
        const result = await authService.signUpWithPassword(normalizedEmail, password);
        if (result.user?.id) {
          setMessage('Conta criada com sucesso. Vamos para o diagnostico.');
          router.replace('/(tabs)');
          return;
        }

        setMessage('Conta criada. Se o ambiente exigir confirmacao de email, valide e depois entre.');
      } else {
        await authService.signInWithPassword(normalizedEmail, password);
        router.replace('/(tabs)');
        return;
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Nao foi possivel autenticar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSocialAuth(provider: 'google' | 'apple') {
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      await authService.signInWithOAuth(provider);
      router.replace('/(tabs)');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Nao foi possivel iniciar o login social.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.brandRow}>
            <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} contentFit="contain" />
            <Text style={styles.brandLabel}>Jethro</Text>
          </View>
          <Text style={styles.eyebrow}>{isRegister ? 'Primeiro acesso' : 'Entrar'}</Text>
          <Text style={styles.title}>
            {isRegister ? 'Crie sua conta e comece pelo diagnostico.' : 'Volte para o seu diagnostico e plano.'}
          </Text>
          <Text style={styles.subtitle}>
            {isRegister
              ? 'No primeiro acesso, o app leva voce direto para o cadastro e depois para o fluxo principal.'
              : 'Use login social ou email e senha para continuar de onde parou.'}
          </Text>
        </View>

        <View style={styles.formCard}>
          {isRegister ? (
            <TextInput
              autoCapitalize="words"
              autoComplete="name"
              placeholder="Nome completo"
              placeholderTextColor="#8692A3"
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
            />
          ) : null}

          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="voce@empresa.com"
            placeholderTextColor="#8692A3"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            autoCapitalize="none"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            secureTextEntry
            placeholder="Sua senha"
            placeholderTextColor="#8692A3"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <Pressable style={styles.primaryButton} onPress={() => void handlePasswordAction()} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={palette.surface} />
            ) : (
              <Text style={styles.primaryButtonLabel}>{isRegister ? 'Criar conta' : 'Entrar'}</Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerLabel}>ou continue com</Text>
            <View style={styles.divider} />
          </View>

          <Pressable style={styles.secondaryButton} onPress={() => void handleSocialAuth('google')} disabled={isSubmitting}>
            <Text style={styles.secondaryButtonLabel}>{isRegister ? 'Cadastrar com Google' : 'Entrar com Google'}</Text>
          </Pressable>

          {Platform.OS === 'ios' ? (
            <Pressable style={styles.secondaryButton} onPress={() => void handleSocialAuth('apple')} disabled={isSubmitting}>
              <Text style={styles.secondaryButtonLabel}>{isRegister ? 'Cadastrar com Apple' : 'Entrar com Apple'}</Text>
            </Pressable>
          ) : null}

          {message ? <Text style={styles.successText}>{message}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{isRegister ? 'Ja tem conta?' : 'Ainda nao tem conta?'}</Text>
            <Link href={isRegister ? '/auth/login' : '/auth/register'} asChild>
              <Pressable>
                <Text style={styles.footerLink}>{isRegister ? 'Entrar' : 'Registrar'}</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 46,
    height: 46,
  },
  brandLabel: {
    color: palette.cream,
    fontSize: 20,
    fontWeight: '700',
  },
  eyebrow: {
    color: palette.gold,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.cream,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '400',
  },
  subtitle: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 25,
  },
  formCard: {
    borderRadius: 28,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 20,
    gap: 14,
  },
  input: {
    borderRadius: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(215, 184, 110, 0.14)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: palette.cream,
    fontSize: 15,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: palette.gold,
    minHeight: 54,
    paddingHorizontal: 18,
  },
  primaryButtonLabel: {
    color: palette.surface,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(215, 184, 110, 0.18)',
    backgroundColor: palette.surface,
    minHeight: 54,
    paddingHorizontal: 18,
  },
  secondaryButtonLabel: {
    color: palette.cream,
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(215, 184, 110, 0.14)',
  },
  dividerLabel: {
    color: palette.muted,
    fontSize: 13,
  },
  successText: {
    color: palette.success,
    fontSize: 14,
    lineHeight: 22,
  },
  errorText: {
    color: palette.danger,
    fontSize: 14,
    lineHeight: 22,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  footerText: {
    color: palette.muted,
    fontSize: 14,
  },
  footerLink: {
    color: palette.gold,
    fontSize: 14,
    fontWeight: '700',
  },
});
