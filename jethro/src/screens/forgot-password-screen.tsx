import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/src/services/auth/auth-service';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';
import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';

export function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [email,       setEmail]       = useState('');
  const [message,     setMessage]     = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [isSubmitting,setIsSubmitting]= useState(false);
  const [sent,        setSent]        = useState(false);

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
    <SafeAreaView style={s.safeArea}>
      <View style={s.content}>
        <View style={s.brandBlock}>
          <Image source={require('@/assets/logo.png')} style={s.logo} contentFit="contain" />
        </View>

        <View style={s.headingBlock}>
          <Text style={s.heading}>Redefinir senha</Text>
          <Text style={s.subheading}>
            Digite seu e-mail e enviaremos um link para você criar uma nova senha.
          </Text>
        </View>

        <View style={s.formBlock}>
          <View style={s.inputWrap}>
            <Text style={s.inputLabel}>E-mail</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="seu@email.com"
              placeholderTextColor={colors.inkMute}
              style={s.input}
              value={email}
              onChangeText={setEmail}
              editable={!sent}
            />
          </View>

          {message ? <Text style={s.successText}>{message}</Text> : null}
          {error   ? <Text style={s.errorText}>{error}</Text>     : null}

          {!sent ? (
            <Pressable
              style={[s.primaryButton, isSubmitting && s.primaryButtonDisabled]}
              onPress={() => void handleReset()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={palette.navy800} />
              ) : (
                <Text style={s.primaryButtonLabel}>Enviar link</Text>
              )}
            </Pressable>
          ) : null}

          <Pressable style={s.backButton} onPress={() => router.back()}>
            <Text style={s.backButtonLabel}>Voltar para o login</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    content:  { flex: 1, paddingHorizontal: 28, paddingTop: 40, paddingBottom: 32, gap: 28 },

    brandBlock: { alignItems: 'center' },
    logo:       { width: 90, height: 90 },

    headingBlock: { alignItems: 'center', gap: 8 },
    heading:      { color: c.ink, fontFamily: FontFamily.serifSemiBold, fontSize: 24, letterSpacing: 0.3, textAlign: 'center' },
    subheading:   { color: c.inkMute, fontFamily: FontFamily.sansRegular, fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 300 },

    formBlock:  { gap: 14 },
    inputWrap:  { gap: 6 },
    inputLabel: { color: c.inkMute, fontFamily: FontFamily.sansBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', marginLeft: 4 },
    input: {
      minHeight: 54, borderRadius: 14, backgroundColor: c.surface,
      borderWidth: 1, borderColor: c.accentMuted,
      paddingHorizontal: 18, paddingVertical: 12,
      color: c.ink, fontFamily: FontFamily.sansRegular, fontSize: 15,
    },

    primaryButton:         { alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: c.accent, minHeight: 54, paddingHorizontal: 18, marginTop: 4 },
    primaryButtonDisabled: { opacity: 0.7 },
    primaryButtonLabel:    { color: palette.navy800, fontFamily: FontFamily.sansBold, fontSize: 17, letterSpacing: 0.3 },

    backButton:      { alignItems: 'center', paddingVertical: 12 },
    backButtonLabel: { color: c.accent, fontFamily: FontFamily.sansBold, fontSize: 14 },

    successText: { color: c.success, fontFamily: FontFamily.sansRegular, fontSize: 13, lineHeight: 20, textAlign: 'center' },
    errorText:   { color: c.danger,  fontFamily: FontFamily.sansRegular, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  });
}
