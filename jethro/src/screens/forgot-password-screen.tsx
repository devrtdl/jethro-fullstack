import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/src/services/auth/auth-service';

const palette = {
  background: '#0B1F3B',
  surface: '#112440',
  gold: '#D4AF37',
  goldGlow: 'rgba(212, 175, 55, 0.08)',
  cream: '#F8F9FA',
  muted: '#8A9BB0',
  mutedDim: 'rgba(138, 155, 176, 0.6)',
  danger: '#E05C5C',
  success: '#4CAF7D',
  inputBorder: 'rgba(212, 175, 55, 0.20)',
  inputBackground: 'rgba(17, 36, 64, 0.8)',
};

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Informe seu e-mail.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      await authService.resetPassword(normalizedEmail);
      setSent(true);
      setMessage('Enviamos um link de redefinição para o seu e-mail. Verifique sua caixa de entrada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o e-mail de redefinição.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.brandBlock}>
          <Image
            source={require('@/assets/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <View style={styles.headingBlock}>
          <Text style={styles.heading}>Redefinir senha</Text>
          <Text style={styles.subheading}>
            Digite seu e-mail e enviaremos um link para você criar uma nova senha.
          </Text>
        </View>

        <View style={styles.formBlock}>
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
              editable={!sent}
            />
          </View>

          {message ? <Text style={styles.successText}>{message}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {!sent ? (
            <Pressable
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
              onPress={() => void handleReset()}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color={palette.background} />
              ) : (
                <Text style={styles.primaryButtonLabel}>Enviar link</Text>
              )}
            </Pressable>
          ) : null}

          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonLabel}>Voltar para o login</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 32,
    gap: 28,
  },
  brandBlock: {
    alignItems: 'center',
  },
  logo: {
    width: 90,
    height: 90,
  },
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
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonLabel: {
    color: palette.gold,
    fontSize: 14,
    fontWeight: '700',
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
});
