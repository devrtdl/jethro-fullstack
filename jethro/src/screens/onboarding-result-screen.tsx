import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { homeService } from '@/src/services/home/home-service';
import { onboardingService } from '@/src/services/onboarding/onboarding-service';

type OnboardingSummary = Record<string, unknown>;

const SUMMARY_LABELS: Record<string, string> = {
  nome_completo: 'Nome',
  email: 'E-mail',
  setor: 'Setor',
  modelo_confirmado: 'Modelo de negócio',
  receita_atual: 'Receita actual',
  ticket_medio: 'Ticket médio',
  clientes_ativos_total: 'Clientes activos',
  anos_negocio: 'Anos de negócio',
  maior_desafio: 'Maior desafio',
  meta_90_dias: 'Meta 90 dias',
};

export function OnboardingResultScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<OnboardingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await onboardingService.getSummary();
        setSummary(data as OnboardingSummary);
      } catch {
        // Not critical — proceed even without summary
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleGeneratePlan = useCallback(async () => {
    setGenerating(true);
    try {
      await homeService.generatePlano();
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao gerar plano. Tenta novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setGenerating(false);
    }
  }, [router]);

  const visibleFields = summary
    ? Object.entries(SUMMARY_LABELS)
        .map(([key, label]) => ({ key, label, value: summary[key] }))
        .filter((f) => f.value != null && String(f.value).trim() !== '')
    : [];

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color={JethroColors.gold} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.checkmark}>✦</Text>
          <Text style={styles.title}>Onboarding concluído!</Text>
          <Text style={styles.subtitle}>
            O Jethro já conhece o teu negócio. Agora vamos criar o teu plano de 24 semanas.
          </Text>
        </View>

        {/* Summary */}
        {visibleFields.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>O que o Jethro sabe de ti</Text>
            {visibleFields.map((f) => (
              <View key={f.key} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{f.label}</Text>
                <Text style={styles.summaryValue}>{String(f.value)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* What happens next */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>O que acontece a seguir</Text>
          {[
            { icon: '◈', text: 'A IA analisa o teu diagnóstico e onboarding' },
            { icon: '◆', text: 'Cria um plano de 24 semanas personalizado' },
            { icon: '◉', text: 'Estrutura as tarefas semana a semana' },
            { icon: '●', text: 'Activa o gate de avanço da semana 1' },
          ].map((s) => (
            <View key={s.text} style={styles.stepRow}>
              <Text style={styles.stepIcon}>{s.icon}</Text>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          ))}
          <Text style={styles.timeNote}>⏱ Demora ~30 segundos</Text>
        </View>

        {/* CTA */}
        <Pressable
          style={[styles.ctaBtn, generating && styles.ctaBtnDisabled]}
          onPress={() => void handleGeneratePlan()}
          disabled={generating}
        >
          {generating ? (
            <>
              <ActivityIndicator color={JethroColors.navy} />
              <Text style={styles.ctaBtnText}>A gerar o teu plano...</Text>
            </>
          ) : (
            <Text style={styles.ctaBtnText}>✦ Gerar o meu plano de ação</Text>
          )}
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: JethroColors.navy },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 24 },
  header: { alignItems: 'center', marginBottom: 28, gap: 12 },
  checkmark: { fontSize: 48, color: JethroColors.gold },
  title: { fontSize: 28, fontWeight: '800', color: JethroColors.creme, textAlign: 'center' },
  subtitle: { fontSize: 15, color: JethroColors.muted, lineHeight: 22, textAlign: 'center' },
  summaryCard: {
    backgroundColor: JethroColors.navySurface, borderRadius: 16,
    borderWidth: 1, borderColor: JethroColors.navyDeep,
    padding: 18, marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 12, fontWeight: '700', color: JethroColors.gold,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: JethroColors.navyDeep,
    gap: 12,
  },
  summaryLabel: { fontSize: 13, color: JethroColors.muted, flex: 1 },
  summaryValue: { fontSize: 13, color: JethroColors.creme, fontWeight: '600', flex: 2, textAlign: 'right' },
  stepsCard: {
    backgroundColor: JethroColors.navySurface, borderRadius: 16,
    borderWidth: 1, borderColor: JethroColors.navyDeep,
    padding: 18, marginBottom: 24, gap: 14,
  },
  stepsTitle: {
    fontSize: 12, fontWeight: '700', color: JethroColors.gold,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: { fontSize: 16, color: JethroColors.gold, width: 20, textAlign: 'center' },
  stepText: { fontSize: 14, color: JethroColors.cremeMuted, flex: 1, lineHeight: 20 },
  timeNote: { fontSize: 12, color: JethroColors.muted, marginTop: 4 },
  ctaBtn: {
    backgroundColor: JethroColors.gold, borderRadius: 14, paddingVertical: 17,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10,
    shadowColor: JethroColors.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  ctaBtnDisabled: { opacity: 0.7 },
  ctaBtnText: { fontSize: 16, fontWeight: '800', color: JethroColors.navy },
});
