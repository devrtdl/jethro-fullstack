import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { homeService } from '@/src/services/home/home-service';
import { onboardingService } from '@/src/services/onboarding/onboarding-service';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';
import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, Spacing, getShadow } from '@/src/theme/spacing';

type OnboardingSummary = Record<string, unknown>;

const SUMMARY_LABELS: Record<string, string> = {
  nome_completo: 'Nome', email: 'E-mail', setor: 'Setor',
  modelo_confirmado: 'Modelo de negócio', receita_atual: 'Receita actual',
  ticket_medio: 'Ticket médio', clientes_ativos_total: 'Clientes activos',
  anos_negocio: 'Anos de negócio', maior_desafio: 'Maior desafio', meta_90_dias: 'Meta 90 dias',
};

const STEPS = [
  { icon: '◈', text: 'A IA analisa o teu diagnóstico e onboarding' },
  { icon: '◆', text: 'Cria o plano de 24 semanas personalizado' },
  { icon: '◉', text: 'Prepara o conteúdo completo da semana 1' },
  { icon: '●', text: 'Activa o gate de avanço e finaliza' },
];

const STEP_INTERVAL_MS = 20_000;
const POLL_INTERVAL_MS = 3_000;
const MAX_WAIT_MS      = 5 * 60 * 1000;

