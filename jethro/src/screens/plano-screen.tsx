import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { homeService, type PlanoCompleto, type PlanoSemanaCompleta } from '@/src/services/home/home-service';
import { mentorContext } from '@/src/lib/mentor-context';
import { planoContext } from '@/src/lib/plano-context';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';
import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { getShadow, Radius, Spacing } from '@/src/theme/spacing';

const BLOCOS = [
  { titulo: 'Fundamento',  range: [1, 5]   as [number, number], versiculo: 'Pv 27:23' },
  { titulo: 'Estrutura',   range: [6, 10]  as [number, number], versiculo: 'Êx 18:17' },
  { titulo: 'Controle',    range: [11, 15] as [number, number], versiculo: 'Sl 119:105' },
  { titulo: 'Crescimento', range: [16, 20] as [number, number], versiculo: 'Lc 16:10' },
  { titulo: 'Legado',      range: [21, 24] as [number, number], versiculo: 'Mt 25:21' },
];

const BIBLIOTECA_ITENS: Record<string, { titulo: string; subtitulo: string }> = {
  P1: { titulo: 'Propósito e Chamado',   subtitulo: 'Encontrando o porquê do seu negócio' },
  P2: { titulo: 'Gestão Financeira',     subtitulo: 'DRE, fluxo de caixa e margem' },
  P3: { titulo: 'Precificação Bíblica',  subtitulo: 'Cobrar com justiça e sustentabilidade' },
  P4: { titulo: 'Vendas com Integridade',subtitulo: 'Persuasão que honra e serve' },
  P5: { titulo: 'Liderança e Equipe',    subtitulo: 'Delegar, treinar e multiplicar' },
  P6: { titulo: 'Processos e Sistemas',  subtitulo: 'Negócio que funciona sem você' },
  P7: { titulo: 'Visão e Legado',        subtitulo: 'Construindo algo que permanece' },
};

function isAtiva(semana: PlanoSemanaCompleta): boolean {
  return semana.gate_status === 'available' || semana.gate_status === 'completed';
}

type SemanaDetalheProps = {
  semana: PlanoSemanaCompleta;
  onBack: () => void;
  onWeekAdvanced: () => void;
  initialAba?: 'objetivo' | 'acoes' | 'materiais' | 'checkin';
};

