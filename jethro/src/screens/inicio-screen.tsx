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

const MODELO_TITULOS: Record<string, string> = {
  A: 'Negócio Sem Rumo — Várias Frentes Abertas',
  B: 'Base Sólida, Faturamento Estagnado',
  C: 'Entrega Bem, Cobra Mal',
  D: 'Fatura, Mas Não Sobra',
  E: 'Começou, Mas o Mercado Ainda Não Respondeu',
  F: 'Vende Bem, Mas Não Sabe Trazer o Próximo Cliente',
  G: 'A Operação Não Aguenta Crescer',
  H: 'Sem Você, Nada Anda',
  X: 'Pronto para Escalar — Negócio Funcional em Ascensão',
};

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
  const [checkInSemanal, setCheckInSemanal] = useState<{ confianca: number | null; clareza: number | null; progresso: number | null }>({ confianca: null, clareza: null, progresso: null });
  const [checkInSemanalSaved, setCheckInSemanalSaved] = useState(false);

  const firstName   = getUserDisplayName(session);
  const modeloCode  = data?.modelo ?? null;
  const modeloLabel = modeloCode ? MODELO_TITULOS[modeloCode] ?? null : null;

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [homeData, ciSemanal] = await Promise.all([
        homeService.getHomeData(),
        homeService.getCheckInSemanal().catch(() => null),
      ]);
      setData(homeData);
      if (ciSemanal) {
        setCheckInSemanal({ confianca: ciSemanal.confianca, clareza: ciSemanal.clareza, progresso: ciSemanal.progresso });
        setCheckInSemanalSaved(true);
      }
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
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>{getGreeting()}, {firstName}</Text>
            {modeloLabel ? (
              <View style={s.modeloBadge}>
                <Text style={s.modeloDot}>◆</Text>
                <Text style={s.modeloLabel} numberOfLines={1}>{modeloLabel}</Text>
              </View>
            ) : null}
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
            {/* Objetivo Macro desta Semana */}
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

            {/* Biblioteca do Jethro */}
            {(plano.materiais_semana && plano.materiais_semana.length > 0) ? (
              <View style={s.bibCard}>
                <Text style={s.bibLabelMain}>BIBLIOTECA DO JETHRO</Text>
                <Text style={s.bibLabelSub}>Materiais recomendados para esta semana</Text>
                <View style={s.bibDivider} />
                {plano.materiais_semana.map((mat, idx) => (
                  <View key={idx}>
                    <View style={s.bibItem}>
                      <View style={[s.bibBadge, matBadgeBg(mat.tipo)]}>
                        <Text style={[s.bibBadgeTx, matBadgeTx(mat.tipo)]}>{mat.tipo}</Text>
                      </View>
                      <Text style={s.bibTitulo}>{mat.titulo}</Text>
                    </View>
                    {idx < plano.materiais_semana!.length - 1 && <View style={s.bibSep} />}
                  </View>
                ))}
                <View style={s.bibDivider} />
                <Pressable onPress={() => router.push('/(tabs)/biblioteca' as Parameters<typeof router.push>[0])}>
                  <Text style={s.bibVerTodos}>Ver todos na Biblioteca →</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Dashboard de progresso — anéis circulares */}
            <View style={s.dashCard}>
              <View style={s.ringsRow}>
                <View style={s.ringWrap}>
                  <View style={[s.ringOuter, { borderColor: palette.gold500 }]}>
                    <Text style={s.ringValue}>{completadas}/{totalTarefas}</Text>
                  </View>
                  <Text style={s.ringLabel}>Ações semana</Text>
                  <Text style={s.ringPct}>{progressoPct}%</Text>
                </View>
                <View style={s.ringWrap}>
                  <View style={[s.ringOuter, { borderColor: palette.gold500 }]}>
                    <Text style={s.ringValue}>{plano.semanaNumero}/24</Text>
                  </View>
                  <Text style={s.ringLabel}>Semanas plano</Text>
                  <Text style={s.ringPct}>{Math.round((plano.semanaNumero / 24) * 100)}%</Text>
                </View>
              </View>
              {(data?.sparklineConfianca && data.sparklineConfianca.length > 0) ? (
                <>
                  <View style={s.dashDivider} />
                  <View style={s.sparkHeader}>
                    <Text style={s.sparkTitle}>Confiança — histórico</Text>
                    <Text style={s.sparkTrend}>▲ crescente</Text>
                  </View>
                  <View style={s.sparkRow}>
                    {data.sparklineConfianca.map((val, idx) => {
                      const max = Math.max(...(data.sparklineConfianca ?? [1]));
                      const isLast = idx === (data.sparklineConfianca?.length ?? 1) - 1;
                      const h = Math.max(4, (val / max) * 28);
                      return (
                        <View key={idx} style={s.sparkBarWrap}>
                          <View style={[s.sparkBar, { height: h, backgroundColor: isLast ? palette.gold500 : '#DDD6C8' }]} />
                          <Text style={[s.sparkLbl, isLast && { color: palette.gold500 }]}>S{idx + 1}</Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : null}
            </View>

            {/* Check-in da Semana */}
            <SectionCard style={s.checkInSemanalCard}>
              <View style={s.checkInSemanalHeader}>
                <View style={s.checkInSemanalDot} />
                <Text style={s.checkInSemanalEyebrow}>CHECK-IN DA SEMANA</Text>
              </View>
              <Text style={s.checkInSemanalTitle}>Como você encerra esta semana?</Text>
              {([
                { key: 'confianca' as const, label: 'Confiança no negócio' },
                { key: 'clareza'   as const, label: 'Clareza da direção'   },
                { key: 'progresso' as const, label: 'Sensação de progresso' },
              ]).map(({ key, label }) => (
                <View key={key} style={s.checkInSemanalQuestion}>
                  <Text style={s.checkInSemanalLabel}>{label}</Text>
                  <View style={s.checkInSemanalScale}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <Pressable
                        key={n}
                        style={[s.checkInSemanalBtn, checkInSemanal[key] === n && s.checkInSemanalBtnActive]}
                        onPress={() => {
                          const next = { ...checkInSemanal, [key]: n };
                          setCheckInSemanal(next);
                          setCheckInSemanalSaved(false);
                          if (next.confianca != null && next.clareza != null && next.progresso != null) {
                            void homeService.checkInSemanal({
                              confianca: next.confianca,
                              clareza:   next.clareza,
                              progresso: next.progresso,
                            }).then(() => setCheckInSemanalSaved(true)).catch(() => {});
                          }
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`${label} — nota ${n}`}
                      >
                        <Text style={[s.checkInSemanalBtnText, checkInSemanal[key] === n && s.checkInSemanalBtnTextActive]}>{n}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
              {checkInSemanalSaved && (
                <Text style={s.checkInSemanalSavedText}>✓ Avaliação guardada</Text>
              )}
            </SectionCard>

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

    header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    themeToggle: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline,
      justifyContent: 'center', alignItems: 'center', ...getShadow(1),
    },
    greeting:    { fontFamily: FontFamily.serifMedium, fontSize: 22, color: c.ink, textTransform: 'capitalize' },
    modeloBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, marginBottom: 2 },
    modeloDot:   { fontFamily: FontFamily.sansRegular, fontSize: 9, color: palette.gold500 },
    modeloLabel: { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute, flex: 1 },
    date:        { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkMute, textTransform: 'capitalize' },

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

    // Dashboard — anéis
    dashCard:       { backgroundColor: c.surface, borderRadius: Radius.md, padding: 16, marginBottom: 16, ...getShadow(1) },
    ringsRow:       { flexDirection: 'row', gap: 12 },
    ringWrap:       { flex: 1, alignItems: 'center', backgroundColor: c.background, borderRadius: Radius.sm, padding: 12 },
    ringOuter:      { width: 72, height: 72, borderRadius: 36, borderWidth: 5, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    ringValue:      { fontFamily: FontFamily.serifSemiBold, fontSize: 16, color: c.ink },
    ringLabel:      { fontFamily: FontFamily.sansBold, fontSize: 10, color: c.ink, textAlign: 'center', marginBottom: 2 },
    ringPct:        { fontFamily: FontFamily.sansRegular, fontSize: 10, color: c.inkMute },
    dashDivider:    { height: 1, backgroundColor: c.hairline, marginVertical: 10 },
    sparkHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    sparkTitle:     { fontFamily: FontFamily.sansBold, fontSize: 11, color: c.ink },
    sparkTrend:     { fontFamily: FontFamily.sansBold, fontSize: 9, color: palette.gold500 },
    sparkRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 40 },
    sparkBarWrap:   { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    sparkBar:       { width: '100%', borderRadius: 2 },
    sparkLbl:       { fontFamily: FontFamily.sansRegular, fontSize: 8, color: '#DDD6C8', marginTop: 3 },

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

    checkInSemanalCard:        { marginBottom: 16, padding: 16, gap: 14 },
    checkInSemanalHeader:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
    checkInSemanalDot:         { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.gold500 },
    checkInSemanalEyebrow:     { fontFamily: FontFamily.sansBold, fontSize: 10, color: palette.gold500, letterSpacing: 1.5, textTransform: 'uppercase' },
    checkInSemanalTitle:       { fontFamily: FontFamily.serifMedium, fontSize: 20, color: c.ink, lineHeight: 26 },
    checkInSemanalQuestion:    { gap: 8 },
    checkInSemanalLabel:       { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkSoft },
    checkInSemanalScale:       { flexDirection: 'row', gap: 6 },
    checkInSemanalBtn:         { flex: 1, paddingVertical: 12, borderRadius: Radius.xs, borderWidth: 1, borderColor: c.hairline, justifyContent: 'center', alignItems: 'center', backgroundColor: c.surface },
    checkInSemanalBtnActive:   { borderColor: palette.gold500, backgroundColor: 'rgba(201,166,85,0.12)' },
    checkInSemanalBtnText:     { fontFamily: FontFamily.sansRegular, fontSize: 14, color: c.inkSoft },
    checkInSemanalBtnTextActive: { fontFamily: FontFamily.sansSemiBold, color: palette.gold500 },
    checkInSemanalSavedText: { fontFamily: FontFamily.sansMedium, fontSize: 13, color: c.success, textAlign: 'center', marginTop: 4 },

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
