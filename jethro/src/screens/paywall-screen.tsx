import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JethroColors } from '@/constants/theme';
import { subscriptionService } from '@/src/services/subscription/subscription-service';

const features = [
  { icon: '✦', label: 'Diagnóstico do negócio por IA', sub: 'Motor v2.8 com 9 modelos A–I + X' },
  { icon: '◈', label: 'Plano de 24 semanas personalizado', sub: 'Gerado pela Alma do Rogério + Claude' },
  { icon: '◆', label: 'Mentor IA disponível 24/7', sub: 'Chat com o Jethro em qualquer momento' },
  { icon: '◉', label: 'Biblioteca PBN completa', sub: '14 guias × 7 pilares do negócio' },
  { icon: '●', label: 'Gate de avanço semanal', sub: 'Progresso medido e desbloqueado com disciplina' },
];

export function PaywallScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const checkAndProceed = useCallback(async () => {
    setVerifying(true);
    try {
      const status = await subscriptionService.getStatus();
      if (status && ['active', 'trial', 'grace_period'].includes(status.status)) {
        router.replace('/onboarding');
      } else {
        Alert.alert(
          'Pagamento não detectado',
          'Completa o pagamento no checkout e toca em "Verificar" para continuar.',
          [{ text: 'OK' }]
        );
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível verificar o estado. Tenta novamente.');
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
        controlsColor: JethroColors.gold,
      });
      // After browser closes, auto-check
      await checkAndProceed();
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o checkout. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  }, [checkAndProceed]);

  const handleSandbox = useCallback(async () => {
    setLoading(true);
    try {
      await subscriptionService.activateSandbox();
      router.replace('/onboarding');
    } catch {
      Alert.alert('Erro', 'Activação sandbox falhou.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>✦ Jethro Mentor PBN</Text>
          <Text style={styles.title}>O teu negócio merece{'\n'}uma rota clara</Text>
          <Text style={styles.subtitle}>
            Diagnóstico feito. Agora ativa o plano completo e começa a semana 1.
          </Text>
        </View>

        {/* Pricing card */}
        <View style={styles.pricingCard}>
          <View style={styles.pricingBadge}>
            <Text style={styles.pricingBadgeLabel}>Plano Pro</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingCurrency}>R$</Text>
            <Text style={styles.pricingAmount}>147</Text>
            <Text style={styles.pricingPeriod}>/mês</Text>
          </View>
          <Text style={styles.pricingNote}>Cancela quando quiseres · Sem contratos</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          {features.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <Pressable
          style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
          onPress={handleCheckout}
          disabled={loading || verifying}
        >
          {loading ? (
            <ActivityIndicator color={JethroColors.navy} />
          ) : (
            <Text style={styles.ctaBtnText}>Ativar plano — R$147/mês</Text>
          )}
        </Pressable>

        {/* Verificar após pagar */}
        <Pressable
          style={styles.verifyBtn}
          onPress={checkAndProceed}
          disabled={loading || verifying}
        >
          {verifying ? (
            <ActivityIndicator color={JethroColors.gold} size="small" />
          ) : (
            <Text style={styles.verifyBtnText}>Já paguei — verificar</Text>
          )}
        </Pressable>

        {/* Sandbox dev button */}
        <Pressable
          style={styles.sandboxBtn}
          onPress={handleSandbox}
          disabled={loading || verifying}
        >
          <Text style={styles.sandboxBtnText}>
            Modo sandbox — ativar sem pagamento
          </Text>
        </Pressable>

        <Text style={styles.legal}>
          Ao prosseguir aceitas os Termos de Serviço. Pagamento processado por Stripe com encriptação
          de ponta a ponta.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: JethroColors.navy },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 24, paddingTop: 24 },
  header: { marginBottom: 28, gap: 10 },
  eyebrow: {
    fontSize: 12, fontWeight: '700', color: JethroColors.gold,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  title: { fontSize: 30, fontWeight: '800', color: JethroColors.creme, lineHeight: 38 },
  subtitle: { fontSize: 15, color: JethroColors.muted, lineHeight: 22 },
  pricingCard: {
    backgroundColor: JethroColors.navySurface, borderRadius: 20,
    borderWidth: 1, borderColor: JethroColors.gold, padding: 24,
    alignItems: 'center', marginBottom: 20, gap: 8,
  },
  pricingBadge: {
    backgroundColor: JethroColors.goldMuted, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  pricingBadgeLabel: { fontSize: 12, fontWeight: '700', color: JethroColors.gold, letterSpacing: 1 },
  pricingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  pricingCurrency: { fontSize: 22, fontWeight: '700', color: JethroColors.creme, paddingBottom: 4 },
  pricingAmount: { fontSize: 56, fontWeight: '800', color: JethroColors.creme, lineHeight: 64 },
  pricingPeriod: { fontSize: 18, color: JethroColors.muted, paddingBottom: 8 },
  pricingNote: { fontSize: 13, color: JethroColors.muted },
  featuresCard: {
    backgroundColor: JethroColors.navySurface, borderRadius: 16,
    borderWidth: 1, borderColor: JethroColors.navyDeep,
    padding: 20, marginBottom: 24, gap: 16,
  },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  featureIcon: { fontSize: 18, color: JethroColors.gold, width: 24, textAlign: 'center', marginTop: 1 },
  featureText: { flex: 1, gap: 2 },
  featureLabel: { fontSize: 15, fontWeight: '600', color: JethroColors.creme },
  featureSub: { fontSize: 12, color: JethroColors.muted },
  ctaBtn: {
    backgroundColor: JethroColors.gold, borderRadius: 14,
    paddingVertical: 17, alignItems: 'center', marginBottom: 12,
    shadowColor: JethroColors.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  ctaBtnDisabled: { opacity: 0.7 },
  ctaBtnText: { fontSize: 16, fontWeight: '800', color: JethroColors.navy },
  verifyBtn: {
    borderWidth: 1.5, borderColor: JethroColors.gold, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginBottom: 12,
  },
  verifyBtnText: { fontSize: 15, fontWeight: '600', color: JethroColors.gold },
  sandboxBtn: {
    borderWidth: 1, borderColor: JethroColors.navySurface, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', marginBottom: 20,
    borderStyle: 'dashed',
  },
  sandboxBtnText: { fontSize: 13, color: JethroColors.muted },
  legal: {
    fontSize: 11, color: JethroColors.muted, textAlign: 'center',
    lineHeight: 17, paddingHorizontal: 8,
  },
});
