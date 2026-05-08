import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuthSession } from '@/src/hooks/use-auth-session';
import { homeService, type HomeData } from '@/src/services/home/home-service';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';
import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { getShadow, Radius, Spacing } from '@/src/theme/spacing';
import { EyebrowLabel } from '@/src/components/ui/EyebrowLabel';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { GhostButton } from '@/src/components/ui/GhostButton';
import { FeatureCard } from '@/src/components/ui/FeatureCard';
import { SectionCard } from '@/src/components/section-card';

function getUserFirstName(email: string): string {
  return email.split('@')[0]?.split('.')[0] ?? 'Empresário';
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  });
}

function faseLabel(fase: string): string {
  const map: Record<string, string> = {
    fundamento: 'Fundamento', estrutura: 'Estrutura', controlo: 'Controle',
    crescimento: 'Crescimento', escala: 'Escala', legado: 'Legado',
  };
  return map[fase] ?? fase;
}

function formatKpiValue(val: string | number | null): string {
  if (val == null) return '—';
  return String(val);
}

type CheckInModalProps = {
  visible:  boolean;
  onClose:  () => void;
  onSubmit: (cumpriu: boolean, nota: string) => void;
  loading:  boolean;
};

function CheckInModal({ visible, onClose, onSubmit, loading }: CheckInModalProps) {
  const { colors } = useTheme();
  const m = useMemo(() => makeModalStyles(colors), [colors]);
  const [cumpriu, setCumpriu] = useState<boolean | null>(null);
  const [nota,    setNota]    = useState('');

  function handleSubmit() {
    if (cumpriu === null) return;
    onSubmit(cumpriu, nota);
    setCumpriu(null);
    setNota('');
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={m.overlay} onPress={onClose}>
        <Pressable style={m.sheet} onPress={() => {}}>
          <View style={m.handle} />
          <Text style={m.title}>Check-in do dia</Text>
          <Text style={m.sub}>Registre o seu dia de trabalho. Após 5 dias, o gate de avanço abre.</Text>

          <Text style={m.question}>Cumpri as tarefas de hoje?</Text>
          <View style={m.yesNoRow}>
            <Pressable style={[m.yesNoBtn, cumpriu === true  && m.yesNoBtnActive]}   onPress={() => setCumpriu(true)}>
              <Text style={[m.yesNoText, cumpriu === true  && m.yesNoTextActive]}>✓ Sim</Text>
            </Pressable>
            <Pressable style={[m.yesNoBtn, cumpriu === false && m.yesNoBtnActiveNo]} onPress={() => setCumpriu(false)}>
              <Text style={[m.yesNoText, cumpriu === false && m.yesNoTextActive]}>✗ Não</Text>
            </Pressable>
          </View>

          <TextInput
            style={m.input}
            placeholder="Nota do dia (opcional)"
            placeholderTextColor={colors.inkMute}
            value={nota}
            onChangeText={setNota}
            multiline
            maxLength={300}
          />

          <PrimaryButton
            label="Registrar dia"
            onPress={handleSubmit}
            loading={loading}
            disabled={cumpriu === null}
            accessibilityLabel="Registrar dia de trabalho"
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeModalStyles(c: ThemeColors) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(11,31,59,0.55)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 40, gap: 0, ...getShadow(2),
    },
    handle:           { width: 40, height: 4, backgroundColor: c.hairline, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    title:            { fontFamily: FontFamily.serifSemiBold, fontSize: 20, color: c.ink,    marginBottom: 6 },
    sub:              { fontFamily: FontFamily.sansRegular,   fontSize: 13, color: c.inkMute, lineHeight: 19, marginBottom: 20 },
    question:         { fontFamily: FontFamily.sansSemiBold,  fontSize: 15, color: c.ink,    marginBottom: 12 },
    yesNoRow:         { flexDirection: 'row', gap: 12, marginBottom: 16 },
    yesNoBtn:         { flex: 1, paddingVertical: 13, borderRadius: Radius.xs, borderWidth: 1.5, borderColor: c.hairline, alignItems: 'center', backgroundColor: c.surface },
    yesNoBtnActive:   { borderColor: c.accent,   backgroundColor: c.accentMuted },
    yesNoBtnActiveNo: { borderColor: c.liveRed,  backgroundColor: 'rgba(226,72,60,0.08)' },
    yesNoText:        { fontFamily: FontFamily.sansSemiBold, fontSize: 15, color: c.inkMute },
    yesNoTextActive:  { color: c.ink },
    input: {
      backgroundColor: c.background, borderRadius: Radius.xs, padding: 14,
      fontFamily: FontFamily.sansRegular, fontSize: 14, color: c.ink,
      minHeight: 72, textAlignVertical: 'top', marginBottom: 16,
      borderWidth: 1, borderColor: c.hairline,
    },
  });
}

