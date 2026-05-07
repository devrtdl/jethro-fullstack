import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthHeaders } from '@/src/lib/auth-headers';
import { subscriptionService } from '@/src/services/subscription/subscription-service';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';
import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, Spacing, getShadow } from '@/src/theme/spacing';
import { EyebrowLabel } from '@/src/components/ui/EyebrowLabel';

const features = [
  { icon: '✦', label: 'Diagnóstico do negócio por IA',        sub: 'Motor v2.8 com 9 modelos A–I + X' },
  { icon: '◈', label: 'Plano de 24 semanas personalizado',     sub: 'Gerado pela Alma do Rogério + Claude' },
  { icon: '◆', label: 'Mentor IA disponível 24/7',             sub: 'Chat com o Jethro em qualquer momento' },
  { icon: '◉', label: 'Biblioteca PBN completa',               sub: '14 guias × 7 pilares do negócio' },
  { icon: '●', label: 'Gate de avanço semanal',                sub: 'Progresso medido e desbloqueado com disciplina' },
];

export function PaywallScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [loading,   setLoading]   = useState(false);
  const [verifying, setVerifying] = useState(false);

  const checkAndProceed = useCallback(async () => {
    setVerifying(true);
    try {
      const status = await subscriptionService.getStatus();
      if (status && ['active', 'trial', 'grace_period'].includes(status.status)) {
        router.replace('/onboarding');
      } else {
        Alert.alert('Pagamento não detectado', 'Completa o pagamento no checkout e toca em "Verificar" para continuar.', [{ text: 'OK' }]);
      }
    } catch (e) {
      Alert.alert('Erro ao verificar', e instanceof Error ? e.message : String(e), [{ text: 'OK' }]);
    } finally {
      setVerifying(false);
    }
  }, [router]);

  const handleCheckout = useCallback(async () => {
    setLoading(true);
    try {
      const { url } = await subscriptionService.createCheckout();
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: palette.gold500,
      });
      await checkAndProceed();
    } catch (e) {
      Alert.alert('Erro no checkout', e instanceof Error ? e.message : String(e), [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  }, [checkAndProceed]);

  const handleSandbox = useCallback(async () => {
    setLoading(true);
    const headers = await getAuthHeaders();
    const hasToken = 'Authorization' in headers;
    if (!hasToken) {
      setLoading(false);
      Alert.alert('Sem sessão', 'Token de autenticação ausente. Faz logout e login novamente.', [{ text: 'OK' }]);
      return;
    }
    try {
      await subscriptionService.activateSandbox();
      router.replace('/onboarding');
    } catch (e) {
      Alert.alert('Erro no sandbox', e instanceof Error ? e.message : String(e), [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <EyebrowLabel>✦ Jethro Mentor PBN</EyebrowLabel>
          <Text style={s.title}>O teu negócio merece{'\n'}uma rota clara</Text>
          <Text style={s.subtitle}>Diagnóstico feito. Agora ativa o plano completo e começa a semana 1.</Text>
        </View>

        {/* Pricing card — usa surfaceFeature (navy) para destaque em ambos os modos */}
        <View style={s.pricingCard}>
          <View style={s.pricingBadge}>
            <Text style={s.pricingBadgeLabel}>Plano Pro</Text>
          </View>
          <View style={s.pricingRow}>
            <Text style={s.pricingCurrency}>R$</Text>
            <Text style={s.pricingAmount}>147</Text>
            <Text style={s.pricingPeriod}>/mês</Text>
          </View>
          <Text style={s.pricingNote}>Cancela quando quiseres · Sem contratos</Text>
        </View>

        {/* Features */}
        <View style={s.featuresCard}>
          {features.map((f) => (
            <View key={f.label} style={s.featureRow}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <View style={s.featureText}>
                <Text style={s.featureLabel}>{f.label}</Text>
                <Text style={s.featureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <Pressable
          style={[s.ctaBtn, loading && s.ctaBtnDisabled]}
          onPress={handleCheckout}
          disabled={loading || verifying}
        >
          {loading
            ? <ActivityIndicator color={palette.navy800} />
            : <Text style={s.ctaBtnText}>Ativar plano — R$147/mês</Text>
          }
        </Pressable>

        <Pressable style={s.verifyBtn} onPress={checkAndProceed} disabled={loading || verifying}>
          {verifying
            ? <ActivityIndicator color={colors.accent} size="small" />
            : <Text style={s.verifyBtnText}>Já paguei — verificar</Text>
          }
        </Pressable>

        <Pressable style={s.sandboxBtn} onPress={handleSandbox} disabled={loading || verifying}>
          <Text style={s.sandboxBtnText}>Modo sandbox — ativar sem pagamento</Text>
        </Pressable>

        <Text style={s.legal}>
          Ao prosseguir aceitas os Termos de Serviço. Pagamento processado por Stripe com encriptação de ponta a ponta.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe:      { flex: 1, backgroundColor: c.background },
    scroll:    { flex: 1 },
    container: { paddingHorizontal: Spacing.screenH, paddingTop: 24 },

    header:   { marginBottom: 28, gap: 10 },
    title:    { fontFamily: FontFamily.serifSemiBold, fontSize: 30, color: c.ink, lineHeight: 38 },
    subtitle: { fontFamily: FontFamily.sansRegular,   fontSize: 15, color: c.inkMute, lineHeight: 22 },

    // Pricing card — sempre navy para criar impacto
    pricingCard: {
      backgroundColor: palette.navy800,
      borderRadius:    Radius.hero,
      borderWidth:     1,
      borderColor:     palette.gold500,
      padding:         24,
      alignItems:      'center',
      marginBottom:    20,
      gap:             8,
      ...getShadow(2),
    },
    pricingBadge: {
      backgroundColor:  palette.goldMuted,
      borderRadius:     20,
      paddingHorizontal: 14,
      paddingVertical:   5,
    },
    pricingBadgeLabel: { fontFamily: FontFamily.sansBold, fontSize: 12, color: palette.gold500, letterSpacing: 1 },
    pricingRow:        { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
    pricingCurrency:   { fontFamily: FontFamily.sansBold, fontSize: 22, color: palette.paper, paddingBottom: 4 },
    pricingAmount:     { fontFamily: FontFamily.serifSemiBold, fontSize: 56, color: palette.paper, lineHeight: 64 },
    pricingPeriod:     { fontFamily: FontFamily.sansRegular, fontSize: 18, color: 'rgba(239,239,234,0.55)', paddingBottom: 8 },
    pricingNote:       { fontFamily: FontFamily.sansRegular, fontSize: 13, color: 'rgba(239,239,234,0.55)' },

    // Features card
    featuresCard: {
      backgroundColor: c.surface,
      borderRadius:    Radius.md,
      borderWidth:     StyleSheet.hairlineWidth,
      borderColor:     c.hairline,
      padding:         20,
      marginBottom:    24,
      gap:             16,
      ...getShadow(1),
    },
    featureRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    featureIcon: { fontFamily: FontFamily.sansRegular, fontSize: 18, color: c.accent, width: 24, textAlign: 'center', marginTop: 1 },
    featureText: { flex: 1, gap: 2 },
    featureLabel:{ fontFamily: FontFamily.sansSemiBold, fontSize: 15, color: c.ink },
    featureSub:  { fontFamily: FontFamily.sansRegular,  fontSize: 12, color: c.inkMute },

    ctaBtn: {
      backgroundColor:  palette.gold500,
      borderRadius:     Radius.button,
      paddingVertical:  17,
      alignItems:       'center',
      marginBottom:     12,
      shadowColor:      palette.gold500,
      shadowOffset:     { width: 0, height: 4 },
      shadowOpacity:    0.3,
      shadowRadius:     10,
      elevation:        6,
    },
    ctaBtnDisabled: { opacity: 0.7 },
    ctaBtnText:     { fontFamily: FontFamily.sansBold, fontSize: 16, color: palette.navy800 },

    verifyBtn:     { borderWidth: 1.5, borderColor: c.accent, borderRadius: Radius.button, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
    verifyBtnText: { fontFamily: FontFamily.sansSemiBold, fontSize: 15, color: c.accent },

    sandboxBtn:     { borderWidth: 1, borderColor: c.hairline, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center', marginBottom: 20, borderStyle: 'dashed' },
    sandboxBtnText: { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkMute },

    legal: { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute, textAlign: 'center', lineHeight: 17, paddingHorizontal: 8 },
  });
}