export function OnboardingResultScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [summary,    setSummary]    = useState<OnboardingSummary | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (stepRef.current) { clearInterval(stepRef.current); stepRef.current = null; }
  }, []);

  const startPolling = useCallback(() => {
    startTimeRef.current = Date.now();
    setActiveStep(0);
    stepRef.current = setInterval(() => {
      setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, STEP_INTERVAL_MS);
    pollRef.current = setInterval(async () => {
      if (Date.now() - startTimeRef.current > MAX_WAIT_MS) {
        stopPolling();
        setGenerating(false);
        Alert.alert('Tempo esgotado', 'A geração está a demorar mais que o esperado. Tenta novamente.');
        return;
      }
      try {
        const status = await homeService.getPlanoStatus();
        if (status.status === 'ready') { stopPolling(); router.replace('/(tabs)'); }
        else if (status.status === 'error') {
          stopPolling(); setGenerating(false);
          Alert.alert('Erro', status.error ?? 'Erro ao gerar plano. Tenta novamente.');
        }
      } catch {}
    }, POLL_INTERVAL_MS);
  }, [router, stopPolling]);

  useEffect(() => {
    void (async () => {
      try {
        const [data, status] = await Promise.all([
          onboardingService.getSummary().catch(() => null),
          homeService.getPlanoStatus().catch(() => null),
        ]);
        if (data) setSummary(data as OnboardingSummary);
        if (status?.status === 'ready') { router.replace('/(tabs)'); return; }
        if (status?.status === 'generating') { setGenerating(true); startPolling(); }
      } finally { setLoading(false); }
    })();
    return stopPolling;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGeneratePlan = useCallback(async () => {
    setGenerating(true);
    try {
      const result = await homeService.generatePlano();
      if (result.status === 'ready') { router.replace('/(tabs)'); return; }
      startPolling();
    } catch (e: unknown) {
      setGenerating(false);
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao iniciar geração. Tenta novamente.');
    }
  }, [router, startPolling]);

  const visibleFields = summary
    ? Object.entries(SUMMARY_LABELS)
        .map(([key, label]) => ({ key, label, value: summary[key] }))
        .filter((f) => f.value != null && String(f.value).trim() !== '')
    : [];

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, s.center]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.checkmark}>✦</Text>
          <Text style={s.title}>Onboarding concluído!</Text>
          <Text style={s.subtitle}>O Jethro já conhece o teu negócio. Agora vamos criar o teu plano de 24 semanas.</Text>
        </View>

        {visibleFields.length > 0 && !generating && (
          <View style={s.card}>
            <Text style={s.cardTitle}>O que o Jethro sabe de ti</Text>
            {visibleFields.map((f) => (
              <View key={f.key} style={s.summaryRow}>
                <Text style={s.summaryLabel}>{f.label}</Text>
                <Text style={s.summaryValue}>{String(f.value)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.card}>
          <Text style={s.cardTitle}>O que acontece a seguir</Text>
          {STEPS.map((step, i) => {
            const isDone   = generating && i < activeStep;
            const isActive = generating && i === activeStep;
            return (
              <View key={step.text} style={s.stepRow}>
                <Text style={[s.stepIcon, (isDone || isActive) && s.stepIconActive]}>
                  {isDone ? '✓' : isActive ? '⟳' : step.icon}
                </Text>
                <Text style={[s.stepText, isDone && s.stepTextDone, isActive && s.stepTextActive]}>
                  {step.text}
                </Text>
              </View>
            );
          })}
          <Text style={s.timeNote}>
            {generating ? '⏱ A processar… normalmente menos de 1 minuto' : '⏱ Normalmente menos de 1 minuto'}
          </Text>
        </View>

        <Pressable
          style={[s.ctaBtn, generating && s.ctaBtnDisabled]}
          onPress={() => void handleGeneratePlan()}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color={palette.navy800} size="small" />
          ) : (
            <Text style={s.ctaBtnText}>✦ Gerar o meu plano de ação</Text>
          )}
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe:      { flex: 1, backgroundColor: c.background },
    center:    { justifyContent: 'center', alignItems: 'center' },
    scroll:    { flex: 1 },
    container: { paddingHorizontal: Spacing.screenH, paddingTop: 24 },

    header:    { alignItems: 'center', marginBottom: 28, gap: 12 },
    checkmark: { fontFamily: FontFamily.sansRegular, fontSize: 48, color: c.accent },
    title:     { fontFamily: FontFamily.serifSemiBold, fontSize: 28, color: c.ink, textAlign: 'center' },
    subtitle:  { fontFamily: FontFamily.sansRegular, fontSize: 15, color: c.inkMute, lineHeight: 22, textAlign: 'center' },

    card: {
      backgroundColor: c.surface,
      borderRadius:    Radius.md,
      borderWidth:     StyleSheet.hairlineWidth,
      borderColor:     c.hairline,
      padding:         18,
      marginBottom:    20,
      gap:             12,
      ...getShadow(1),
    },
    cardTitle: {
      fontFamily:    FontFamily.sansBold,
      fontSize:      11,
      color:         c.accent,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },

    summaryRow: {
      flexDirection:  'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.hairline,
      gap: 12,
    },
    summaryLabel: { fontFamily: FontFamily.sansRegular,  fontSize: 13, color: c.inkMute, flex: 1 },
    summaryValue: { fontFamily: FontFamily.sansMedium,   fontSize: 13, color: c.ink,     flex: 2, textAlign: 'right' },

    stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepIcon:     { fontFamily: FontFamily.sansRegular, fontSize: 16, color: c.inkMute, width: 20, textAlign: 'center' },
    stepIconActive: { color: c.accent },
    stepText:     { fontFamily: FontFamily.sansRegular,  fontSize: 14, color: c.inkSoft, flex: 1, lineHeight: 20 },
    stepTextActive: { fontFamily: FontFamily.sansSemiBold, color: c.ink },
    stepTextDone:   { color: c.accent },
    timeNote:     { fontFamily: FontFamily.sansRegular, fontSize: 12, color: c.inkMute, marginTop: 4 },

    ctaBtn: {
      backgroundColor:  c.accent,
      borderRadius:     Radius.button,
      paddingVertical:  17,
      alignItems:       'center',
      flexDirection:    'row',
      justifyContent:   'center',
      gap:              10,
      marginBottom:     12,
      shadowColor:      c.accent,
      shadowOffset:     { width: 0, height: 4 },
      shadowOpacity:    0.3,
      shadowRadius:     10,
      elevation:        6,
    },
    ctaBtnDisabled: { opacity: 0.7 },
    ctaBtnText:     { fontFamily: FontFamily.sansBold, fontSize: 16, color: palette.navy800 },
  });
}