export function InicioScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const { colors, colorScheme, toggleColorScheme } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [data,           setData]           = useState<HomeData | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [checkInVisible, setCheckInVisible] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [advancingGate,  setAdvancingGate]  = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [focusStatus,    setFocusStatus]    = useState<'done' | 'ongoing' | null>(null);

  const userEmail = session?.user?.email ?? '';
  const firstName = getUserFirstName(userEmail);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const homeData = await homeService.getHomeData();
      setData(homeData);
    } catch {
      setError('Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  const handleGeneratePlan = useCallback(async () => {
    setGeneratingPlan(true);
    try {
      await homeService.generatePlano();
      await loadData();
    } catch {
      setError('Não foi possível gerar o plano. Tenta novamente.');
    } finally {
      setGeneratingPlan(false);
    }
  }, [loadData]);

  const handleCheckIn = useCallback(async (cumpriu: boolean, nota: string) => {
    setCheckInLoading(true);
    try {
      const result = await homeService.checkIn(cumpriu, nota);
      setCheckInVisible(false);
      if (result.skipped && result.reason === 'already_done_today') {
        Alert.alert('Já registrado', 'Você já fez o check-in de hoje. Volte amanhã!');
        return;
      }
      await loadData();
      if (result.gateDesbloqueado) {
        Alert.alert('🎉 Gate desbloqueado!', 'Você completou 5 dias de trabalho. Pode avançar para a próxima semana!');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar o check-in.');
    } finally {
      setCheckInLoading(false);
    }
  }, [loadData]);

  const handleGateAdvance = useCallback(async () => {
    setAdvancingGate(true);
    try {
      const result = await homeService.gateAdvance();
      if (!result.advanced) {
        const msg = result.reason === 'insufficient_checkins'
          ? 'Ainda não há check-ins suficientes para avançar.'
          : 'Não foi possível avançar.';
        Alert.alert('Ainda não', msg);
        return;
      }
      await loadData();
      if (result.programaConcluido) {
        Alert.alert('🏆 Programa concluído!', 'Você completou as 24 semanas do Programa PBN. Parabéns!');
      } else {
        Alert.alert(`Semana ${result.proximaSemana} desbloqueada`, 'Seu plano avançou. Bom trabalho!');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível avançar o gate.');
    } finally {
      setAdvancingGate(false);
    }
  }, [loadData]);

  const devocional         = data?.devocional ?? null;
  const plano              = data?.plano      ?? null;
  const kpis               = data?.kpis       ?? null;
  const onboardingCompleto = data?.onboardingCompleto ?? false;

  const checkInsCount       = plano?.checkInsCount       ?? 0;
  const checkInsNecessarios = plano?.checkInsNecessarios ?? 5;
  const todayCheckedIn      = plano?.todayCheckedIn      ?? false;
  const gateProgress        = checkInsCount / checkInsNecessarios;
  const gateUnlocked        = plano?.gateStatus === 'available' && checkInsCount >= checkInsNecessarios;

  const andamentoStatus = gateUnlocked ? 'GATE DESBLOQUEADO' : 'EM ANDAMENTO';
  const andamentoPct    = Math.round(Math.min(gateProgress, 1) * 100);

  const tarefas         = plano?.tarefas ?? [];
  const completadas     = tarefas.filter(t => t.completada).length;
  const totalTarefas    = tarefas.length;
  const progressoPct    = totalTarefas > 0 ? Math.round((completadas / totalTarefas) * 100) : 0;
  const acaoPrincipal   = tarefas[0] ?? null;

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, s.center]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{getGreeting()}, {firstName}</Text>
            <Text style={s.date}>{getFormattedDate()}</Text>
          </View>
          <Pressable
            style={s.themeToggle}
            onPress={toggleColorScheme}
            accessibilityRole="button"
            accessibilityLabel={colorScheme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            <Ionicons
              name={colorScheme === 'dark' ? 'bulb' : 'bulb-outline'}
              size={20}
              color={colorScheme === 'dark' ? palette.gold500 : colors.ink}
            />
          </Pressable>
        </View>

        {/* ── Erro ── */}
        {error ? (
          <Pressable style={s.errorBanner} onPress={loadData}>
            <Text style={s.errorText}>{error}</Text>
            <Text style={s.errorRetry}>Toca para tentar novamente</Text>
          </Pressable>
        ) : null}

        {/* ── Conteúdo principal ── */}
        {plano ? (
          <>
            {/* Âncora de propósito */}
            <FeatureCard style={s.anchoraCard}>
              <Text style={s.anchoraEyebrow}>✦ Âncora de propósito</Text>
              <Text style={s.anchoraText}>"{plano.objetivo}"</Text>
            </FeatureCard>

            {/* Princípio da semana */}
            <SectionCard style={s.principioCard}>
              <View style={s.principioIcon}>
                <Text style={s.principioIconText}>✦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <EyebrowLabel style={{ marginBottom: 4 }}>Princípio da semana</EyebrowLabel>
                <Text style={s.principioTitulo}>{plano.bloco ?? plano.tag ?? faseLabel(plano.fase)}</Text>
                <Text style={s.principioSub} numberOfLines={2}>{plano.objetivo}</Text>
              </View>
            </SectionCard>

            {/* Foco de hoje — HERO */}
            <View style={s.focoCard}>
              <EyebrowLabel style={{ marginBottom: 6 }}>Foco de hoje</EyebrowLabel>
              <Text style={s.focoTitle}>
                {acaoPrincipal?.texto ?? 'Complete a primeira ação da semana'}
              </Text>
              <View style={s.focoBtnRow}>
                <Pressable
                  style={[s.focoBtn, focusStatus === 'done' && s.focoBtnActive]}
                  onPress={() => setFocusStatus(prev => prev === 'done' ? null : 'done')}
                  accessibilityRole="button"
                >
                  <Text style={[s.focoBtnText, focusStatus === 'done' && s.focoBtnTextActive]}>✓ Feito</Text>
                </Pressable>
                <Pressable
                  style={[s.focoBtn, focusStatus === 'ongoing' && s.focoBtnActive]}
                  onPress={() => setFocusStatus(prev => prev === 'ongoing' ? null : 'ongoing')}
                  accessibilityRole="button"
                >
                  <Text style={[s.focoBtnText, focusStatus === 'ongoing' && s.focoBtnTextActive]}>◑ Em andamento</Text>
                </Pressable>
              </View>
              <Pressable
                style={s.focoLink}
                onPress={() => router.push('/mentor' as Parameters<typeof router.push>[0])}
                accessibilityRole="link"
              >
                <Text style={s.focoLinkText}>Pedir ajuda ao Jethro →</Text>
              </Pressable>
            </View>

            {/* Métricas 2:1 */}
            <View style={s.metricsRow}>
              <SectionCard style={s.progressoCard}>
                <EyebrowLabel style={{ marginBottom: 2 }}>Progresso</EyebrowLabel>
                <Text style={s.metricValue}>{completadas}/{totalTarefas}</Text>
                <View style={s.metricBar}>
                  <View style={[s.metricBarFill, { width: `${progressoPct}%` as `${number}%` }]} />
                </View>
                <Text style={s.metricLabel}>{completadas} ações concluídas</Text>
              </SectionCard>
              <SectionCard style={s.sequenciaCard}>
                <EyebrowLabel style={{ marginBottom: 2 }}>Sequência</EyebrowLabel>
                <Text style={s.metricValue}>{checkInsCount}</Text>
                <Text style={s.metricLabel}>dias de trabalho</Text>
                <Text style={{ fontSize: 18, marginTop: 2 }}>🔥</Text>
              </SectionCard>
            </View>

            {/* Gate de Avanço */}
            <View style={s.sectionHeaderRow}>
              <EyebrowLabel>Gate de Avanço</EyebrowLabel>
              <Pressable
                onPress={() => router.push('/(tabs)/biblioteca' as Parameters<typeof router.push>[0])}
                accessibilityRole="button"
                accessibilityLabel="Ver tudo na biblioteca"
              >
                <Text style={s.verTudo}>Ver tudo</Text>
              </Pressable>
            </View>

            <SectionCard style={s.andamentoCard}>
              <View style={s.andamentoInner}>
                <View style={s.andamentoCircle}>
                  <Text style={s.andamentoCircleText}>S{plano.semanaNumero}</Text>
                </View>
                <View style={s.andamentoContent}>
                  <Text style={s.andamentoEyebrow}>SEMANA {plano.semanaNumero} · {andamentoStatus}</Text>
                  <Text style={s.andamentoTitle} numberOfLines={2}>{plano.objetivo}</Text>
                  <View style={s.andamentoBarBg}>
                    <View style={[s.andamentoBarFill, { width: `${andamentoPct}%` as `${number}%` }]} />
                  </View>
                  <View style={s.andamentoMeta}>
                    <Text style={s.andamentoMetaLeft}>{checkInsCount}/{checkInsNecessarios} check-ins</Text>
                    <Text style={s.andamentoMetaRight}>{andamentoPct}%</Text>
                  </View>
                </View>
              </View>
            </SectionCard>

            {!gateUnlocked && (
              <GhostButton
                label={todayCheckedIn ? '✓ Check-in feito hoje' : '+ Registrar dia de trabalho'}
                onPress={() => setCheckInVisible(true)}
                disabled={todayCheckedIn}
                textColor={todayCheckedIn ? colors.success : colors.accent}
                style={todayCheckedIn ? s.checkInBtnDone : s.checkInBtn}
              />
            )}

            {gateUnlocked && (
              <PrimaryButton
                label={`Avançar para Semana ${plano.semanaNumero + 1} →`}
                onPress={() => void handleGateAdvance()}
                loading={advancingGate}
              />
            )}
          </>
        ) : !onboardingCompleto ? (
          <SectionCard style={s.emptyCard}>
            <Text style={s.emptyTitle}>Completa o onboarding</Text>
            <Text style={s.emptyText}>
              Para receber o seu plano personalizado, complete o onboarding primeiro.
            </Text>
          </SectionCard>
        ) : (
          <SectionCard style={s.emptyCard}>
            <Text style={s.emptyTitle}>Plano ainda não gerado</Text>
            <Text style={s.emptyText}>
              O Jethro vai criar o seu plano de 24 semanas personalizado com base no seu diagnóstico e onboarding.
            </Text>
            <PrimaryButton
              label={generatingPlan ? 'A gerar plano...' : '✦ Gerar o meu plano'}
              onPress={() => void handleGeneratePlan()}
              loading={generatingPlan}
              style={s.generateBtn}
            />
          </SectionCard>
        )}

        {/* ── Devocional ── */}
        {devocional ? (
          <FeatureCard style={s.devocionalCard}>
            <Text style={s.devocionalQuoteMark}>"</Text>
            <View style={s.devocionalHeader}>
              <EyebrowLabel color={palette.gold500}>Devocional do dia</EyebrowLabel>
              <Text style={s.devocionalRef}>{devocional.versiculo}</Text>
            </View>
            <Text style={s.devocionalVerso}>{devocional.titulo}</Text>
            <View style={s.divider} />
            <Text style={s.devocionalReflexao}>{devocional.texto}</Text>
          </FeatureCard>
        ) : null}

        {/* ── KPIs ── */}
        {kpis ? (
          <>
            <EyebrowLabel style={s.sectionLabel}>Indicadores</EyebrowLabel>
            <View style={s.kpiRow}>
              <SectionCard style={s.kpiCard}>
                <Text style={s.kpiValue}>{formatKpiValue(kpis.receitaAtual)}</Text>
                <EyebrowLabel size="sm" color={colors.inkMute}>Receita Atual</EyebrowLabel>
              </SectionCard>
              <SectionCard style={s.kpiCard}>
                <Text style={s.kpiValue}>{formatKpiValue(kpis.ticketMedio)}</Text>
                <EyebrowLabel size="sm" color={colors.inkMute}>Ticket Médio</EyebrowLabel>
              </SectionCard>
              <SectionCard style={s.kpiCard}>
                <Text style={s.kpiValue}>{formatKpiValue(kpis.clientesAtivos)}</Text>
                <EyebrowLabel size="sm" color={colors.inkMute}>Clientes Ativos</EyebrowLabel>
              </SectionCard>
            </View>
          </>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <Pressable
        style={s.fab}
        onPress={() => router.push('/mentor' as Parameters<typeof router.push>[0])}
        accessibilityLabel="Falar com Jethro"
        accessibilityRole="button"
      >
        <Text style={s.fabIcon}>✦</Text>
        <Text style={s.fabText}>Falar com Jethro</Text>
      </Pressable>

      <CheckInModal
        visible={checkInVisible}
        onClose={() => setCheckInVisible(false)}
        onSubmit={handleCheckIn}
        loading={checkInLoading}
      />
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe:   { flex: 1, backgroundColor: c.background },
    center: { justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1 },
    container: { paddingHorizontal: Spacing.screenH, paddingTop: 16 },

    header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    themeToggle: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline,
      justifyContent: 'center', alignItems: 'center', ...getShadow(1),
    },
    greeting: { fontFamily: FontFamily.serifMedium, fontSize: 22, color: c.ink,    textTransform: 'capitalize' },
    date:     { fontFamily: FontFamily.sansRegular,  fontSize: 13, color: c.inkMute, marginTop: 2, textTransform: 'capitalize' },

    sectionLabel: { marginBottom: 12 },

    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    verTudo:          { fontFamily: FontFamily.sansMedium, fontSize: 13, color: c.accent },

    errorBanner: { backgroundColor: 'rgba(226,72,60,0.08)', borderRadius: Radius.xs, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: c.liveRed },
    errorText:   { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.liveRed,  marginBottom: 4 },
    errorRetry:  { fontFamily: FontFamily.sansRegular, fontSize: 12, color: c.inkMute },

    anchoraCard:    { marginBottom: 16, paddingVertical: 18, paddingHorizontal: 18 },
    anchoraEyebrow: { fontFamily: FontFamily.sansSemiBold, fontSize: 10, color: 'rgba(212,175,55,0.75)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
    anchoraText:    { fontFamily: FontFamily.serifMediumItalic, fontSize: 16, color: palette.paper, lineHeight: 24 },

    principioCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, padding: 16 },
    principioIcon:     { width: 40, height: 40, borderRadius: Radius.icon, backgroundColor: palette.goldMuted, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    principioIconText: { fontFamily: FontFamily.serifSemiBold, fontSize: 18, color: palette.navy800 },
    principioTitulo:   { fontFamily: FontFamily.serifMedium, fontSize: 14, color: c.ink, lineHeight: 19, marginBottom: 2 },
    principioSub:      { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute, lineHeight: 17 },

    focoCard:       { backgroundColor: c.surface, borderRadius: Radius.md, padding: 16, borderWidth: 1.5, borderColor: palette.gold500, marginBottom: 16, gap: 10, ...getShadow(1) },
    focoTitle:      { fontFamily: FontFamily.serifMedium, fontSize: 17, color: c.ink, lineHeight: 25 },
    focoBtnRow:     { flexDirection: 'row', gap: 8 },
    focoBtn:        { flex: 1, height: 44, borderRadius: Radius.xs, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, justifyContent: 'center', alignItems: 'center' },
    focoBtnActive:  { backgroundColor: palette.navy800, borderColor: palette.navy800 },
    focoBtnText:    { fontFamily: FontFamily.sansMedium, fontSize: 13, color: c.inkSoft },
    focoBtnTextActive: { color: palette.paper },
    focoLink:       { alignItems: 'center', marginTop: 2 },
    focoLinkText:   { fontFamily: FontFamily.sansRegular, fontSize: 12, color: c.inkMute },

    metricsRow:   { flexDirection: 'row', gap: 10, marginBottom: 16 },
    progressoCard:{ flex: 2, padding: 14, gap: 4 },
    sequenciaCard:{ flex: 1, padding: 14, gap: 4 },
    metricValue:  { fontFamily: FontFamily.serifSemiBold, fontSize: 28, color: c.ink },
    metricLabel:  { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute },
    metricBar:    { height: 3, backgroundColor: c.hairline, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
    metricBarFill:{ height: '100%', backgroundColor: c.accent, borderRadius: 2 },

    andamentoCard:        { marginBottom: 16, padding: 14 },
    andamentoInner:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
    andamentoCircle:      { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.navy800, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    andamentoCircleText:  { fontFamily: FontFamily.serifSemiBold, fontSize: 14, color: palette.gold500 },
    andamentoContent:     { flex: 1, gap: 4 },
    andamentoEyebrow:     { fontFamily: FontFamily.sansBold, fontSize: 10, color: c.accent, letterSpacing: 0.5, textTransform: 'uppercase' },
    andamentoTitle:       { fontFamily: FontFamily.serifMedium, fontSize: 14, color: c.ink, lineHeight: 20 },
    andamentoBarBg:       { height: 3, backgroundColor: c.hairline, borderRadius: 2, overflow: 'hidden', marginTop: 2 },
    andamentoBarFill:     { height: '100%', backgroundColor: c.accent, borderRadius: 2 },
    andamentoMeta:        { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
    andamentoMetaLeft:    { fontFamily: FontFamily.sansRegular,  fontSize: 11, color: c.inkMute },
    andamentoMetaRight:   { fontFamily: FontFamily.sansSemiBold, fontSize: 11, color: c.accent },

    checkInBtn:     { borderColor: c.accent,  marginBottom: 24 },
    checkInBtnDone: { borderColor: c.success, marginBottom: 24 },

    emptyCard:   { marginBottom: 24, alignItems: 'center' },
    emptyTitle:  { fontFamily: FontFamily.serifMedium, fontSize: 16, color: c.ink,     marginBottom: 8 },
    emptyText:   { fontFamily: FontFamily.sansRegular,  fontSize: 13, color: c.inkSoft, lineHeight: 20, textAlign: 'center', marginBottom: 16 },
    generateBtn: { alignSelf: 'stretch' },

    devocionalCard:      { marginBottom: 24, marginTop: 8 },
    devocionalQuoteMark: { position: 'absolute', top: 10, right: 16, fontFamily: FontFamily.serifSemiBold, fontSize: 80, lineHeight: 80, color: palette.gold500, opacity: 0.18 },
    devocionalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    devocionalRef:       { fontFamily: FontFamily.sansRegular, fontSize: 11, color: palette.gold400 },
    devocionalVerso:     { fontFamily: FontFamily.serifMediumItalic, fontSize: 17, color: palette.paper, lineHeight: 26, marginBottom: 14 },
    divider:             { height: 1, backgroundColor: palette.goldMuted, marginBottom: 12 },
    devocionalReflexao:  { fontFamily: FontFamily.sansRegular, fontSize: 13, color: 'rgba(239,239,234,0.60)', lineHeight: 20 },

    kpiRow:   { flexDirection: 'row', gap: 10, marginBottom: 24 },
    kpiCard:  { flex: 1, gap: 4, padding: 14 },
    kpiValue: { fontFamily: FontFamily.serifSemiBold, fontSize: 18, color: c.ink },

    fab: {
      position: 'absolute', bottom: 24, right: Spacing.screenH,
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: palette.gold500, borderRadius: 28,
      paddingVertical: 13, paddingHorizontal: 20,
      shadowColor: palette.gold500, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
    },
    fabIcon: { fontFamily: FontFamily.sansRegular,  fontSize: 14, color: palette.navy800 },
    fabText: { fontFamily: FontFamily.sansSemiBold, fontSize: 14, color: palette.navy800 },
  });
}