function SemanaDetalhe({ semana, onBack, onWeekAdvanced, initialAba }: SemanaDetalheProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeDetalheStyles(colors), [colors]);
  const router = useRouter();
  const [aba, setAba] = useState<'objetivo' | 'acoes' | 'materiais' | 'checkin'>(initialAba ?? 'objetivo');

  const [confianca,     setConfianca]     = useState<number | null>(semana.check_in?.confianca ?? null);
  const [clareza,       setClareza]       = useState<number | null>(semana.check_in?.clareza   ?? null);
  const [progresso,     setProgresso]     = useState<number | null>(semana.check_in?.progresso  ?? null);
  const [registrado,    setRegistrado]    = useState(semana.check_in?.registrado ?? false);
  const [advancingGate, setAdvancingGate] = useState(false);

  // Estado local das ações para reflectir completação optimista
  const [acoesList, setAcoesList] = useState(() =>
    [...semana.acoes].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
  );
  // Feedback inline do botão "Em andamento"
  const [wipFeedbackIdx, setWipFeedbackIdx] = useState<number | null>(null);
  const wipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    homeService.getCheckInSemanal().then(ci => {
      if (ci) { setConfianca(ci.confianca); setClareza(ci.clareza); setProgresso(ci.progresso); setRegistrado(true); }
    }).catch(() => {});
  }, []);

  const handleRegistrarCheckIn = async () => {
    if (!confianca || !clareza || !progresso) return;
    try { await homeService.checkInSemanal({ confianca, clareza, progresso }); setRegistrado(true); }
    catch { /* ignore */ }
  };

  const handleAvancarSemana = async () => {
    setAdvancingGate(true);
    try { const r = await homeService.gateAdvance(); if (r.advanced) { onWeekAdvanced(); } }
    catch { /* ignore */ } finally { setAdvancingGate(false); }
  };

  const handleFeito = async (idx: number) => {
    const acao = acoesList[idx];
    setAcoesList(prev => prev.map((a, i) => i === idx ? { ...a, completada: true } : a));
    try {
      await homeService.completarTarefa(acao.id, true);
    } catch {
      setAcoesList(prev => prev.map((a, i) => i === idx ? { ...a, completada: false } : a));
    }
  };

  const handleEmAndamento = (idx: number) => {
    if (wipTimer.current) clearTimeout(wipTimer.current);
    setWipFeedbackIdx(idx);
    wipTimer.current = setTimeout(() => setWipFeedbackIdx(null), 2500);
  };

  const handleJethroAjuda = (acao: typeof acoesList[number], num: string) => {
    mentorContext.set(
      `Preciso de ajuda com a Tarefa ${num} da Semana ${semana.numero}: "${acao.texto}"\n\nObjectivo desta semana: ${semana.objetivo}`
    );
    router.push('/(tabs)/mentor');
  };

  const abas = [
    { id: 'objetivo'  as const, label: 'Objetivo'  },
    { id: 'acoes'     as const, label: 'Ações'      },
    { id: 'materiais' as const, label: 'Materiais'  },
    { id: 'checkin'   as const, label: 'Check-in'   },
  ];

  const firstIncompleteIdx = acoesList.findIndex(a => !a.completada);
  type AcaoStatus = 'concluida' | 'emAndamento' | 'bloqueada';
  const getAcaoStatus = (idx: number): AcaoStatus => {
    if (acoesList[idx].completada) return 'concluida';
    if (firstIncompleteIdx === -1 || idx === firstIncompleteIdx) return 'emAndamento';
    return 'bloqueada';
  };

  const tudo = confianca && clareza && progresso;
  const proximaSemana = semana.numero + 1;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.headerWrap}>
        <Pressable style={s.backBtn} onPress={onBack} accessibilityRole="button">
          <Ionicons name="arrow-back-outline" size={16} color={colors.inkMute} />
          <Text style={s.backText}>Voltar ao plano</Text>
        </Pressable>
        <Text style={s.semanaLabel}>SEMANA {String(semana.numero).padStart(2, '0')}</Text>
        <Text style={s.semanaTitle}>{semana.titulo ?? `Semana ${semana.numero}`}</Text>

        {semana.versiculo_texto ? (
          <View style={s.versiculo}>
            <Text style={s.versiculoTexto}>"{semana.versiculo_texto}"</Text>
            {semana.versiculo_ancora ? <Text style={s.versiculoAncora}>{semana.versiculo_ancora}</Text> : null}
          </View>
        ) : null}

        <View style={s.tabsRow}>
          {abas.map(a => (
            <Pressable key={a.id} style={[s.tabBtn, aba === a.id && s.tabBtnActive]}
              onPress={() => setAba(a.id)} accessibilityRole="tab" accessibilityState={{ selected: aba === a.id }}>
              <Text style={[s.tabLabel, aba === a.id && s.tabLabelActive]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Objetivo ── */}
        {aba === 'objetivo' && (
          <View>
            <Text style={s.sectionLabel}>OBJETIVO DA SEMANA</Text>
            <View style={s.objetivoCard}>
              <Text style={s.objetivoText}>{semana.objetivo}</Text>
            </View>
            {semana.indicador_sucesso ? (
              <>
                <Text style={s.sectionLabel}>INDICADOR DE SUCESSO</Text>
                <View style={s.indicadorCard}>
                  <Text style={s.bodyText}>{semana.indicador_sucesso}</Text>
                </View>
              </>
            ) : null}
          </View>
        )}

        {/* ── Ações — 3 estados visuais ── */}
        {aba === 'acoes' && (
          <View>
            <Text style={s.sectionLabel}>{acoesList.length} AÇÕES DESTA SEMANA</Text>
            {acoesList.map((acao, idx) => {
              const status = getAcaoStatus(idx);
              const num = String(acao.ordem ?? idx + 1).padStart(2, '0');
              const isConcluida   = status === 'concluida';
              const isEmAndamento = status === 'emAndamento';
              const isBloqueada   = status === 'bloqueada';
              return (
                <View key={idx} style={[s.tarefaCard, isEmAndamento && s.tarefaCardFoco, isBloqueada && s.tarefaCardDim]}>
                  <View style={[s.statusCircle, isConcluida && s.circleOk, isEmAndamento && s.circleFoco, isBloqueada && s.circleLock]}>
                    <Text style={isConcluida ? s.circleOkTx : isEmAndamento ? s.circleWipTx : s.circleLockTx}>
                      {isConcluida ? '✓' : isEmAndamento ? '◑' : '🔒'}
                    </Text>
                  </View>
                  <View style={s.tarefaBody}>
                    <View style={s.tarefaTopRow}>
                      <Text style={[s.tarefaNum, isBloqueada && s.dimText]}>
                        Tarefa {num}{isBloqueada ? `  ·  Aguarda Tarefa ${String((acao.ordem ?? idx + 1) - 1).padStart(2,'0')}` : ''}
                      </Text>
                      {isConcluida   && <View style={s.concBadge}><Text style={s.concBadgeTx}>CONCLUÍDA</Text></View>}
                      {isEmAndamento && <View style={s.focoBadge}><Text style={s.focoBadgeTx}>FOCO DE HOJE</Text></View>}
                    </View>
                    <Text style={[s.tarefaTx, isBloqueada && s.dimText, isConcluida && s.mutedText]}>{acao.texto}</Text>
                    {acao.concluida_quando && !isBloqueada ? (
                      <View style={s.criterioRow}>
                        <Text style={s.criterioTx}>
                          {'✅ '}<Text style={s.criterioBold}>Concluída quando: </Text>{acao.concluida_quando}
                        </Text>
                      </View>
                    ) : null}
                    {isEmAndamento && (
                      <>
                        <View style={s.btnRow}>
                          <Pressable
                            style={s.btnOk}
                            onPress={() => void handleFeito(idx)}
                            accessibilityRole="button"
                          >
                            <Text style={s.btnOkTx}>✓  Feito</Text>
                          </Pressable>
                          <Pressable
                            style={s.btnWip}
                            onPress={() => handleEmAndamento(idx)}
                            accessibilityRole="button"
                          >
                            <Text style={s.btnWipTx}>◑  Em andamento</Text>
                          </Pressable>
                        </View>
                        {wipFeedbackIdx === idx && (
                          <Text style={s.wipFeedback}>Continue! Você está no caminho certo 💪</Text>
                        )}
                        <Pressable
                          style={s.jethroBtn}
                          onPress={() => handleJethroAjuda(acao, num)}
                          accessibilityRole="button"
                        >
                          <Text style={s.jethroBtnTx}>✦  Jethro, me ajuda com esta tarefa</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Materiais ── */}
        {aba === 'materiais' && (
          <View style={s.matCard}>
            <Text style={s.matLabelMain}>
              {semana.materiais_semana && semana.materiais_semana.length > 0
                ? `${semana.materiais_semana.length} MATERIAIS DESTA SEMANA`
                : 'MATERIAIS DESTA SEMANA'}
            </Text>
            <View style={s.matDivider} />
            {semana.materiais_semana && semana.materiais_semana.length > 0
              ? semana.materiais_semana.map((mat, idx) => (
                  <View key={idx}>
                    <View style={s.matItemWrap}>
                      <View style={[s.matBadge, matBgStyle(mat.tipo)]}>
                        <Text style={[s.matBadgeTx, matTxStyle(mat.tipo)]}>{mat.tipo}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.matTitulo}>{mat.titulo}</Text>
                        {mat.descricao ? <Text style={s.matDescricao}>{mat.descricao}</Text> : null}
                      </View>
                    </View>
                    {idx < (semana.materiais_semana?.length ?? 0) - 1 && <View style={s.matSep} />}
                  </View>
                ))
              : (semana.materiais_biblioteca ?? []).map(pilarId => {
                  const item = BIBLIOTECA_ITENS[pilarId];
                  if (!item) return null;
                  return (
                    <View key={pilarId}>
                      <View style={s.matItemWrap}>
                        <View style={s.matBadgePilar}><Text style={s.matBadgePilarTx}>{pilarId}</Text></View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.matTitulo}>{item.titulo}</Text>
                          <Text style={s.matDescricao}>{item.subtitulo}</Text>
                        </View>
                      </View>
                      <View style={s.matSep} />
                    </View>
                  );
                })}
            <View style={s.matDivider} />
            <Pressable onPress={() => router.push('/(tabs)/biblioteca')} accessibilityRole="button">
              <Text style={s.matVerTodos}>Ver todos os materiais na Biblioteca →</Text>
            </Pressable>
          </View>
        )}

        {/* ── Check-in + Gate ── */}
        {aba === 'checkin' && (
          <View>
            <View style={s.checkInCard}>
              <View style={s.checkInHeader}>
                <View style={s.checkInDot} />
                <Text style={s.checkInLabel}>CHECK-IN DA SEMANA</Text>
              </View>
              <Text style={s.checkInTitulo}>Como você encerra esta semana?</Text>
              {([
                { label: 'Confiança no negócio',  val: confianca, set: setConfianca },
                { label: 'Clareza da direção',    val: clareza,   set: setClareza   },
                { label: 'Sensação de progresso', val: progresso, set: setProgresso },
              ] as { label: string; val: number | null; set: (n: number) => void }[]).map(({ label, val, set }) => (
                <View key={label} style={s.escalaWrap}>
                  <Text style={s.escalaLabel}>{label}</Text>
                  <View style={s.escalaRow}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <Pressable key={n} style={[s.escalaBtn, val === n && s.escalaBtnSel]}
                        onPress={() => !registrado && set(n)} disabled={registrado} accessibilityRole="button">
                        <Text style={[s.escalaBtnTx, val === n && s.escalaBtnTxSel]}>{n}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
              <View style={s.matDivider} />
              <Pressable style={[s.registrarBtn, (!tudo || registrado) && s.registrarBtnDisabled]}
                onPress={() => void handleRegistrarCheckIn()} disabled={!tudo || registrado} accessibilityRole="button">
                <Text style={s.registrarBtnTx}>{registrado ? '✓  Semana registrada' : 'Registrar semana'}</Text>
              </Pressable>
            </View>

            <View style={s.gateCard}>
              <View style={s.gateTopRow}>
                <View style={s.gateIconWrap}><Text style={s.gateIconTx}>⬡</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.gateLabel}>GATE DE AVANÇO  ·  SEMANA {String(semana.numero).padStart(2,'0')} → {String(proximaSemana).padStart(2,'0')}</Text>
                  <Text style={s.gateTitulo}>Pronto para avançar?</Text>
                </View>
              </View>
              <Text style={s.gateDesc}>
                Registre o check-in para liberar a Semana {String(proximaSemana).padStart(2,'0')}. Este passo é obrigatório — garante que você avança com intencionalidade.
              </Text>
              <Pressable style={[s.avancarBtn, !registrado && s.avancarBtnDisabled]}
                onPress={registrado ? () => void handleAvancarSemana() : undefined}
                disabled={!registrado || advancingGate} accessibilityRole="button">
                <Text style={s.avancarBtnTx}>
                  {advancingGate ? 'A avançar...' : `Avançar para Semana ${String(proximaSemana).padStart(2,'0')} →`}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function matBgStyle(tipo: string): object {
  const m: Record<string, object> = { AULA: { backgroundColor: '#0B1C35' }, TEMPLATE: { backgroundColor: '#FEF3C7' }, ARTIGO: { backgroundColor: '#D1FAE5' } };
  return m[tipo] ?? { backgroundColor: '#DDD6C8' };
}
function matTxStyle(tipo: string): object {
  const m: Record<string, object> = { AULA: { color: '#C9A655' }, TEMPLATE: { color: '#92400E' }, ARTIGO: { color: '#065F46' } };
  return m[tipo] ?? { color: '#666' };
}

function makeDetalheStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe:           { flex: 1, backgroundColor: c.background },
    headerWrap:     { paddingHorizontal: Spacing.screenH, paddingTop: 16, paddingBottom: 0 },
    backBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
    backText:       { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkMute },
    semanaLabel:    { fontFamily: FontFamily.sansSemiBold, fontSize: 10, color: palette.gold500, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
    semanaTitle:    { fontFamily: FontFamily.serifMedium, fontSize: 20, color: c.ink, lineHeight: 26, marginBottom: 12 },
    versiculo:      { backgroundColor: palette.navy800, borderRadius: Radius.sm, padding: 14, marginBottom: 12 },
    versiculoTexto: { fontFamily: FontFamily.serifMediumItalic, fontSize: 13, color: palette.paper, lineHeight: 20 },
    versiculoAncora:{ fontFamily: FontFamily.sansRegular, fontSize: 10, color: 'rgba(212,175,55,0.75)', marginTop: 5 },
    tabsRow:        { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.hairline },
    tabBtn:         { flex: 1, paddingVertical: 9, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabBtnActive:   { borderBottomColor: palette.navy800 },
    tabLabel:       { fontFamily: FontFamily.sansMedium, fontSize: 12, color: c.inkMute },
    tabLabelActive: { fontFamily: FontFamily.sansBold, fontSize: 12, color: palette.navy800 },
    scroll:         { flex: 1 },
    scrollContent:  { paddingHorizontal: Spacing.screenH, paddingTop: 16 },
    sectionLabel:   { fontFamily: FontFamily.sansBold, fontSize: 9, color: palette.gold500, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
    objetivoCard:   { backgroundColor: c.surface, borderRadius: Radius.md, padding: 20, marginBottom: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, ...getShadow(1) },
    objetivoText:   { fontFamily: FontFamily.sansRegular, fontSize: 15, color: c.ink, lineHeight: 24 },
    indicadorCard:  { backgroundColor: c.surface, borderRadius: Radius.md, padding: 20, marginBottom: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, borderLeftWidth: 3, borderLeftColor: palette.gold500, ...getShadow(1) },
    card:           { backgroundColor: c.surface, borderRadius: Radius.md, padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, ...getShadow(1) },
    cardGold:       { backgroundColor: c.surface, borderRadius: Radius.md, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: palette.gold500, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, ...getShadow(1) },
    bodyText:       { fontFamily: FontFamily.sansRegular, fontSize: 14, color: c.ink, lineHeight: 22 },
    tarefaCard:     { backgroundColor: c.surface, borderRadius: Radius.md, padding: 14, marginBottom: 8, flexDirection: 'row', gap: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, ...getShadow(1) },
    tarefaCardFoco: { borderColor: palette.gold500, borderWidth: 1.5 },
    tarefaCardDim:  { opacity: 0.45 },
    statusCircle:   { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 2, flexShrink: 0 },
    circleOk:       { backgroundColor: palette.navy800 },
    circleFoco:     { backgroundColor: '#FFFBEB', borderWidth: 1.5, borderColor: palette.gold500 },
    circleLock:     { backgroundColor: c.background, borderWidth: 1, borderColor: c.hairline },
    circleOkTx:     { fontFamily: FontFamily.sansBold, fontSize: 11, color: palette.paper },
    circleWipTx:    { fontSize: 13, color: palette.gold500 },
    circleLockTx:   { fontSize: 11 },
    tarefaBody:     { flex: 1 },
    tarefaTopRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
    tarefaNum:      { fontFamily: FontFamily.sansBold, fontSize: 9, color: c.inkMute },
    dimText:        { color: '#CCCCCC' },
    mutedText:      { color: c.inkMute },
    concBadge:      { backgroundColor: c.hairline, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1 },
    concBadgeTx:    { fontFamily: FontFamily.sansBold, fontSize: 8, color: c.inkMute },
    focoBadge:      { backgroundColor: '#FEF9C3', borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1 },
    focoBadgeTx:    { fontFamily: FontFamily.sansBold, fontSize: 8, color: '#854D0E' },
    tarefaTx:       { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.ink, lineHeight: 19 },
    criterioRow:    { marginTop: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline },
    criterioTx:     { fontFamily: FontFamily.sansRegular, fontSize: 12, color: c.inkSoft, lineHeight: 18 },
    criterioBold:   { fontFamily: FontFamily.sansBold, color: c.ink },
    btnRow:         { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 6 },
    btnOk:          { flex: 1, backgroundColor: palette.navy800, borderRadius: Radius.xs, paddingVertical: 8, alignItems: 'center' },
    btnOkTx:        { fontFamily: FontFamily.sansSemiBold, fontSize: 12, color: palette.paper },
    btnWip:         { flex: 1, borderWidth: 1, borderColor: c.hairline, borderRadius: Radius.xs, paddingVertical: 8, alignItems: 'center' },
    btnWipTx:       { fontFamily: FontFamily.sansMedium, fontSize: 12, color: c.ink },
    jethroBtn:      { backgroundColor: palette.gold500, borderRadius: Radius.xs, paddingVertical: 10, alignItems: 'center' },
    jethroBtnTx:    { fontFamily: FontFamily.sansBold, fontSize: 12, color: palette.navy800 },
    wipFeedback:    { fontFamily: FontFamily.sansRegular, fontSize: 12, color: palette.gold500, marginTop: 4, marginBottom: 4 },
    matCard:        { backgroundColor: c.surface, borderRadius: Radius.md, padding: 14, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, ...getShadow(1) },
    matLabelMain:   { fontFamily: FontFamily.sansBold, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.7, color: c.inkMute, marginBottom: 3 },
    matLabelSub:    { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute },
    matDivider:     { height: 1, backgroundColor: c.hairline, marginVertical: 8 },
    matItemWrap:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
    matItem:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 3 },
    matBadge:       { borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
    matBadgeTx:     { fontFamily: FontFamily.sansBold, fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
    matBadgePilar:  { width: 44, height: 44, borderRadius: Radius.xs, backgroundColor: palette.goldMuted, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    matBadgePilarTx:{ fontFamily: FontFamily.serifSemiBold, fontSize: 12, color: palette.navy800 },
    matTitulo:      { fontFamily: FontFamily.sansSemiBold, fontSize: 13, color: c.ink, marginBottom: 2 },
    matDescricao:   { fontFamily: FontFamily.sansRegular, fontSize: 12, color: c.inkMute, lineHeight: 17 },
    matSub:         { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute },
    matSep:         { height: 1, backgroundColor: c.hairline, marginVertical: 2 },
    matVerTodos:    { fontFamily: FontFamily.sansBold, fontSize: 11, color: palette.gold500, textAlign: 'center' },
    checkInCard:    { backgroundColor: c.surface, borderRadius: Radius.md, padding: 16, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, ...getShadow(1) },
    checkInHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    checkInDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.gold500 },
    checkInLabel:   { fontFamily: FontFamily.sansBold, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: c.inkMute },
    checkInTitulo:  { fontFamily: FontFamily.serifMedium, fontSize: 17, color: c.ink, marginBottom: 16, lineHeight: 23 },
    escalaWrap:     { marginBottom: 12 },
    escalaLabel:    { fontFamily: FontFamily.sansRegular, fontSize: 12, color: c.inkSoft, marginBottom: 6 },
    escalaRow:      { flexDirection: 'row', gap: 4 },
    escalaBtn:      { flex: 1, height: 36, borderWidth: 1, borderColor: c.hairline, borderRadius: Radius.xs, justifyContent: 'center', alignItems: 'center', backgroundColor: c.surface },
    escalaBtnSel:   { backgroundColor: palette.navy800, borderColor: palette.navy800 },
    escalaBtnTx:    { fontFamily: FontFamily.sansRegular, fontSize: 14, color: c.inkMute },
    escalaBtnTxSel: { fontFamily: FontFamily.sansBold, color: palette.paper },
    registrarBtn:         { backgroundColor: palette.navy800, borderRadius: Radius.xs, paddingVertical: 11, alignItems: 'center' },
    registrarBtnDisabled: { backgroundColor: c.hairline },
    registrarBtnTx:       { fontFamily: FontFamily.sansBold, fontSize: 13, color: palette.paper },
    gateCard:       { backgroundColor: palette.navy800, borderRadius: Radius.md, padding: 16, marginBottom: 16 },
    gateTopRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
    gateIconWrap:   { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(201,166,85,0.2)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    gateIconTx:     { fontSize: 14, color: palette.gold500 },
    gateLabel:      { fontFamily: FontFamily.sansBold, fontSize: 8.5, textTransform: 'uppercase', letterSpacing: 0.5, color: palette.gold500, marginBottom: 2 },
    gateTitulo:     { fontFamily: FontFamily.serifMedium, fontSize: 15, color: palette.paper },
    gateDesc:       { fontFamily: FontFamily.sansRegular, fontSize: 12, color: 'rgba(239,239,234,0.70)', lineHeight: 18, marginBottom: 14 },
    avancarBtn:           { backgroundColor: palette.gold500, borderRadius: Radius.xs, paddingVertical: 11, alignItems: 'center' },
    avancarBtnDisabled:   { backgroundColor: 'rgba(201,166,85,0.35)' },
    avancarBtnTx:         { fontFamily: FontFamily.sansBold, fontSize: 13, color: palette.navy800 },
    materialCard:     { backgroundColor: c.surface, borderRadius: Radius.md, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, ...getShadow(1) },
    materialIcon:     { width: 44, height: 44, borderRadius: Radius.xs, backgroundColor: palette.goldMuted, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    materialIconText: { fontFamily: FontFamily.serifSemiBold, fontSize: 12, color: palette.navy800 },
    materialTitulo:   { fontFamily: FontFamily.serifMedium, fontSize: 14, color: c.ink, marginBottom: 2 },
    materialSub:      { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute },
  });
}

type BlocoData = {
  titulo: string;
  range: [number, number];
  versiculo: string;
  semanas: PlanoSemanaCompleta[];
};

function BlocoAccordion({
  bloco,
  index,
  aberto,
  onToggle,
  onSemanaPress,
}: {
  bloco: BlocoData;
  index: number;
  aberto: boolean;
  onToggle: () => void;
  onSemanaPress: (semana: PlanoSemanaCompleta) => void;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeAccordionStyles(colors), [colors]);

  const r0 = String(bloco.range[0]).padStart(2, '0');
  const r1 = String(bloco.range[1]).padStart(2, '0');
  const rangeLabel = `Semana ${r0}–${r1}`;

  return (
    <View style={s.wrap}>
      {/* ── Header do bloco ── */}
      <Pressable
        style={[s.header, aberto && s.headerOpen]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
      >
        <View style={{ flex: 1 }}>
          {aberto ? (
            // Expandido: "Fase N" + badge pill
            <View style={s.headerTop}>
              <Text style={s.blocoLabelOpen}>Fase {index + 1}</Text>
              <View style={s.badgeOpen}>
                <Text style={s.badgeOpenTx}>{bloco.titulo.toUpperCase()}</Text>
              </View>
            </View>
          ) : (
            // Colapsado: "Fase N · NomeFase" inline
            <Text style={s.blocoLabelClosed}>Fase {index + 1} · {bloco.titulo}</Text>
          )}
          <Text style={[s.blocoTitulo, aberto && s.blocoTituloOpen]}>{bloco.titulo}</Text>
          <Text style={[s.blocoMeta, aberto && s.blocoMetaOpen]}>{rangeLabel} · {bloco.versiculo}</Text>
        </View>
        <Text style={[s.chevron, aberto && s.chevronOpen]}>{aberto ? '∧' : '∨'}</Text>
      </Pressable>

      {/* ── Lista de semanas (apenas quando expandido) ── */}
      {aberto && (
        <View style={s.semanasList}>
          {bloco.semanas.map((semana) => {
            const num = String(semana.numero).padStart(2, '0');
            const titulo = semana.titulo ?? `Semana ${num}`;

            if (semana.gate_status === 'available') {
              // Semana ATIVA — card creme com progresso
              const concluidas = semana.acoes.filter(a => a.completada).length;
              const total      = semana.acoes.length;
              const pct        = total > 0 ? Math.round((concluidas / total) * 100) : 0;
              return (
                <Pressable
                  key={semana.numero}
                  style={s.semanaAtiva}
                  onPress={() => onSemanaPress(semana)}
                  accessibilityRole="button"
                >
                  <View style={{ flex: 1 }}>
                    <View style={s.semanaAtivaTop}>
                      <Text style={s.semanaAtivaNum}>Semana {num}</Text>
                      <View style={s.ativaBadge}>
                        <Text style={s.ativaBadgeTx}>ATIVA</Text>
                      </View>
                    </View>
                    <Text style={s.semanaAtivaTitulo}>{titulo}</Text>
                    {total > 0 && (
                      <View style={s.progressWrap}>
                        <Text style={s.progressLabel}>{concluidas} de {total} ações concluídas · {pct}%</Text>
                        <View style={s.progressTrack}>
                          <View style={[s.progressFill, { width: `${pct}%` as `${number}%` }]} />
                        </View>
                      </View>
                    )}
                  </View>
                  <Text style={s.semanaAtivaArrow}>→</Text>
                </Pressable>
              );
            }

            if (semana.gate_status === 'completed') {
              // Semana CONCLUÍDA — linha compacta com ✓
              return (
                <Pressable
                  key={semana.numero}
                  style={s.semanaCompact}
                  onPress={() => onSemanaPress(semana)}
                  accessibilityRole="button"
                >
                  <Text style={s.semanaCompactTx}>
                    <Text style={s.semanaCompactNum}>Semana {num}</Text>
                    {' · '}{titulo}
                  </Text>
                  <Text style={s.semanaCompactCheck}>✓</Text>
                </Pressable>
              );
            }

            // Semana BLOQUEADA — linha compacta com cadeado
            return (
              <View key={semana.numero} style={s.semanaLocked}>
                <Text style={s.semanaLockedTx} numberOfLines={1}>
                  <Text style={s.semanaLockedNum}>Semana {num}</Text>
                  {' · '}{titulo}
                </Text>
                <Text style={s.semanaLockedIcon}>🔒</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function makeAccordionStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrap:            { marginBottom: 10 },

    // ── Header colapsado / expandido ────────────────────────────────────────
    header:          { padding: 16, backgroundColor: c.surface, borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, ...getShadow(1) },
    headerOpen:      { backgroundColor: palette.navy800, borderRadius: Radius.md, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderColor: palette.navy800 },

    // Colapsado: "Fase N · NomeFase"
    blocoLabelClosed: { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute, marginBottom: 4 },
    // Expandido: "Fase N" (ouro, subtil)
    headerTop:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    blocoLabelOpen:   { fontFamily: FontFamily.sansRegular, fontSize: 11, color: 'rgba(212,175,55,0.70)' },
    // Badge pill só no expandido
    badgeOpen:        { borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(201,166,85,0.50)' },
    badgeOpenTx:      { fontFamily: FontFamily.sansBold, fontSize: 9, color: palette.gold500, letterSpacing: 1 },

    blocoTitulo:      { fontFamily: FontFamily.serifSemiBold, fontSize: 18, color: c.ink, marginBottom: 3 },
    blocoTituloOpen:  { color: palette.paper },
    blocoMeta:        { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute },
    blocoMetaOpen:    { color: 'rgba(239,239,234,0.50)' },
    chevron:          { fontFamily: FontFamily.sansRegular, fontSize: 16, color: c.inkMute, marginLeft: 8 },
    chevronOpen:      { color: palette.gold500 },

    // ── Container de semanas ────────────────────────────────────────────────
    semanasList:      { borderBottomLeftRadius: Radius.md, borderBottomRightRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, borderTopWidth: 0, borderColor: c.hairline, overflow: 'hidden', backgroundColor: c.surface },

    // Semana ATIVA — fundo creme, borda dourada
    semanaAtiva:      { backgroundColor: '#FFFBEB', padding: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline, flexDirection: 'row', alignItems: 'center', gap: 10 },
    semanaAtivaTop:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    semanaAtivaNum:   { fontFamily: FontFamily.sansBold, fontSize: 10, color: palette.gold500, letterSpacing: 0.5 },
    ativaBadge:       { backgroundColor: '#FEF3C7', borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
    ativaBadgeTx:     { fontFamily: FontFamily.sansBold, fontSize: 8, color: '#92400E', letterSpacing: 0.5 },
    semanaAtivaTitulo:{ fontFamily: FontFamily.serifSemiBold, fontSize: 15, color: c.ink, lineHeight: 21, marginBottom: 6 },
    semanaAtivaArrow: { fontFamily: FontFamily.sansRegular, fontSize: 18, color: palette.gold500, flexShrink: 0 },
    progressWrap:     { gap: 4 },
    progressLabel:    { fontFamily: FontFamily.sansRegular, fontSize: 10, color: c.inkMute },
    progressTrack:    { height: 3, backgroundColor: c.hairline, borderRadius: 2, overflow: 'hidden' },
    progressFill:     { height: 3, backgroundColor: palette.gold500, borderRadius: 2 },

    // Semana CONCLUÍDA — linha compacta com ✓
    semanaCompact:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline },
    semanaCompactTx:  { flex: 1, fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkSoft },
    semanaCompactNum: { fontFamily: FontFamily.sansSemiBold, fontSize: 13, color: c.inkSoft },
    semanaCompactCheck:{ fontFamily: FontFamily.sansBold, fontSize: 13, color: palette.gold500, marginLeft: 8 },

    // Semana BLOQUEADA — linha compacta com cadeado
    semanaLocked:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline, opacity: 0.45 },
    semanaLockedTx:   { flex: 1, fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkMute },
    semanaLockedNum:  { fontFamily: FontFamily.sansSemiBold, fontSize: 13, color: c.inkMute },
    semanaLockedIcon: { fontSize: 13, marginLeft: 8 },
  });
}

export function PlanoScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeScreenStyles(colors), [colors]);

  const [plano,            setPlano]            = useState<PlanoCompleto | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [blocoAberto,      setBlocoAberto]      = useState<number | null>(0);
  const [semanaDetalhe,    setSemanaDetalhe]    = useState<PlanoSemanaCompleta | null>(null);
  const [detalheInitialAba,setDetalheInitialAba]= useState<'objetivo' | 'acoes' | undefined>(undefined);
  const [aba,              setAba]              = useState<'visaoGeral' | 'fases'>('visaoGeral');
  const pendingAcoes = useRef(false);

  const openCurrentWeekAcoes = useCallback((data: PlanoCompleto | null) => {
    if (!data) return;
    const current = data.semanas.find(s => s.gate_status === 'available') ?? null;
    if (current) {
      setDetalheInitialAba('acoes');
      setSemanaDetalhe(current);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    const intent = planoContext.consume();
    if (intent === 'acoes') {
      if (plano) {
        openCurrentWeekAcoes(plano);
      } else {
        pendingAcoes.current = true;
      }
    }
  }, [plano, openCurrentWeekAcoes]));

  const loadPlano = useCallback(async () => {
    try {
      const data = await homeService.getPlanoCompleto();
      setPlano(data);
      if (pendingAcoes.current && data) {
        pendingAcoes.current = false;
        openCurrentWeekAcoes(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [openCurrentWeekAcoes]);

  useEffect(() => { void loadPlano(); }, [loadPlano]);

  const handleBack = useCallback(() => {
    setSemanaDetalhe(null);
    setDetalheInitialAba(undefined);
  }, []);

  if (semanaDetalhe) {
    return (
      <SemanaDetalhe
        semana={semanaDetalhe}
        onBack={handleBack}
        onWeekAdvanced={() => { handleBack(); void loadPlano(); }}
        initialAba={detalheInitialAba}
      />
    );
  }

  const blocos: BlocoData[] = BLOCOS.map(b => {
    const semanasDoBloco = (plano?.semanas ?? []).filter(s => s.numero >= b.range[0] && s.numero <= b.range[1]);
    // Usa o bloco/tag da primeira semana gerada (título personalizado pelo Claude) ou o hardcoded
    const primeiraAtiva  = semanasDoBloco.find(s => s.gate_status === 'available' || s.gate_status === 'completed');
    const titulo = primeiraAtiva?.bloco ?? semanasDoBloco[0]?.bloco ?? semanasDoBloco[0]?.tag ?? b.titulo;
    return { titulo, range: b.range, versiculo: b.versiculo, semanas: semanasDoBloco };
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header + Tabs */}
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Meu Plano</Text>
        <Text style={s.pageSub}>24 semanas · 5 fases · gerado pelo Jethro</Text>
        <View style={s.tabRow}>
          <Pressable
            style={[s.tabBtn, aba === 'visaoGeral' && s.tabBtnActive]}
            onPress={() => setAba('visaoGeral')}
            accessibilityRole="tab"
          >
            <Text style={[s.tabLabel, aba === 'visaoGeral' && s.tabLabelActive]}>Visão Geral</Text>
          </Pressable>
          <Pressable
            style={[s.tabBtn, aba === 'fases' && s.tabBtnActive]}
            onPress={() => setAba('fases')}
            accessibilityRole="tab"
          >
            <Text style={[s.tabLabel, aba === 'fases' && s.tabLabelActive]}>Fases</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : aba === 'visaoGeral' ? (
        <VisaoGeralTab plano={plano} colors={colors} />
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {blocos.map((bloco, i) => (
            <BlocoAccordion
              key={bloco.titulo}
              bloco={bloco}
              index={i}
              aberto={blocoAberto === i}
              onToggle={() => setBlocoAberto(prev => prev === i ? null : i)}
              onSemanaPress={semana => setSemanaDetalhe(semana)}
            />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Aba Visão Geral ──────────────────────────────────────────────────────────
function VisaoGeralTab({ plano, colors }: { plano: PlanoCompleto | null; colors: ThemeColors }) {
  const s = useMemo(() => makeVisaoGeralStyles(colors), [colors]);

  if (!plano) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyText}>Plano ainda não gerado.</Text>
      </View>
    );
  }

  const temVisaoGeral = plano.tagline || plano.introducao || (plano.diagnostico_geral?.length ?? 0) > 0;

  if (!temVisaoGeral) {
    return (
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.placeholderCard}>
          <Text style={s.placeholderTitle}>✦ Visão Geral em breve</Text>
          <Text style={s.placeholderSub}>
            O seu diagnóstico personalizado, tagline e fundamento bíblico aparecerão aqui após a próxima geração do plano.
          </Text>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

      {/* ① O Seu Plano — card navy com tagline */}
      {plano.tagline ? (
        <View style={s.taglineCard}>
          <Text style={s.taglineEyebrow}>✦  O SEU PLANO</Text>
          <Text style={s.taglineText}>{plano.tagline}</Text>
          {(plano.negocio || plano.data_geracao) ? (
            <Text style={s.taglineMeta}>
              {[plano.negocio, plano.data_geracao ? new Date(plano.data_geracao).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : null].filter(Boolean).join('  ·  ')}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* ② Introdução */}
      {plano.introducao ? (
        <View style={s.secCard}>
          <Text style={s.secLabel}>INTRODUÇÃO</Text>
          <Text style={s.secText}>{plano.introducao}</Text>
        </View>
      ) : null}

      {/* ③ Diagnóstico Geral — borda dourada, bullets com dados reais */}
      {(plano.diagnostico_geral?.length ?? 0) > 0 ? (
        <View style={s.diagCard}>
          <Text style={s.secLabel}>DIAGNÓSTICO GERAL</Text>
          {(plano.diagnostico_geral ?? []).map((item, idx) => (
            <View key={idx} style={s.diagItem}>
              <View style={s.diagDot} />
              <Text style={s.diagText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* ④ Fundamento Bíblico e Mentalidade */}
      {(plano.fundamento_biblico?.length ?? 0) > 0 ? (
        <View style={s.secCard}>
          <Text style={s.secLabel}>FUNDAMENTO BÍBLICO E MENTALIDADE</Text>
          {(plano.fundamento_biblico ?? []).map((fund, idx) => (
            <View key={idx} style={[s.versiculoBlock, idx > 0 && { marginTop: 8 }]}>
              <Text style={s.versiculoQuote}>"</Text>
              <Text style={s.versiculoTx}>"{fund.versiculo}"</Text>
              <Text style={s.versiculoRef}>{fund.referencia}</Text>
              {fund.contexto_aplicado ? (
                <Text style={s.versiculoContexto}>{fund.contexto_aplicado}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function makeVisaoGeralStyles(c: ThemeColors) {
  return StyleSheet.create({
    scroll:         { flex: 1 },
    scrollContent:  { paddingHorizontal: Spacing.screenH, paddingTop: 12 },
    empty:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    emptyText:      { fontFamily: FontFamily.sansRegular, fontSize: 14, color: c.inkMute },
    placeholderCard:{ backgroundColor: c.surface, borderRadius: Radius.md, padding: 20, marginTop: 8, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline },
    placeholderTitle:{ fontFamily: FontFamily.serifMedium, fontSize: 16, color: palette.gold500, marginBottom: 10 },
    placeholderSub:  { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkMute, lineHeight: 20, textAlign: 'center' },

    // ① O Seu Plano — card navy
    taglineCard:    { backgroundColor: palette.navy800, borderRadius: Radius.md, padding: 18, marginBottom: 12, ...getShadow(2) },
    taglineEyebrow: { fontFamily: FontFamily.sansBold, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, color: palette.gold500, marginBottom: 10 },
    taglineText:    { fontFamily: FontFamily.serifSemiBold, fontSize: 18, color: palette.paper, lineHeight: 26, marginBottom: 10 },
    taglineMeta:    { fontFamily: FontFamily.sansRegular, fontSize: 11, color: 'rgba(201,166,85,0.75)' },

    // ② Introdução e secções genéricas
    secCard:        { backgroundColor: c.surface, borderRadius: Radius.md, padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, ...getShadow(1) },
    secLabel:       { fontFamily: FontFamily.sansBold, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: palette.gold500, marginBottom: 10 },
    secText:        { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkSoft, lineHeight: 21 },

    // ③ Diagnóstico Geral — borda dourada esquerda
    diagCard:       { backgroundColor: c.surface, borderRadius: Radius.md, padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, borderLeftWidth: 3, borderLeftColor: palette.gold500, ...getShadow(1) },
    diagItem:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    diagDot:        { width: 7, height: 7, borderRadius: 3.5, backgroundColor: palette.gold500, marginTop: 7, flexShrink: 0 },
    diagText:       { flex: 1, fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.ink, lineHeight: 20 },

    // ④ Fundamento Bíblico — cards navy em itálico
    versiculoBlock:   { backgroundColor: palette.navy800, borderRadius: Radius.sm, padding: 16, overflow: 'hidden' },
    versiculoQuote:   { position: 'absolute', top: 6, right: 14, fontFamily: FontFamily.serifSemiBold, fontSize: 72, lineHeight: 72, color: palette.gold500, opacity: 0.15 },
    versiculoTx:      { fontFamily: FontFamily.serifMediumItalic, fontSize: 14, color: palette.paper, lineHeight: 22, marginBottom: 8 },
    versiculoRef:     { fontFamily: FontFamily.sansSemiBold, fontSize: 10, color: palette.gold500, letterSpacing: 0.5 },
    versiculoContexto:{ fontFamily: FontFamily.sansRegular, fontSize: 11, color: 'rgba(239,239,234,0.55)', lineHeight: 17, marginTop: 8 },
  });
}

function makeScreenStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe:         { flex: 1, backgroundColor: c.background },
    pageHeader:   { paddingHorizontal: Spacing.screenH, paddingTop: 16, paddingBottom: 0 },
    pageTitle:    { fontFamily: FontFamily.serifMedium, fontSize: 26, color: c.ink, marginBottom: 2 },
    pageSub:      { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkMute, marginBottom: 10 },
    tabRow:       { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.hairline },
    tabBtn:       { flex: 1, paddingVertical: 9, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabBtnActive: { borderBottomColor: palette.navy800 },
    tabLabel:     { fontFamily: FontFamily.sansMedium, fontSize: 13, color: c.inkMute },
    tabLabelActive:{ fontFamily: FontFamily.sansBold, fontSize: 13, color: palette.navy800 },
    loadingWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll:       { flex: 1 },
    scrollContent:{ paddingHorizontal: Spacing.screenH, paddingTop: 8 },
  });
}
