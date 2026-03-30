import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/src/services/auth/auth-service';

type AuthScreenMode = 'login' | 'register';

const palette = {
  background: '#060D17',
  surface: '#0D1725',
  surfaceAlt: '#121E2E',
  tileA: '#1B2434',
  tileB: '#232E42',
  tileC: '#2B1F16',
  border: 'rgba(215, 184, 110, 0.18)',
  gold: '#D7B86E',
  goldSoft: '#E8D39A',
  cream: '#F6F1E8',
  muted: '#A5B1BF',
  success: '#8DBA88',
  danger: '#E07C6C',
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
        <View style={styles.heroFrame}>
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />

          <View style={styles.mosaic}>
            <View style={styles.mosaicColumn}>
              <MosaicTile {...mosaicTiles[0]} />
            </View>
            <View style={[styles.mosaicColumn, styles.centerColumn]}>
              <View style={styles.logoMedallion}>
                <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} contentFit="contain" />
              </View>
              <View style={styles.brandChip}>
                <Text style={styles.brandChipLabel}>Jethro</Text>
              </View>
            </View>
            <View style={styles.mosaicColumn}>
              <MosaicTile {...mosaicTiles[1]} />
            </View>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>{isRegister ? 'Primeiro acesso' : 'Acesso'}</Text>
            <Text style={styles.title}>
              {isRegister ? 'Seu negócio merece direção.' : 'Volte para o seu próximo passo.'}
            </Text>
            <Text style={styles.subtitle}>
              {isRegister
                ? 'Diagnóstico, verdade e plano no mesmo fluxo.'
                : 'Entre com e-mail ou Google e retome sua jornada.'}
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
              placeholder="voce@empresa.com"
              placeholderTextColor="#8692A3"
              style={styles.inlineInput}
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              autoCapitalize="none"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              secureTextEntry
              placeholder="Sua senha"
              placeholderTextColor="#8692A3"
              style={styles.inlineInput}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Pressable style={styles.primaryButton} onPress={() => void handlePasswordAction()} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={palette.surface} />
            ) : (
              <Text style={styles.primaryButtonLabel}>
                {isRegister ? 'Começar agora' : 'Continuar com e-mail'}
              </Text>
            )}
          </Pressable>

          <SocialButton
            label={isRegister ? 'Cadastrar com Google' : 'Continuar com Google'}
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
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 18,
    gap: 12,
  },
  heroFrame: {
    borderRadius: 34,
    backgroundColor: '#0A111B',
    overflow: 'hidden',
    minHeight: 262,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  glowTop: {
    position: 'absolute',
    top: 110,
    left: -20,
    right: -20,
    height: 120,
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -10,
    left: 60,
    right: 60,
    height: 90,
    borderRadius: 999,
    backgroundColor: 'rgba(215, 184, 110, 0.08)',
  },
  mosaic: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  mosaicColumn: {
    flex: 1,
    gap: 10,
  },
  centerColumn: {
    alignItems: 'center',
  },
  tile: {
    minHeight: 118,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(215, 184, 110, 0.08)',
    overflow: 'hidden',
    padding: 14,
    justifyContent: 'flex-end',
  },
  tileShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.26)',
  },
  tileTitle: {
    color: palette.cream,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    zIndex: 1,
  },
  tileSubtitle: {
    color: palette.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    zIndex: 1,
  },
  logoMedallion: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 108,
    height: 108,
    borderRadius: 999,
    backgroundColor: 'rgba(247, 241, 232, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(247, 241, 232, 0.08)',
  },
  logo: {
    width: 50,
    height: 50,
  },
  brandChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(247, 241, 232, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(247, 241, 232, 0.08)',
  },
  brandChipLabel: {
    color: palette.goldSoft,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  heroCopy: {
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    paddingHorizontal: 8,
  },
  eyebrow: {
    color: palette.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.cream,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '600',
    textAlign: 'center',
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
    borderRadius: 999,
    backgroundColor: '#0F1723',
    borderWidth: 1,
    borderColor: 'rgba(247, 241, 232, 0.14)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: palette.cream,
    fontSize: 15,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: palette.gold,
    minHeight: 54,
    paddingHorizontal: 18,
  },
  primaryButtonLabel: {
    color: palette.surface,
    fontSize: 17,
    fontWeight: '800',
  },
  socialButton: {
    minHeight: 54,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(247, 241, 232, 0.14)',
    backgroundColor: '#0F1723',
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
    backgroundColor: 'rgba(247, 241, 232, 0.08)',
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
    color: palette.gold,
    fontSize: 14,
    fontWeight: '700',
  },
});
