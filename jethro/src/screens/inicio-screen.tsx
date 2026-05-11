import { useRouter } from 'expo-router';
import { mentorContext } from '@/src/lib/mentor-context';
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


function getUserDisplayName(session: { user?: { user_metadata?: { full_name?: string; name?: string }; email?: string } } | null): string {
  const meta = session?.user?.user_metadata;
  const fullName = meta?.full_name ?? meta?.name ?? '';
  if (fullName.trim()) return fullName.trim().split(' ')[0] ?? fullName.trim();
  const email = session?.user?.email ?? '';
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

const BIBLIOTECA_ITENS: Record<string, { titulo: string }> = {
  P1: { titulo: 'Propósito e Chamado' },
  P2: { titulo: 'Gestão Financeira' },
  P3: { titulo: 'Precificação Bíblica' },
  P4: { titulo: 'Vendas com Integridade' },
  P5: { titulo: 'Liderança e Equipe' },
  P6: { titulo: 'Processos e Sistemas' },
  P7: { titulo: 'Visão e Legado' },
};

function matBadgeBg(tipo: string): object {
  const map: Record<string, object> = {
    AULA:     { backgroundColor: '#0B1C35' },
    TEMPLATE: { backgroundColor: '#FEF3C7' },
    ARTIGO:   { backgroundColor: '#D1FAE5' },
  };
  return map[tipo] ?? { backgroundColor: '#DDD6C8' };
}
function matBadgeTx(tipo: string): object {
  const map: Record<string, object> = {
    AULA:     { color: '#C9A655' },
    TEMPLATE: { color: '#92400E' },
    ARTIGO:   { color: '#065F46' },
  };
  return map[tipo] ?? { color: '#666' };
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

  const firstName = getUserDisplayName(session);

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
  const onboardingCompleto = data?.onboardingCompleto ?? false;

  const checkInsCount       = plano?.checkInsCount       ?? 0;
  const checkInsNecessarios = plano?.checkInsNecessarios ?? 5;
  const todayCheckedIn      = plano?.todayCheckedIn      ?? false;
  const gateUnlocked        = plano?.gateStatus === 'available' && checkInsCount >= checkInsNecessarios;

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
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>{getGreeting()}, {firstName}</Text>
            <Text style={s.date}>{getFormattedDate()}</Text>
            <Text style={s.mentorLabel}>Jethro, o Mentor do Empreendedor Cristão</Text>
          </View>
          <Pressable
            style={s.avatar}
            onPress={toggleColorScheme}
            accessibilityRole="button"
            accessibilityLabel={colorScheme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            <Text style={s.avatarText}>{firstName.substring(0, 2).toUpperCase()}</Text>
          </Pressable>
        </View>

        {/* ── Propósito do Plano ── */}
        {data?.tagline ? (
          <View style={s.propositoCard}>
            <Text style={s.propositoEyebrow}>PROPÓSITO DO PLANO</Text>
            <Text style={s.propositoText}>"{data.tagline}"</Text>
          </View>
        ) : null}

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
            {/* ① Princípio Bíblico da Semana */}
            <View style={s.principioCard}>
              <Text style={s.principioEyebrow}>PRINCÍPIO BÍBLICO · SEMANA {plano.semanaNumero}</Text>
              <Text style={s.principioTitulo}>{plano.bloco ?? plano.tag ?? faseLabel(plano.fase)}</Text>
              {plano.versiculo_texto ? (
                <Text style={s.principioVersiculo}>
                  "{plano.versiculo_texto}"{plano.versiculo_ancora ? ` — ${plano.versiculo_ancora}` : ''}
                </Text>
              ) : null}
            </View>

            {/* ② Objetivo Macro desta Semana */}
            <FeatureCard style={s.anchoraCard}>
              <Text style={s.anchoraEyebrow}>OBJETIVO MACRO DESTA SEMANA</Text>
              <Text style={s.anchoraText}>"{plano.objetivo}"</Text>
              <Pressable
                style={s.verPlanoBtn}
                onPress={() => router.push('/(tabs)/explore' as Parameters<typeof router.push>[0])}
                accessibilityRole="button"
              >
                <Text style={s.verPlanoBtnTx}>Ver plano completo →</Text>
              </Pressable>
            </FeatureCard>

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
              {/* Botão dourado Jethro — abre mentor com contexto da ação atual */}
              <Pressable
                style={s.jethroBtn}
                onPress={() => {
                  if (acaoPrincipal) {
                    mentorContext.set(
                      `Preciso de ajuda com esta ação da Semana ${plano.semanaNumero}: "${acaoPrincipal.texto}"\n\nObjectivo desta semana: ${plano.objetivo}`
                    );
                  }
                  router.push('/(tabs)/mentor');
                }}
                accessibilityRole="button"
                accessibilityLabel="Pedir ajuda ao Jethro com esta ação"
              >
                <Text style={s.jethroBtnText}>✦  Jethro, me ajuda com esta ação</Text>
              </Pressable>
            </View>

            {/* ⑤ Biblioteca do Jethro */}
            {(() => {
              const matSemana = plano.materiais_semana ?? [];
              const matBiblioteca = (plano.materiais_biblioteca ?? []).slice(0, 3);
              const temMateriais = matSemana.length > 0 || matBiblioteca.length > 0;
              if (!temMateriais) return null;
              return (
                <View style={s.bibCard}>
                  <Text style={s.bibLabelMain}>BIBLIOTECA DO JETHRO</Text>
                  <Text style={s.bibLabelSub}>Materiais recomendados para esta semana</Text>
                  <View style={s.bibDivider} />
                  {matSemana.length > 0
                    ? matSemana.map((mat, idx) => (
                        <View key={idx}>
                          <View style={s.bibItem}>
                            <View style={[s.bibBadge, matBadgeBg(mat.tipo)]}>
                              <Text style={[s.bibBadgeTx, matBadgeTx(mat.tipo)]}>{mat.tipo}</Text>
                            </View>
                            <Text style={s.bibTitulo}>{mat.titulo}</Text>
                          </View>
                          {idx < matSemana.length - 1 && <View style={s.bibSep} />}
                        </View>
                      ))
                    : matBiblioteca.map((pilarId, idx) => {
                        const item = BIBLIOTECA_ITENS[pilarId];
                        if (!item) return null;
                        return (
                          <View key={pilarId}>
                            <View style={s.bibItem}>
                              <View style={[s.bibBadge, { backgroundColor: '#0B1C35' }]}>
                                <Text style={[s.bibBadgeTx, { color: '#C9A655' }]}>{pilarId}</Text>
                              </View>
                              <Text style={s.bibTitulo}>{item.titulo}</Text>
                            </View>
                            {idx < matBiblioteca.length - 1 && <View style={s.bibSep} />}
                          </View>
                        );
                      })}
                  <View style={s.bibDivider} />
                  <Pressable onPress={() => router.push('/(tabs)/biblioteca' as Parameters<typeof router.push>[0])}>
                    <Text style={s.bibVerTodos}>Ver todos na Biblioteca →</Text>
                  </Pressable>
                </View>
              );
            })()}

            {/* ⑥ Dashboard de Progresso */}
            <View style={s.dashCard}>
              <View style={s.dashHeader}>
                <Text style={s.dashLabel}>DASHBOARD DE PROGRESSO</Text>
                {(data?.sparklineConfianca && data.sparklineConfianca.length > 0) ? (
                  <Text style={s.sparkTrend}>▲ Confiança histórico</Text>
                ) : null}
              </View>
              <View style={s.dashContent}>
                {/* Anel 1 */}
                <View style={s.ringWrap}>
                  <View style={[s.ringOuter, { borderColor: palette.gold500 }]}>
                    <Text style={s.ringValue}>{completadas}/{totalTarefas}</Text>
                  </View>
                  <Text style={s.ringLabel}>Ações semana</Text>
                </View>
                {/* Anel 2 */}
                <View style={s.ringWrap}>
                  <View style={[s.ringOuter, { borderColor: palette.gold500 }]}>
                    <Text style={s.ringValue}>{plano.semanaNumero}/24</Text>
                  </View>
                  <Text style={s.ringLabel}>Semanas plano</Text>
                </View>
                {/* Sparkline ao lado dos anéis */}
                {(data?.sparklineConfianca && data.sparklineConfianca.length > 0) ? (
                  <View style={s.sparkWrap}>
                    {data.sparklineConfianca.map((val, idx) => {
                      const max = Math.max(...(data.sparklineConfianca ?? [1]));
                      const isLast = idx === (data.sparklineConfianca?.length ?? 1) - 1;
                      const h = Math.max(4, (val / max) * 44);
                      return (
                        <View key={idx} style={s.sparkBarWrap}>
                          <View style={[s.sparkBar, { height: h, backgroundColor: isLast ? palette.gold500 : '#DDD6C8' }]} />
                          <Text style={[s.sparkLbl, isLast && { color: palette.gold500 }]}>S{idx + 1}</Text>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </View>

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


        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <Pressable
        style={s.fab}
        onPress={() => router.push('/(tabs)/mentor')}
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

    header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    avatar: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: palette.navy800, borderWidth: 1.5, borderColor: palette.gold500,
      justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    avatarText:  { fontFamily: FontFamily.serifSemiBold, fontSize: 14, color: palette.gold500 },
    greeting:    { fontFamily: FontFamily.serifMedium, fontSize: 22, color: c.ink, textTransform: 'capitalize' },
    date:        { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkMute, textTransform: 'capitalize', marginTop: 2 },
    mentorLabel: { fontFamily: FontFamily.sansSemiBold, fontSize: 13, color: c.ink, marginTop: 3 },

    propositoCard:    { backgroundColor: c.surface, borderRadius: Radius.md, padding: 14, marginBottom: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, ...getShadow(1) },
    propositoEyebrow: { fontFamily: FontFamily.sansBold, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: palette.gold500, marginBottom: 6 },
    propositoText:    { fontFamily: FontFamily.serifMediumItalic, fontSize: 14, color: c.ink, lineHeight: 21 },

    errorBanner: { backgroundColor: 'rgba(226,72,60,0.08)', borderRadius: Radius.xs, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: c.liveRed },
    errorText:   { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.liveRed,  marginBottom: 4 },
    errorRetry:  { fontFamily: FontFamily.sansRegular, fontSize: 12, color: c.inkMute },

    anchoraCard:    { marginBottom: 16, paddingVertical: 18, paddingHorizontal: 18 },
    anchoraEyebrow: { fontFamily: FontFamily.sansSemiBold, fontSize: 10, color: 'rgba(212,175,55,0.75)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
    anchoraText:    { fontFamily: FontFamily.serifMediumItalic, fontSize: 16, color: palette.paper, lineHeight: 24 },

    principioCard:      { backgroundColor: c.surface, borderRadius: Radius.md, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: palette.gold500, ...getShadow(1) },
    principioEyebrow:   { fontFamily: FontFamily.sansBold, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: palette.gold500, marginBottom: 6 },
    principioTitulo:    { fontFamily: FontFamily.serifSemiBold, fontSize: 16, color: c.ink, marginBottom: 8 },
    principioVersiculo: { fontFamily: FontFamily.serifMediumItalic, fontSize: 13, color: c.inkSoft, lineHeight: 20 },

    // Âncora / Objetivo Macro
    verPlanoBtn:    { alignSelf: 'flex-start', backgroundColor: palette.gold500, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, marginTop: 10 },
    verPlanoBtnTx:  { fontFamily: FontFamily.sansBold, fontSize: 10, color: palette.navy800 },

    focoCard:       { backgroundColor: c.surface, borderRadius: Radius.md, padding: 16, borderWidth: 1.5, borderColor: palette.gold500, marginBottom: 16, gap: 10, ...getShadow(1) },
    focoTitle:      { fontFamily: FontFamily.serifMedium, fontSize: 17, color: c.ink, lineHeight: 25 },
    focoBtnRow:     { flexDirection: 'row', gap: 8 },
    focoBtn:        { flex: 1, height: 44, borderRadius: Radius.xs, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, justifyContent: 'center', alignItems: 'center' },
    focoBtnActive:  { backgroundColor: palette.navy800, borderColor: palette.navy800 },
    focoBtnText:    { fontFamily: FontFamily.sansMedium, fontSize: 13, color: c.inkSoft },
    focoBtnTextActive: { color: palette.paper },
    jethroBtn:      { backgroundColor: palette.gold500, borderRadius: Radius.xs, paddingVertical: 11, alignItems: 'center' },
    jethroBtnText:  { fontFamily: FontFamily.sansBold, fontSize: 13, color: palette.navy800 },

    // Biblioteca do Jethro
    bibCard:        { backgroundColor: c.surface, borderRadius: Radius.md, padding: 16, marginBottom: 16, ...getShadow(1) },
    bibLabelMain:   { fontFamily: FontFamily.sansBold, fontSize: 9, letterSpacing: 0.7, textTransform: 'uppercase', color: c.inkMute, marginBottom: 3 },
    bibLabelSub:    { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute, marginBottom: 4 },
    bibDivider:     { height: 1, backgroundColor: c.hairline, marginVertical: 8 },
    bibItem:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 3 },
    bibBadge:       { borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
    bibBadgeTx:     { fontFamily: FontFamily.sansBold, fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
    bibTitulo:      { fontFamily: FontFamily.sansSemiBold, fontSize: 12, color: c.ink, flex: 1 },
    bibSep:         { height: 1, backgroundColor: c.hairline, marginVertical: 4 },
    bibVerTodos:    { fontFamily: FontFamily.sansBold, fontSize: 11, color: palette.gold500, textAlign: 'center' },

    // Dashboard — anéis + sparkline
    dashCard:     { backgroundColor: c.surface, borderRadius: Radius.md, padding: 16, marginBottom: 16, ...getShadow(1) },
    dashHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    dashLabel:    { fontFamily: FontFamily.sansBold, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: c.inkMute },
    sparkTrend:   { fontFamily: FontFamily.sansBold, fontSize: 9, color: palette.gold500 },
    dashContent:  { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    ringWrap:     { alignItems: 'center', flex: 1 },
    ringOuter:    { width: 68, height: 68, borderRadius: 34, borderWidth: 5, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
    ringValue:    { fontFamily: FontFamily.serifSemiBold, fontSize: 15, color: c.ink },
    ringLabel:    { fontFamily: FontFamily.sansBold, fontSize: 9, color: c.inkMute, textAlign: 'center' },
    sparkWrap:    { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 60, paddingBottom: 14 },
    sparkBarWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    sparkBar:     { width: '100%', borderRadius: 2 },
    sparkLbl:     { fontFamily: FontFamily.sansRegular, fontSize: 7, color: '#DDD6C8', marginTop: 2 },

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
