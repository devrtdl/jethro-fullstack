import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

import { JethroColors } from '@/constants/theme';
import { useAuthSession } from '@/src/hooks/use-auth-session';
import { homeService, type HomeData } from '@/src/services/home/home-service';

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
    day: 'numeric',
    month: 'long',
  });
}

function faseLabel(fase: string): string {
  const map: Record<string, string> = {
    fundamento: 'Fundamento',
    estrutura: 'Estrutura',
    controlo: 'Controlo',
    crescimento: 'Crescimento',
    escala: 'Escala',
    legado: 'Legado',
  };
  return map[fase] ?? fase;
}

function formatKpiValue(val: string | number | null): string {
  if (val == null) return '—';
  return String(val);
}

// ─── Check-in Modal ──────────────────────────────────────────────────────────

type CheckInModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (cumpriu: boolean, nota: string) => void;
  loading: boolean;
};

function CheckInModal({ visible, onClose, onSubmit, loading }: CheckInModalProps) {
  const [cumpriu, setCumpriu] = useState<boolean | null>(null);
  const [nota, setNota] = useState('');

  function handleSubmit() {
    if (cumpriu === null) return;
    onSubmit(cumpriu, nota);
  }

  function reset() {
    setCumpriu(null);
    setNota('');
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Check-in do dia</Text>
          <Text style={styles.modalSub}>
            Regista o teu dia de trabalho. Após 5 dias, o gate de avanço abre.
          </Text>

          <Text style={styles.modalQuestion}>Cumpri as tarefas de hoje?</Text>
          <View style={styles.yesNoRow}>
            <Pressable
              style={[styles.yesNoBtn, cumpriu === true && styles.yesNoBtnActive]}
              onPress={() => setCumpriu(true)}
            >
              <Text style={[styles.yesNoText, cumpriu === true && styles.yesNoTextActive]}>
                ✓ Sim
              </Text>
            </Pressable>
            <Pressable
              style={[styles.yesNoBtn, cumpriu === false && styles.yesNoBtnActiveNo]}
              onPress={() => setCumpriu(false)}
            >
              <Text style={[styles.yesNoText, cumpriu === false && styles.yesNoTextActive]}>
                ✗ Não
              </Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.modalInput}
            placeholder="Nota do dia (opcional)"
            placeholderTextColor={JethroColors.muted}
            value={nota}
            onChangeText={setNota}
            multiline
            maxLength={300}
          />

          <Pressable
            style={[styles.modalBtn, (cumpriu === null || loading) && styles.modalBtnDisabled]}
            onPress={handleSubmit}
            disabled={cumpriu === null || loading}
            onResponderRelease={reset}
          >
            {loading ? (
              <ActivityIndicator size="small" color={JethroColors.navy} />
            ) : (
              <Text style={styles.modalBtnText}>Registar dia</Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function InicioScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [checkInVisible, setCheckInVisible] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [advancingGate, setAdvancingGate] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    void loadData();
  }, [loadData]);

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

  const handleCheckIn = useCallback(
    async (cumpriu: boolean, nota: string) => {
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
          Alert.alert(
            '🎉 Gate desbloqueado!',
            'Completaste 5 dias de trabalho. Podes avançar para a próxima semana!'
          );
        }
      } catch {
        Alert.alert('Erro', 'Não foi possível registar o check-in.');
      } finally {
        setCheckInLoading(false);
      }
    },
    [loadData]
  );

  const handleGateAdvance = useCallback(async () => {
    setAdvancingGate(true);
    try {
      const result = await homeService.gateAdvance();
      if (!result.advanced) {
        const msg =
          result.reason === 'insufficient_checkins'
            ? 'Ainda não tens check-ins suficientes para avançar.'
            : 'Não foi possível avançar.';
        Alert.alert('Ainda não', msg);
        return;
      }
      await loadData();
      if (result.programaConcluido) {
        Alert.alert('🏆 Programa concluído!', 'Completaste as 24 semanas do Programa PBN. Parabéns!');
      } else {
        Alert.alert(
          `Semana ${result.proximaSemana} desbloqueada`,
          'O teu plano avançou. Bom trabalho!'
        );
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível avançar o gate.');
    } finally {
      setAdvancingGate(false);
    }
  }, [loadData]);

  const modelo = data?.modelo ?? null;
  const devocional = data?.devocional ?? null;
  const plano = data?.plano ?? null;
  const kpis = data?.kpis ?? null;
  const onboardingCompleto = data?.onboardingCompleto ?? false;

  const checkInsCount = plano?.checkInsCount ?? 0;
  const checkInsNecessarios = plano?.checkInsNecessarios ?? 5;
  const todayCheckedIn = plano?.todayCheckedIn ?? false;
  const gateProgress = checkInsCount / checkInsNecessarios;
  const gateUnlocked =
    plano?.gateStatus === 'available' && checkInsCount >= checkInsNecessarios;

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={JethroColors.gold}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, {firstName}</Text>
            <Text style={styles.date}>{getFormattedDate()}</Text>
          </View>
          {modelo ? (
            <View style={styles.modeloBadge}>
              <Text style={styles.modeloText}>Modelo {modelo}</Text>
            </View>
          ) : null}
        </View>

        {/* Erro */}
        {error ? (
          <Pressable style={styles.errorBanner} onPress={loadData}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorRetry}>Toca para tentar novamente</Text>
          </Pressable>
        ) : null}

        {/* Devocional */}
        {devocional ? (
          <View style={styles.devocionalCard}>
            <View style={styles.devocionalHeader}>
              <Text style={styles.devocionalTag}>✦ Devocional do dia</Text>
              <Text style={styles.devocionalRef}>{devocional.versiculo}</Text>
            </View>
            <Text style={styles.devocionalVerso}>{devocional.titulo}</Text>
            <View style={styles.divider} />
            <Text style={styles.devocionalReflexao}>{devocional.texto}</Text>
          </View>
        ) : null}

        {/* KPIs */}
        {kpis ? (
          <>
            <Text style={styles.sectionTitle}>Indicadores</Text>
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{formatKpiValue(kpis.receitaAtual)}</Text>
                <Text style={styles.kpiLabel}>Receita Actual</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{formatKpiValue(kpis.ticketMedio)}</Text>
                <Text style={styles.kpiLabel}>Ticket Médio</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{formatKpiValue(kpis.clientesAtivos)}</Text>
                <Text style={styles.kpiLabel}>Clientes Activos</Text>
              </View>
            </View>
          </>
        ) : null}

        {/* Plano da Semana */}
        <Text style={styles.sectionTitle}>Plano da Semana</Text>

        {!onboardingCompleto ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Completa o onboarding</Text>
            <Text style={styles.emptyText}>
              Para receberes o teu plano personalizado, precisas de completar o onboarding primeiro.
            </Text>
          </View>
        ) : !plano ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Plano ainda não gerado</Text>
            <Text style={styles.emptyText}>
              O Jethro vai criar o teu plano de 24 semanas personalizado com base no teu diagnóstico e onboarding.
            </Text>
            <Pressable
              style={[styles.generateBtn, generatingPlan && styles.generateBtnLoading]}
              onPress={handleGeneratePlan}
              disabled={generatingPlan}
            >
              {generatingPlan ? (
                <>
                  <ActivityIndicator size="small" color={JethroColors.navy} />
                  <Text style={styles.generateBtnText}>A gerar plano...</Text>
                </>
              ) : (
                <Text style={styles.generateBtnText}>✦ Gerar o meu plano</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.planoCard}>
            <View style={styles.planoHeader}>
              <View style={styles.semanaBadge}>
                <Text style={styles.semanaNum}>S{plano.semanaNumero}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.planoTitle}>{plano.objetivo}</Text>
                <Text style={styles.planoSub}>
                  {(plano.bloco ?? plano.tag ?? faseLabel(plano.fase))} · Semana {plano.semanaNumero} de 24
                </Text>
              </View>
            </View>
            {plano.tarefas.map((t, i) => (
              <View key={i} style={styles.planoTarefa}>
                <Text style={[styles.planoCheck, t.completada && styles.planoCheckDone]}>
                  {t.completada ? '●' : '○'}
                </Text>
                <Text style={[styles.planoTarefaText, t.completada && styles.planoTarefaDone]}>
                  {t.descricao}
                  {t.recurso_biblioteca ? `\nRecurso: ${t.recurso_biblioteca}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Gate de Avanço */}
        {plano ? (
          <>
            <Text style={styles.sectionTitle}>Gate de Avanço</Text>
            <View style={styles.gateCard}>
              {/* Progress dos dias */}
              <View style={styles.gateTopRow}>
                <Text style={styles.gateLabel}>Dias registados</Text>
                <Text style={styles.gateHoras}>
                  {checkInsCount}/{checkInsNecessarios} dias
                </Text>
              </View>

              {/* Dots dos dias */}
              <View style={styles.dotsRow}>
                {Array.from({ length: checkInsNecessarios }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i < checkInsCount ? styles.dotFilled : styles.dotEmpty]}
                  />
                ))}
              </View>

              <View style={styles.progressBarBg}>
                <View
                  style={[styles.progressBarFill, { width: `${Math.min(gateProgress, 1) * 100}%` }]}
                />
              </View>

              <Text style={styles.gateNote}>
                {gateUnlocked
                  ? '✓ Completo! Podes avançar para a próxima semana.'
                  : todayCheckedIn
                  ? `Check-in de hoje já registado. Faltam ${checkInsNecessarios - checkInsCount} dias.`
                  : `Regista o dia de hoje para avançar. Faltam ${checkInsNecessarios - checkInsCount} dias.`}
              </Text>

              {/* Botão check-in diário */}
              {!gateUnlocked && (
                <Pressable
                  style={[
                    styles.checkInBtn,
                    todayCheckedIn && styles.checkInBtnDone,
                  ]}
                  onPress={() => setCheckInVisible(true)}
                  disabled={todayCheckedIn}
                >
                  <Text style={[styles.checkInBtnText, todayCheckedIn && styles.checkInBtnTextDone]}>
                    {todayCheckedIn ? '✓ Check-in feito hoje' : '+ Registar dia de trabalho'}
                  </Text>
                </Pressable>
              )}

              {/* Botão avançar semana */}
              {gateUnlocked && (
                <Pressable
                  style={[styles.gateBtn, advancingGate && styles.gateBtnLoading]}
                  onPress={handleGateAdvance}
                  disabled={advancingGate}
                >
                  {advancingGate ? (
                    <ActivityIndicator size="small" color={JethroColors.navy} />
                  ) : (
                    <Text style={styles.gateBtnText}>
                      Avançar para Semana {plano.semanaNumero + 1} →
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          </>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={styles.fab}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onPress={() => router.push('/mentor' as any)}
      >
        <Text style={styles.fabIcon}>✦</Text>
        <Text style={styles.fabText}>Falar com Jethro</Text>
      </Pressable>

      {/* Check-in Modal */}
      <CheckInModal
        visible={checkInVisible}
        onClose={() => setCheckInVisible(false)}
        onSubmit={handleCheckIn}
        loading={checkInLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: JethroColors.navy },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 24,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: JethroColors.creme, textTransform: 'capitalize' },
  date: { fontSize: 13, color: JethroColors.muted, marginTop: 2, textTransform: 'capitalize' },
  modeloBadge: {
    backgroundColor: JethroColors.goldMuted, borderWidth: 1,
    borderColor: JethroColors.gold, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  modeloText: { fontSize: 12, color: JethroColors.gold, fontWeight: '600' },
  errorBanner: {
    backgroundColor: 'rgba(224, 92, 92, 0.12)', borderRadius: 10,
    padding: 14, marginBottom: 16, borderWidth: 1, borderColor: JethroColors.danger,
  },
  errorText: { fontSize: 13, color: JethroColors.danger, marginBottom: 4 },
  errorRetry: { fontSize: 12, color: JethroColors.muted },
  devocionalCard: {
    backgroundColor: JethroColors.navySurface, borderWidth: 1,
    borderColor: JethroColors.goldMuted, borderRadius: 16, padding: 20, marginBottom: 24,
  },
  devocionalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  devocionalTag: { fontSize: 11, color: JethroColors.gold, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  devocionalRef: { fontSize: 11, color: JethroColors.muted },
  devocionalVerso: { fontSize: 17, color: JethroColors.creme, fontWeight: '600', lineHeight: 26, marginBottom: 14 },
  divider: { height: 1, backgroundColor: JethroColors.goldMuted, marginBottom: 12 },
  devocionalReflexao: { fontSize: 13, color: JethroColors.muted, lineHeight: 20 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: JethroColors.gold,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
  },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  kpiCard: {
    flex: 1, backgroundColor: JethroColors.navySurface, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: JethroColors.navyDeep,
  },
  kpiValue: { fontSize: 16, fontWeight: '700', color: JethroColors.creme, marginBottom: 4 },
  kpiLabel: { fontSize: 10, color: JethroColors.muted, textTransform: 'uppercase', letterSpacing: 0.3 },
  emptyCard: {
    backgroundColor: JethroColors.navySurface, borderRadius: 16,
    padding: 20, marginBottom: 24, alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: JethroColors.creme, marginBottom: 8 },
  emptyText: { fontSize: 13, color: JethroColors.muted, lineHeight: 20, textAlign: 'center', marginBottom: 16 },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: JethroColors.gold, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24,
  },
  generateBtnLoading: { opacity: 0.75 },
  generateBtnText: { fontSize: 15, fontWeight: '700', color: JethroColors.navy },
  planoCard: { backgroundColor: JethroColors.navySurface, borderRadius: 16, padding: 18, marginBottom: 24 },
  planoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  semanaBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: JethroColors.gold, justifyContent: 'center', alignItems: 'center',
  },
  semanaNum: { fontSize: 14, fontWeight: '800', color: JethroColors.navy },
  planoTitle: { fontSize: 15, fontWeight: '700', color: JethroColors.creme },
  planoSub: { fontSize: 12, color: JethroColors.muted, marginTop: 2 },
  planoTarefa: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  planoCheck: { fontSize: 16, color: JethroColors.gold, lineHeight: 22 },
  planoCheckDone: { color: JethroColors.success },
  planoTarefaText: { flex: 1, fontSize: 14, color: JethroColors.cremeMuted, lineHeight: 22 },
  planoTarefaDone: { textDecorationLine: 'line-through', color: JethroColors.muted },
  // Gate
  gateCard: { backgroundColor: JethroColors.navySurface, borderRadius: 16, padding: 18, marginBottom: 24 },
  gateTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  gateLabel: { fontSize: 14, fontWeight: '600', color: JethroColors.creme },
  gateHoras: { fontSize: 14, fontWeight: '700', color: JethroColors.gold },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  dot: { width: 28, height: 28, borderRadius: 14, flex: 1 },
  dotFilled: { backgroundColor: JethroColors.gold },
  dotEmpty: { backgroundColor: JethroColors.navyDeep, borderWidth: 1, borderColor: JethroColors.navySurface },
  progressBarBg: {
    height: 4, backgroundColor: JethroColors.navyDeep,
    borderRadius: 2, marginBottom: 12, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: JethroColors.gold, borderRadius: 2 },
  gateNote: { fontSize: 12, color: JethroColors.muted, marginBottom: 14, lineHeight: 18 },
  checkInBtn: {
    backgroundColor: JethroColors.navyDeep, borderWidth: 1.5,
    borderColor: JethroColors.gold, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
  },
  checkInBtnDone: {
    borderColor: JethroColors.success, borderStyle: 'solid',
  },
  checkInBtnText: { fontSize: 14, fontWeight: '600', color: JethroColors.gold },
  checkInBtnTextDone: { color: JethroColors.success },
  gateBtn: {
    backgroundColor: JethroColors.gold, borderRadius: 10, paddingVertical: 13, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  gateBtnLoading: { opacity: 0.75 },
  gateBtnText: { fontSize: 14, fontWeight: '700', color: JethroColors.navy },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: JethroColors.gold, borderRadius: 28,
    paddingVertical: 13, paddingHorizontal: 20,
    shadowColor: JethroColors.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  fabIcon: { fontSize: 14, color: JethroColors.navy },
  fabText: { fontSize: 14, fontWeight: '700', color: JethroColors.navy },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(11, 30, 53, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: JethroColors.navySurface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: JethroColors.muted,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: JethroColors.creme, marginBottom: 6 },
  modalSub: { fontSize: 13, color: JethroColors.muted, lineHeight: 19, marginBottom: 20 },
  modalQuestion: { fontSize: 15, fontWeight: '600', color: JethroColors.creme, marginBottom: 12 },
  yesNoRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  yesNoBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 10,
    borderWidth: 1.5, borderColor: JethroColors.navyDeep,
    alignItems: 'center', backgroundColor: JethroColors.navy,
  },
  yesNoBtnActive: { borderColor: JethroColors.gold, backgroundColor: JethroColors.goldMuted },
  yesNoBtnActiveNo: { borderColor: JethroColors.danger, backgroundColor: 'rgba(224,92,92,0.1)' },
  yesNoText: { fontSize: 15, fontWeight: '600', color: JethroColors.muted },
  yesNoTextActive: { color: JethroColors.creme },
  modalInput: {
    backgroundColor: JethroColors.navy, borderRadius: 10,
    padding: 14, fontSize: 14, color: JethroColors.creme,
    minHeight: 72, textAlignVertical: 'top', marginBottom: 16,
    borderWidth: 1, borderColor: JethroColors.navyDeep,
  },
  modalBtn: {
    backgroundColor: JethroColors.gold, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  modalBtnDisabled: { backgroundColor: JethroColors.navyDeep },
  modalBtnText: { fontSize: 15, fontWeight: '700', color: JethroColors.navy },
});
