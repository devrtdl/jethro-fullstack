import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { authService } from '@/src/services/auth/auth-service';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';
import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';

type AuthScreenMode = 'login' | 'register';

export function AuthScreen({ mode }: { mode: AuthScreenMode }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [fullName,    setFullName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [message,     setMessage]     = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [isSubmitting,setIsSubmitting]= useState(false);
  const [showPassword,setShowPassword]= useState(false);
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
    <SafeAreaView style={s.safeArea}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo + wordmark */}
        <View style={s.brandBlock}>
          <Image source={require('@/assets/logo.png')} style={s.logo} contentFit="contain" />
          <View style={s.wordmarkBlock}>
            <Text style={s.brandName}>JETHRO</Text>
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.brandTagline}>Mentor do Empreendedor Cristão</Text>
              <View style={s.dividerLine} />
            </View>
          </View>
        </View>

        {/* Heading */}
        <View style={s.headingBlock}>
          <Text style={s.heading}>{isRegister ? 'Comece sua jornada' : 'Bem-vindo de volta'}</Text>
          <Text style={s.subheading}>
            {isRegister ? 'Crie sua conta para acessar seu diagnóstico.' : 'Acesse para continuar de onde parou.'}
          </Text>
        </View>

        {/* Form */}
        <View style={s.formBlock}>
          {isRegister ? (
            <View style={s.inputWrap}>
              <Text style={s.inputLabel}>Nome completo</Text>
              <TextInput
                autoCapitalize="words"
                autoComplete="name"
                placeholder="Seu nome completo"
                placeholderTextColor={colors.inkMute}
                style={s.input}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          ) : null}

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
            />
          </View>

          <View style={s.inputWrap}>
            <View style={s.inputLabelRow}>
              <Text style={s.inputLabel}>Senha</Text>
              {!isRegister ? (
                <Link href="/auth/forgot-password" asChild>
                  <Pressable>
                    <Text style={s.forgotLink}>Esqueci minha senha</Text>
                  </Pressable>
                </Link>
              ) : null}
            </View>
            <View style={s.inputRow}>
              <TextInput
                autoCapitalize="none"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.inkMute}
                style={[s.input, s.inputWithIcon]}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable style={s.eyeButton} onPress={() => setShowPassword(prev => !prev)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={colors.inkMute}
                />
              </Pressable>
            </View>
          </View>

          {message ? <Text style={s.successText}>{message}</Text> : null}
          {error   ? <Text style={s.errorText}>{error}</Text>     : null}

          <Pressable
            style={[s.primaryButton, isSubmitting && s.primaryButtonDisabled]}
            onPress={() => void handlePasswordAction()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={palette.navy800} />
            ) : (
              <Text style={s.primaryButtonLabel}>{isRegister ? 'Criar conta' : 'Entrar'}</Text>
            )}
          </Pressable>

          <View style={s.orRow}>
            <View style={s.orLine} />
            <Text style={s.orLabel}>ou</Text>
            <View style={s.orLine} />
          </View>

          <Pressable style={s.socialButton} onPress={() => void handleSocialAuth('google')} disabled={isSubmitting}>
            <View style={s.socialIconShell}>
              <Text style={s.socialIconLabel}>G</Text>
            </View>
            <Text style={s.socialButtonLabel}>{isRegister ? 'Continuar com Google' : 'Entrar com Google'}</Text>
          </Pressable>
        </View>

        {/* Footer switch */}
        <View style={s.footerRow}>
          <Text style={s.footerText}>{isRegister ? 'Já tem conta?' : 'Ainda não tem conta?'}</Text>
          <Link href={isRegister ? '/auth/login' : '/auth/register'} asChild>
            <Pressable>
              <Text style={s.footerLink}>{isRegister ? 'Entrar' : 'Registrar'}</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: c.background },
    content:  { flexGrow: 1, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 32, gap: 28 },

    brandBlock:    { alignItems: 'center', gap: 14 },
    logo:          { width: 120, height: 120 },
    wordmarkBlock: { alignItems: 'center', gap: 8 },
    brandName:     { color: c.ink, fontFamily: FontFamily.serifSemiBold, fontSize: 34, letterSpacing: 5 },
    dividerRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dividerLine:   { flex: 1, height: 1, backgroundColor: c.accent, maxWidth: 32, opacity: 0.5 },
    brandTagline:  { color: c.accent, fontFamily: FontFamily.sansMedium, fontSize: 12, letterSpacing: 0.5 },

    headingBlock: { alignItems: 'center', gap: 8 },
    heading:      { color: c.ink, fontFamily: FontFamily.serifSemiBold, fontSize: 24, letterSpacing: 0.3, textAlign: 'center' },
    subheading:   { color: c.inkMute, fontFamily: FontFamily.sansRegular, fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 300 },

    formBlock:     { gap: 14 },
    inputWrap:     { gap: 6 },
    inputLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 4, marginRight: 4 },
    inputLabel:    { color: c.inkMute, fontFamily: FontFamily.sansBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase' },
    forgotLink:    { color: c.accent, fontFamily: FontFamily.sansSemiBold, fontSize: 12 },
    inputRow:      { position: 'relative', justifyContent: 'center' },
    input: {
      minHeight: 54, borderRadius: 14, backgroundColor: c.surface,
      borderWidth: 1, borderColor: c.accentMuted,
      paddingHorizontal: 18, paddingVertical: 12,
      color: c.ink, fontFamily: FontFamily.sansRegular, fontSize: 15,
    },
    inputWithIcon: { paddingRight: 52 },
    eyeButton:     { position: 'absolute', right: 16, alignItems: 'center', justifyContent: 'center' },

    primaryButton:         { alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: c.accent, minHeight: 54, paddingHorizontal: 18, marginTop: 4 },
    primaryButtonDisabled: { opacity: 0.7 },
    primaryButtonLabel:    { color: palette.navy800, fontFamily: FontFamily.sansBold, fontSize: 17, letterSpacing: 0.3 },

    orRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
    orLine:  { flex: 1, height: 1, backgroundColor: c.hairline },
    orLabel: { color: c.inkMute, fontFamily: FontFamily.sansMedium, fontSize: 13 },

    socialButton:      { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: c.accentMuted, backgroundColor: c.surface, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    socialIconShell:   { width: 28, height: 28, borderRadius: 999, backgroundColor: c.accentMuted, alignItems: 'center', justifyContent: 'center' },
    socialIconLabel:   { color: c.accent, fontFamily: FontFamily.sansBold, fontSize: 14 },
    socialButtonLabel: { color: c.ink, fontFamily: FontFamily.sansSemiBold, fontSize: 15 },

    successText: { color: c.success, fontFamily: FontFamily.sansRegular, fontSize: 13, lineHeight: 20, textAlign: 'center' },
    errorText:   { color: c.danger,  fontFamily: FontFamily.sansRegular, fontSize: 13, lineHeight: 20, textAlign: 'center' },

    footerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    footerText: { color: c.inkMute, fontFamily: FontFamily.sansRegular, fontSize: 14 },
    footerLink: { color: c.accent,  fontFamily: FontFamily.sansBold,    fontSize: 14 },
  });
}
