import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/src/services/auth/auth-service';

type AuthScreenMode = 'login' | 'register';

const palette = {
  background: '#F8F5EF',
  surface: '#0F1B2D',
  surfaceAlt: '#FFFFFF',
  tileA: '#EAF0F8',
  tileB: '#F7EBD0',
  tileC: '#EEF3EA',
  border: 'rgba(15, 27, 45, 0.08)',
  gold: '#C9A84C',
  goldSoft: '#E9D18A',
  cream: '#F6F1E8',
  muted: '#6C788A',
  success: '#3A9F63',
  danger: '#D96B5F',
  text: '#172335',
  blue: '#2F67F6',
  blueSoft: '#DDE7FF',
};

const mosaicTiles = [
  { id: '1', title: 'Diagnóstico', subtitle: 'Clareza', tone: 'a' },
  { id: '2', title: 'Plano', subtitle: 'Direção', tone: 'b' },
] as const;

function MosaicTile({
  title,
  subtitle,
  tone,
}: {
  title: string;
  subtitle: string;
  tone: 'a' | 'b' | 'c';
}) {
  const backgroundColor =
    tone === 'a' ? palette.tileA : tone === 'b' ? palette.tileB : palette.tileC;

  return (
    <View style={[styles.tile, { backgroundColor }]}>
      <View style={styles.tileShade} />
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSubtitle}>{subtitle}</Text>
    </View>
  );
}

function SocialButton({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable style={styles.socialButton} onPress={onPress} disabled={disabled}>
      <View style={styles.socialIconShell}>
        <Text style={styles.socialIconLabel}>{icon}</Text>
      </View>
      <Text style={styles.socialButtonLabel}>{label}</Text>
    </Pressable>
  );
}

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
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton}>
            <Text style={styles.iconButtonLabel}>←</Text>
          </Pressable>
          <Text style={styles.wordmark}>JETHRO</Text>
          <Pressable style={styles.iconButton}>
            <Text style={styles.iconButtonLabel}>≡</Text>
          </Pressable>
        </View>

        <View style={styles.heroFrame}>
          <View style={styles.mosaic}>
            <MosaicTile {...mosaicTiles[0]} />
            <View style={styles.logoMedallion}>
              <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} contentFit="contain" />
            </View>
            <MosaicTile {...mosaicTiles[1]} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.title}>
              {isRegister ? 'Entre com seu e-mail para receber seu ' : 'Entre para retomar seu '}
              <Text style={styles.titleAccent}>{isRegister ? 'plano de ação Jethro' : 'próximo passo Jethro'}</Text>
            </Text>
            <Text style={styles.subtitle}>
              {isRegister
                ? 'Diagnóstico, clareza e plano no mesmo fluxo.'
                : 'Acesse com e-mail ou Google e continue de onde parou.'}
            </Text>
          </View>
        </View>

        <View style={styles.actionStack}>
          <View style={styles.inputStack}>
            {isRegister ? (
              <TextInput
                autoCapitalize="words"
                autoComplete="name"
                placeholder="Nome completo"
                placeholderTextColor="#8692A3"
                style={styles.inlineInput}
                value={fullName}
                onChangeText={setFullName}
              />
            ) : null}

            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="Seu e-mail"
              placeholderTextColor="#8A94A5"
              style={styles.inlineInput}
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              autoCapitalize="none"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              secureTextEntry
              placeholder="Sua senha"
              placeholderTextColor="#8A94A5"
              style={styles.inlineInput}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.privacyCard}>
            <Text style={styles.privacyIcon}>⌘</Text>
            <Text style={styles.privacyText}>
              Seus dados são tratados com segurança e usados apenas para liberar sua jornada no app.
            </Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={() => void handlePasswordAction()} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={palette.cream} />
            ) : (
              <Text style={styles.primaryButtonLabel}>
                {isRegister ? 'Continuar' : 'Entrar'}
              </Text>
            )}
          </Pressable>

          <SocialButton
            label={isRegister ? 'Continuar com Google' : 'Entrar com Google'}
            icon="G"
            onPress={() => void handleSocialAuth('google')}
            disabled={isSubmitting}
          />

          {message ? <Text style={styles.successText}>{message}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{isRegister ? 'Já tem conta?' : 'Ainda não tem conta?'}</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 22,
    gap: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonLabel: {
    color: palette.text,
    fontSize: 24,
    lineHeight: 24,
  },
  wordmark: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroFrame: {
    paddingTop: 8,
    gap: 18,
  },
  mosaic: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    flex: 1,
    minHeight: 108,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    justifyContent: 'flex-end',
  },
  tileShade: {
    display: 'none',
  },
  tileTitle: {
    color: palette.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  tileSubtitle: {
    color: palette.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  logoMedallion: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 94,
    height: 94,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#0E1B2D',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  logo: {
    width: 42,
    height: 42,
  },
  heroCopy: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  title: {
    color: palette.text,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
  },
  titleAccent: {
    color: palette.gold,
    fontWeight: '700',
  },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
  },
  actionStack: {
    gap: 10,
  },
  inputStack: {
    gap: 10,
  },
  inlineInput: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(47, 103, 246, 0.34)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: palette.text,
    fontSize: 15,
  },
  privacyCard: {
    minHeight: 76,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  privacyIcon: {
    color: palette.muted,
    fontSize: 18,
    lineHeight: 20,
  },
  privacyText: {
    flex: 1,
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: palette.surface,
    minHeight: 54,
    paddingHorizontal: 18,
  },
  primaryButtonLabel: {
    color: palette.cream,
    fontSize: 17,
    fontWeight: '800',
  },
  socialButton: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: palette.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconLabel: {
    color: palette.blue,
    fontSize: 14,
    fontWeight: '800',
  },
  socialButtonLabel: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
  },
  successText: {
    color: palette.success,
    fontSize: 13,
    lineHeight: 20,
  },
  errorText: {
    color: palette.danger,
    fontSize: 13,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  footerText: {
    color: palette.muted,
    fontSize: 14,
  },
  footerLink: {
    color: palette.blue,
    fontSize: 14,
    fontWeight: '700',
  },
});
