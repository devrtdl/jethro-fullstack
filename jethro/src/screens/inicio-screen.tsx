import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import Svg, { Line } from 'react-native-svg';
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

// ─── Pure helpers ─────────────────────────────────────────────────────────────

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
    fundamento: 'Fundamento', estrutura: 'Estrutura', controlo: 'Controlo',
    crescimento: 'Crescimento', escala: 'Escala', legado: 'Legado',
  };
  return map[fase] ?? fase;
}

function formatKpiValue(val: string | number | null): string {
  if (val == null) return '—';
  return String(val);
}

function prioBgColor(p: string) {
  if (p === 'critica') return palette.liveRed;
  if (p === 'alta')    return palette.gold500;
  if (p === 'media')   return '#6B9FD4';
  return palette.inkMute;
}

function prioLabel(p: string) {
  if (p === 'critica') return 'URGENTE';
  if (p === 'alta')    return 'ALTA';
  if (p === 'media')   return 'MÉDIA';
  return 'TAREFA';
}

// ─── Striped thumbnail ────────────────────────────────────────────────────────

function StripedThumb({ children }: { children?: React.ReactNode }) {
  return (
    <View style={thumb.container}>
      <Svg style={StyleSheet.absoluteFill} accessible={false}>
        {Array.from({ length: 16 }).map((_, i) => (
          <Line
            key={i}
            x1={i * 24 - 40} y1={-10}
            x2={i * 24 + 60} y2={110}
            stroke={palette.navy800}
            strokeWidth={10}
            opacity={0.055}
          />
        ))}
      </Svg>
      {children}
    </View>
  );
}

const thumb = StyleSheet.create({
  container: { backgroundColor: 'rgba(212,175,55,0.10)', overflow: 'hidden' },
});

// ─── Tarefa card (horizontal FlatList) ────────────────────────────────────────

type Tarefa = NonNullable<HomeData['plano']>['tarefas'][number];

