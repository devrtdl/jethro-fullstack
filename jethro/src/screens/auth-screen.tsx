import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/src/services/auth/auth-service';

type AuthScreenMode = 'login' | 'register';

const palette = {
  background: '#0B1F3B',
  surface: '#112440',
  surfaceElevated: '#163050',
  gold: '#D4AF37',
  goldSoft: 'rgba(212, 175, 55, 0.18)',
  goldGlow: 'rgba(212, 175, 55, 0.08)',
  goldBorder: 'rgba(212, 175, 55, 0.25)',
  cream: '#F8F9FA',
  muted: '#8A9BB0',
  mutedDim: 'rgba(138, 155, 176, 0.6)',
  danger: '#E05C5C',
  success: '#4CAF7D',
  inputBorder: 'rgba(212, 175, 55, 0.20)',
  inputBackground: 'rgba(17, 36, 64, 0.8)',
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
      setError(isRegister ? 'Preencha nome, e-mail e senha.' : 'Preencha e-mail e senha.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      if (isRegister) {
        const result = await authService.signUpWithPassword(normalizedEmail, password, fullName);
        if (result.user?.id) {
          setMessage('Conta criada com sucesso. Vamos para o diagnóstico.');
          router.replace('/(tabs)');
          return;
        }

        setMessage('Conta criada. Se o ambiente exigir confirmação de e-mail, valide e depois entre.');
      } else {
        await authService.signInWithPassword(normalizedEmail, password);
        router.replace('/(tabs)');
        return;
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Não foi possível autenticar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSocialAuth(provider: 'google') {
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      await authService.signInWithOAuth(provider);
      router.replace('/(tabs)');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Não foi possível iniciar o login social.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Background glow */}
      

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Logo + wordmark */}
        <View style={styles.brandBlock}>
          <Image
            source={require('@/assets/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />

          <View style={styles.wordmarkBlock}>
            <Text style={styles.brandName}>JETHRO</Text>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.brandTagline}>Mentor do Empreendedor Cristão</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>
        </View>

        {/* Heading */}
        <View style={styles.headingBlock}>
          <Text style={styles.heading}>
            {isRegister ? 'Comece sua jornada' : 'Bem-vindo de volta'}
          </Text>
          <Text style={styles.subheading}>
            {isRegister
              ? 'Crie sua conta para acessar seu diagnóstico.'
              : 'Acesse para continuar de onde parou.'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formBlock}>
          {isRegister ? (
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Nome completo</Text>
              <TextInput
                autoCapitalize="words"
                autoComplete="name"
                placeholder="Seu nome completo"
                placeholderTextColor={palette.mutedDim}
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          ) : null}

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="seu@email.com"
              placeholderTextColor={palette.mutedDim}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Senha</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={palette.mutedDim}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {message ? <Text style={styles.successText}>{message}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            onPress={() => void handlePasswordAction()}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={palette.background} />
            ) : (
              <Text style={styles.primaryButtonLabel}>
                {isRegister ? 'Criar conta' : 'Entrar'}
              </Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orLabel}>ou</Text>
            <View style={styles.orLine} />
          </View>

          {/* Google */}
          <Pressable
            style={styles.socialButton}
            onPress={() => void handleSocialAuth('google')}
            disabled={isSubmitting}>
            <View style={styles.socialIconShell}>
              <Text style={styles.socialIconLabel}>G</Text>
            </View>
            <Text style={styles.socialButtonLabel}>
              {isRegister ? 'Continuar com Google' : 'Entrar com Google'}
            </Text>
          </Pressable>
        </View>

        {/* Footer switch */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            {isRegister ? 'Já tem conta?' : 'Ainda não tem conta?'}
          </Text>
          <Link href={isRegister ? '/auth/login' : '/auth/register'} asChild>
            <Pressable>
              <Text style={styles.footerLink}>
                {isRegister ? 'Entrar' : 'Registrar'}
              </Text>
            </Pressable>
          </Link>
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
  glowTop: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    width: 340,
    height: 340,
    borderRadius: 999,
    backgroundColor: palette.goldGlow,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -80,
    alignSelf: 'center',
    width: 280,
    height: 200,
    borderRadius: 999,
    backgroundColor: 'rgba(11, 31, 59, 0.5)',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 28,
  },

  // Brand
  brandBlock: {
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    width: 120,
    height: 120,
  },
  wordmarkBlock: {
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    color: palette.cream,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.gold,
    maxWidth: 32,
    opacity: 0.5,
  },
  brandTagline: {
    color: palette.gold,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // Heading
  headingBlock: {
    alignItems: 'center',
    gap: 8,
  },
  heading: {
    color: palette.cream,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  subheading: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
  },

  // Form
  formBlock: {
    gap: 14,
  },
  inputWrap: {
    gap: 6,
  },
  inputLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  input: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: palette.inputBackground,
    borderWidth: 1,
    borderColor: palette.inputBorder,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: palette.cream,
    fontSize: 15,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: palette.gold,
    minHeight: 54,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonLabel: {
    color: palette.background,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(138, 155, 176, 0.25)',
  },
  orLabel: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  socialButton: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.20)',
    backgroundColor: palette.surface,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  socialIconShell: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconLabel: {
    color: palette.gold,
    fontSize: 14,
    fontWeight: '800',
  },
  socialButtonLabel: {
    color: palette.cream,
    fontSize: 15,
    fontWeight: '600',
  },
  successText: {
    color: palette.success,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorText: {
    color: palette.danger,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