function TarefaCard({ tarefa, onRecursoPress }: { tarefa: Tarefa; onRecursoPress: () => void }) {
  const { colors } = useTheme();
  const c = useMemo(() => makeCardStyles(colors), [colors]);
  const color = prioBgColor(tarefa.prioridade);
  const label = prioLabel(tarefa.prioridade);

  return (
    <View style={[c.wrap, tarefa.completada && c.wrapDone]}>
      <StripedThumb>
        <View style={c.thumbInner}>
          <View style={[c.badge, { backgroundColor: color }]}>
            <Text style={c.badgeText}>{label}</Text>
          </View>
          {tarefa.completada && (
            <View style={c.doneOverlay}>
              <Text style={c.doneCheck}>✓</Text>
            </View>
          )}
        </View>
      </StripedThumb>
      <View style={c.body}>
        <Text style={[c.title, tarefa.completada && c.titleDone]} numberOfLines={3}>
          {tarefa.descricao}
        </Text>
        {tarefa.completada ? (
          <Text style={c.completadaLabel}>✓ Concluída</Text>
        ) : tarefa.recurso_biblioteca ? (
          <Pressable style={c.resourceChip} onPress={onRecursoPress}>
            <Text style={c.resourceText} numberOfLines={1}>◈ {tarefa.recurso_biblioteca}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function makeCardStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrap:     { width: 180, borderRadius: Radius.md, backgroundColor: c.surface, overflow: 'hidden', ...getShadow(1) },
    wrapDone: { opacity: 0.7 },
    thumbInner: { height: 90, padding: 10 },
    badge:    { alignSelf: 'flex-start', borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText:{ fontFamily: FontFamily.sansBold, fontSize: 10, color: palette.paper, letterSpacing: 0.5, textTransform: 'uppercase' },
    doneOverlay: { position: 'absolute', bottom: 8, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: palette.success, justifyContent: 'center', alignItems: 'center' },
    doneCheck:   { fontFamily: FontFamily.sansBold, fontSize: 14, color: palette.paper, lineHeight: 18 },
    body:  { padding: 12, gap: 8, flex: 1 },
    title: { fontFamily: FontFamily.serifMedium, fontSize: 13, color: c.ink, lineHeight: 19, flex: 1 },
    titleDone:       { textDecorationLine: 'line-through', color: c.inkMute },
    completadaLabel: { fontFamily: FontFamily.sansRegular, fontSize: 11, color: palette.success },
    resourceChip:    { borderWidth: 1, borderColor: c.accent, borderRadius: Radius.xs, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
    resourceText:    { fontFamily: FontFamily.sansRegular, fontSize: 10, color: c.accent },
  });
}

// ─── Check-in Modal ───────────────────────────────────────────────────────────

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
          <Text style={m.sub}>Regista o teu dia de trabalho. Após 5 dias, o gate de avanço abre.</Text>

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
            label="Registar dia"
            onPress={handleSubmit}
            loading={loading}
            disabled={cumpriu === null}
            accessibilityLabel="Registar dia de trabalho"
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
    handle:       { width: 40, height: 4, backgroundColor: c.hairline, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    title:        { fontFamily: FontFamily.serifSemiBold, fontSize: 20, color: c.ink,    marginBottom: 6 },
    sub:          { fontFamily: FontFamily.sansRegular,   fontSize: 13, color: c.inkMute, lineHeight: 19, marginBottom: 20 },
    question:     { fontFamily: FontFamily.sansSemiBold,  fontSize: 15, color: c.ink,    marginBottom: 12 },
    yesNoRow:     { flexDirection: 'row', gap: 12, marginBottom: 16 },
    yesNoBtn:     { flex: 1, paddingVertical: 13, borderRadius: Radius.xs, borderWidth: 1.5, borderColor: c.hairline, alignItems: 'center', backgroundColor: c.surface },
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

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
        Alert.alert('Já registado', 'Já fizeste o check-in de hoje. Volta amanhã!');
        return;
      }
      await loadData();
      if (result.gateDesbloqueado) {
        Alert.alert('🎉 Gate desbloqueado!', 'Completaste 5 dias de trabalho. Podes avançar para a próxima semana!');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível registar o check-in.');
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
          ? 'Ainda não tens check-ins suficientes para avançar.'
          : 'Não foi possível avançar.';
        Alert.alert('Ainda não', msg);
        return;
      }
      await loadData();
      if (result.programaConcluido) {
        Alert.alert('🏆 Programa concluído!', 'Completaste as 24 semanas do Programa PBN. Parabéns!');
      } else {
        Alert.alert(`Semana ${result.proximaSemana} desbloqueada`, 'O teu plano avançou. Bom trabalho!');
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
                <EyebrowLabel size="sm" color={colors.inkMute}>Receita Actual</EyebrowLabel>
              </SectionCard>
              <SectionCard style={s.kpiCard}>
                <Text style={s.kpiValue}>{formatKpiValue(kpis.ticketMedio)}</Text>
                <EyebrowLabel size="sm" color={colors.inkMute}>Ticket Médio</EyebrowLabel>
              </SectionCard>
              <SectionCard style={s.kpiCard}>
                <Text style={s.kpiValue}>{formatKpiValue(kpis.clientesAtivos)}</Text>
                <EyebrowLabel size="sm" color={colors.inkMute}>Clientes Activos</EyebrowLabel>
              </SectionCard>
            </View>
          </>
        ) : null}

        {/* ── Plano da Semana ── */}
        <EyebrowLabel style={s.sectionLabel}>Plano da Semana</EyebrowLabel>

        {!onboardingCompleto ? (
          <SectionCard style={s.emptyCard}>
            <Text style={s.emptyTitle}>Completa o onboarding</Text>
            <Text style={s.emptyText}>
              Para receberes o teu plano personalizado, precisas de completar o onboarding primeiro.
            </Text>
          </SectionCard>
        ) : !plano ? (
          <SectionCard style={s.emptyCard}>
            <Text style={s.emptyTitle}>Plano ainda não gerado</Text>
            <Text style={s.emptyText}>
              O Jethro vai criar o teu plano de 24 semanas personalizado com base no teu diagnóstico e onboarding.
            </Text>
            <PrimaryButton
              label={generatingPlan ? 'A gerar plano...' : '✦ Gerar o meu plano'}
              onPress={() => void handleGeneratePlan()}
              loading={generatingPlan}
              style={s.generateBtn}
            />
          </SectionCard>
        ) : (
          <>
            {/* Plano header card */}
            <SectionCard style={s.planoHeaderCard}>
              <View style={s.planoHeader}>
                <View style={s.semanaBadge}>
                  <Text style={s.semanaNum}>S{plano.semanaNumero}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.planoTitle}>{plano.objetivo}</Text>
                  <Text style={s.planoSub}>
                    {(plano.bloco ?? plano.tag ?? faseLabel(plano.fase))} · Semana {plano.semanaNumero} de 24
                  </Text>
                </View>
              </View>
            </SectionCard>

            {/* Horizontal task cards */}
            <FlatList
              data={plano.tarefas}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={s.tarefasList}
              style={s.tarefasFlatList}
              renderItem={({ item }) => (
                <TarefaCard
                  tarefa={item}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onRecursoPress={() => router.push('/(tabs)/biblioteca' as any)}
                />
              )}
            />
          </>
        )}

        {/* ── Gate de Avanço ── */}
        {plano ? (
          <>
            <View style={s.sectionHeaderRow}>
              <EyebrowLabel>Gate de Avanço</EyebrowLabel>
              <Pressable
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onPress={() => router.push('/(tabs)/biblioteca' as any)}
                accessibilityRole="button"
                accessibilityLabel="Ver tudo na biblioteca"
              >
                <Text style={s.verTudo}>Ver tudo</Text>
              </Pressable>
            </View>

            {/* Andamento card */}
            <SectionCard style={s.andamentoCard}>
              <View style={s.andamentoInner}>
                <View style={s.andamentoThumbWrap}>
                  <StripedThumb>
                    <View style={s.andamentoThumbContent}>
                      <View style={s.andamentoCircle}>
                        <Text style={s.andamentoCircleText}>S{plano.semanaNumero}</Text>
                      </View>
                    </View>
                  </StripedThumb>
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
                label={todayCheckedIn ? '✓ Check-in feito hoje' : '+ Registar dia de trabalho'}
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
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <Pressable
        style={s.fab}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onPress={() => router.push('/mentor' as any)}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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

    devocionalCard:      { marginBottom: 24 },
    devocionalQuoteMark: { position: 'absolute', top: 10, right: 16, fontFamily: FontFamily.serifSemiBold, fontSize: 80, lineHeight: 80, color: palette.gold500, opacity: 0.18 },
    devocionalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    devocionalRef:       { fontFamily: FontFamily.sansRegular, fontSize: 11, color: palette.gold400 },
    devocionalVerso:     { fontFamily: FontFamily.serifMediumItalic, fontSize: 17, color: palette.paper, lineHeight: 26, marginBottom: 14 },
    divider:             { height: 1, backgroundColor: palette.goldMuted, marginBottom: 12 },
    devocionalReflexao:  { fontFamily: FontFamily.sansRegular, fontSize: 13, color: 'rgba(239,239,234,0.60)', lineHeight: 20 },

    kpiRow:   { flexDirection: 'row', gap: 10, marginBottom: 24 },
    kpiCard:  { flex: 1, gap: 4, padding: 14 },
    kpiValue: { fontFamily: FontFamily.serifSemiBold, fontSize: 18, color: c.ink },

    emptyCard:   { marginBottom: 24, alignItems: 'center' },
    emptyTitle:  { fontFamily: FontFamily.serifMedium, fontSize: 16, color: c.ink,     marginBottom: 8 },
    emptyText:   { fontFamily: FontFamily.sansRegular,  fontSize: 13, color: c.inkSoft, lineHeight: 20, textAlign: 'center', marginBottom: 16 },
    generateBtn: { alignSelf: 'stretch' },

    planoHeaderCard: { marginBottom: 14 },
    planoHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
    semanaBadge:     { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.gold500, justifyContent: 'center', alignItems: 'center' },
    semanaNum:       { fontFamily: FontFamily.serifSemiBold, fontSize: 14, color: palette.navy800 },
    planoTitle:      { fontFamily: FontFamily.serifMedium,   fontSize: 15, color: c.ink },
    planoSub:        { fontFamily: FontFamily.sansRegular,   fontSize: 12, color: c.inkMute, marginTop: 2 },

    tarefasFlatList: { marginHorizontal: -Spacing.screenH, marginBottom: 24 },
    tarefasList:     { paddingHorizontal: Spacing.screenH, paddingVertical: 4, gap: 12 },

    andamentoCard:         { marginBottom: 16, padding: 0, overflow: 'hidden' },
    andamentoInner:        { flexDirection: 'row' },
    andamentoThumbWrap:    { width: 110 },
    andamentoThumbContent: { height: 100, justifyContent: 'center', alignItems: 'center' },
    andamentoCircle:       { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.navy800, justifyContent: 'center', alignItems: 'center' },
    andamentoCircleText:   { fontFamily: FontFamily.serifSemiBold, fontSize: 14, color: palette.gold500 },
    andamentoContent:      { flex: 1, padding: 14, gap: 5, justifyContent: 'center' },
    andamentoEyebrow:      { fontFamily: FontFamily.sansBold, fontSize: 10, color: c.accent, letterSpacing: 0.5, textTransform: 'uppercase' },
    andamentoTitle:        { fontFamily: FontFamily.serifMedium, fontSize: 14, color: c.ink, lineHeight: 20 },
    andamentoBarBg:        { height: 3, backgroundColor: c.hairline, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
    andamentoBarFill:      { height: '100%', backgroundColor: c.accent, borderRadius: 2 },
    andamentoMeta:         { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
    andamentoMetaLeft:     { fontFamily: FontFamily.sansRegular,  fontSize: 11, color: c.inkMute },
    andamentoMetaRight:    { fontFamily: FontFamily.sansSemiBold, fontSize: 11, color: c.accent },

    checkInBtn:     { borderColor: c.accent,   marginBottom: 24 },
    checkInBtnDone: { borderColor: c.success,  marginBottom: 24 },

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
