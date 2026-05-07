import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { homeService, type PlanoCompleto, type PlanoSemanaCompleta } from '@/src/services/home/home-service';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';
import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';

type Bloco = {
  titulo:    string;
  subtitulo: string;
  semanas:   PlanoSemanaCompleta[];
};

const BLOCOS_DEF = [
  { titulo: 'Fundamento',  subtitulo: 'Semanas 1-5',   range: [1, 5] },
  { titulo: 'Estrutura',   subtitulo: 'Semanas 6-10',  range: [6, 10] },
  { titulo: 'Controlo',    subtitulo: 'Semanas 11-15', range: [11, 15] },
  { titulo: 'Crescimento', subtitulo: 'Semanas 16-20', range: [16, 20] },
  { titulo: 'Legado',      subtitulo: 'Semanas 21-24', range: [21, 24] },
];

function gateIcon(status: string) {
  if (status === 'completed') return '✓';
  if (status === 'available') return '●';
  return '○';
}

function gateColor(status: string, accent: string, muted: string) {
  if (status === 'completed' || status === 'available') return accent;
  return muted;
}

function faseLabel(fase: string) {
  const map: Record<string, string> = {
    fundamento: 'Fundamento', estrutura: 'Estrutura', controlo: 'Controlo',
    crescimento: 'Crescimento', escala: 'Escala', legado: 'Legado',
  };
  return map[fase] ?? fase;
}

function prioridadeColor(p: string) {
  if (p === 'critica') return palette.liveRed;
  if (p === 'alta')    return palette.gold500;
  if (p === 'media')   return '#6B9FD4';
  return palette.inkMute;
}

function SemanaCard({ semana }: { semana: PlanoSemanaCompleta }) {
  const router = useRouter();
  const { colors } = useTheme();
  const s = useMemo(() => makeSemanaStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);
  const isLocked     = semana.gate_status === 'locked';
  const isGenerating = !isLocked && !semana.conteudo_completo;
  const canExpand    = !isLocked && semana.conteudo_completo;

  return (
    <View style={[s.semanaCard, isLocked && s.semanaCardLocked]}>
      <Pressable style={s.semanaHeader} onPress={() => canExpand && setExpanded((v) => !v)}>
        <View style={s.semanaNumWrap}>
          <Text style={[s.semanaGateIcon, { color: gateColor(semana.gate_status, colors.accent, colors.inkMute) }]}>
            {gateIcon(semana.gate_status)}
          </Text>
          <Text style={[s.semanaNum, isLocked && s.textMuted]}>S{semana.numero}</Text>
        </View>
        <View style={s.semanaInfo}>
          <Text style={[s.semanaNome, isLocked && s.textMuted]} numberOfLines={2}>
            {semana.nome ?? semana.objetivo}
          </Text>
          <Text style={s.semanaFase}>
            {semana.bloco ? `${semana.bloco} · ${semana.tag ?? faseLabel(semana.fase)}` : faseLabel(semana.fase)}
          </Text>
        </View>
        {canExpand    && <Text style={[s.chevron, expanded && s.chevronOpen]}>›</Text>}
        {isGenerating && <Text style={s.generatingBadge}>⟳</Text>}
        {isLocked     && <Text style={s.lockIcon}>⊘</Text>}
      </Pressable>

      {isGenerating && (
        <View style={s.generatingRow}>
          <Text style={s.generatingText}>A preparar o conteúdo desta semana…</Text>
        </View>
      )}

      {expanded && semana.conteudo_completo && (
        <View style={s.semanaDetail}>
          {semana.nome && <Text style={s.detailObjetivo}>{semana.objetivo}</Text>}

          {semana.por_que_importa && (
            <View style={s.detailBlock}>
              <Text style={s.detailLabel}>Por que esta semana importa</Text>
              <Text style={s.detailText}>{semana.por_que_importa}</Text>
            </View>
          )}

          {semana.versiculo && (
            <View style={s.versiculoWrap}>
              <Text style={s.versiculoText}>✦ {semana.versiculo}</Text>
            </View>
          )}

          {semana.tarefas.length > 0 && (
            <View style={s.detailBlock}>
              <Text style={s.detailLabel}>Tarefas</Text>
              {semana.tarefas.map((t, i) => (
                <View key={i} style={s.tarefaRow}>
                  <Text style={[s.tarefaPrio, { color: prioridadeColor(t.prioridade) }]}>◆</Text>
                  <View style={s.tarefaBody}>
                    <Text style={[s.tarefaDesc, t.completada && s.tarefaDone]}>{t.descricao}</Text>
                    {t.recurso_biblioteca && (
                      <Pressable style={s.recursoChip} onPress={() => router.push('/(tabs)/biblioteca')}>
                        <Text style={s.recursoChipText}>◈ {t.recurso_biblioteca}</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {semana.indicador_conclusao && (
            <View style={s.detailBlock}>
              <Text style={s.detailLabel}>Indicador de conclusão</Text>
              <Text style={s.detailText}>{semana.indicador_conclusao}</Text>
            </View>
          )}

          {semana.resultado_esperado && (
            <View style={s.resultadoWrap}>
              <Text style={s.resultadoLabel}>Resultado esperado</Text>
              <Text style={s.resultadoText}>{semana.resultado_esperado}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function makeSemanaStyles(c: ThemeColors) {
  return StyleSheet.create({
    semanaCard:       { backgroundColor: c.surface, borderRadius: Radius.xs, overflow: 'hidden' },
    semanaCardLocked: { opacity: 0.45 },
    semanaHeader:     { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
    semanaNumWrap:    { alignItems: 'center', width: 28 },
    semanaGateIcon:   { fontSize: 12, marginBottom: 2 },
    semanaNum:        { fontFamily: FontFamily.sansBold,    fontSize: 11, color: c.ink },
    semanaInfo:       { flex: 1 },
    semanaNome:       { fontFamily: FontFamily.sansMedium,  fontSize: 13, color: c.ink,     lineHeight: 18 },
    semanaFase:       { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute, marginTop: 2 },
    textMuted:        { color: c.inkMute },
    chevron:          { fontFamily: FontFamily.sansRegular, fontSize: 20, color: c.inkMute },
    chevronOpen:      { transform: [{ rotate: '90deg' }] },
    lockIcon:         { fontSize: 14, color: c.inkMute },
    generatingBadge:  { fontSize: 14, color: c.accent },

    generatingRow:  { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline, paddingHorizontal: 12, paddingVertical: 10 },
    generatingText: { fontFamily: FontFamily.sansRegular, fontSize: 12, color: c.accent, fontStyle: 'italic' },

    semanaDetail: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline, padding: 14, gap: 12, backgroundColor: c.background },
    detailObjetivo: { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkSoft, fontStyle: 'italic', lineHeight: 20 },
    detailBlock: { gap: 6 },
    detailLabel: { fontFamily: FontFamily.sansBold, fontSize: 11, color: c.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
    detailText:  { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkSoft, lineHeight: 20 },

    versiculoWrap: { backgroundColor: c.accentMuted, borderRadius: Radius.xs, borderLeftWidth: 2, borderLeftColor: c.accent, padding: 10 },
    versiculoText: { fontFamily: FontFamily.sansRegular, fontSize: 12, color: c.accent, fontStyle: 'italic', lineHeight: 18 },

    tarefaRow:  { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
    tarefaPrio: { fontSize: 10, marginTop: 4 },
    tarefaBody: { flex: 1, gap: 4 },
    tarefaDesc: { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkSoft, lineHeight: 20 },
    tarefaDone: { textDecorationLine: 'line-through', color: c.inkMute },

    recursoChip:     { alignSelf: 'flex-start', borderWidth: 1, borderColor: c.accent, borderRadius: Radius.xs, paddingHorizontal: 8, paddingVertical: 3 },
    recursoChipText: { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.accent },

    resultadoWrap:  { backgroundColor: c.accentMuted, borderRadius: Radius.xs, padding: 10 },
    resultadoLabel: { fontFamily: FontFamily.sansBold, fontSize: 11, color: c.accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    resultadoText:  { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.ink, lineHeight: 20 },
  });
}

function BlocoSection({ bloco, index }: { bloco: Bloco; index: number }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeBlocoStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(index === 0);
  const completadas = bloco.semanas.filter((s2) => s2.gate_status === 'completed').length;
  const total       = bloco.semanas.length;

  return (
    <View style={s.blocoSection}>
      <Pressable style={s.blocoHeader} onPress={() => setExpanded((v) => !v)}>
        <View style={s.blocoLeft}>
          <View style={s.blocoNumBadge}>
            <Text style={s.blocoNumText}>{index + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.blocoTitulo}>{bloco.titulo}</Text>
            <Text style={s.blocoSub}>{bloco.subtitulo} · {completadas}/{total} semanas</Text>
          </View>
        </View>
        <Text style={[s.chevron, expanded && s.chevronOpen]}>›</Text>
      </Pressable>

      {expanded && (
        <View style={s.blocoSemanas}>
          {bloco.semanas.map((sem) => (
            <SemanaCard key={sem.numero} semana={sem} />
          ))}
        </View>
      )}
    </View>
  );
}

function makeBlocoStyles(c: ThemeColors) {
  return StyleSheet.create({
    blocoSection: { backgroundColor: c.surface, borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, overflow: 'hidden' },
    blocoHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    blocoLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    blocoNumBadge:{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.accentMuted, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: c.accent },
    blocoNumText: { fontFamily: FontFamily.sansBold,     fontSize: 13, color: c.accent },
    blocoTitulo:  { fontFamily: FontFamily.sansSemiBold, fontSize: 14, color: c.ink },
    blocoSub:     { fontFamily: FontFamily.sansRegular,  fontSize: 11, color: c.inkMute, marginTop: 2 },
    blocoSemanas: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline, paddingHorizontal: 10, paddingVertical: 8, gap: 6, backgroundColor: c.background },
    chevron:      { fontFamily: FontFamily.sansRegular, fontSize: 20, color: c.inkMute },
    chevronOpen:  { transform: [{ rotate: '90deg' }] },
  });
}

export function BibliotecaScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [plano,   setPlano]   = useState<PlanoCompleto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void homeService.getPlanoCompleto()
      .then((data) => setPlano(data))
      .catch(() => setPlano(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, s.center]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!plano) {
    return (
      <SafeAreaView style={[s.safe, s.center]} edges={['top']}>
        <Text style={s.emptyIcon}>◈</Text>
        <Text style={s.emptyTitle}>Plano ainda não gerado</Text>
        <Text style={s.emptyText}>
          Completa o onboarding e gera o teu plano de 24 semanas para ver o teu percurso aqui.
        </Text>
      </SafeAreaView>
    );
  }

  const blocos: Bloco[] = BLOCOS_DEF.map((def) => ({
    titulo:    plano.semanas.find((s2) => s2.numero >= def.range[0] && s2.numero <= def.range[1])?.bloco ?? def.titulo,
    subtitulo: def.subtitulo,
    semanas:   plano.semanas.filter((s2) => s2.numero >= def.range[0] && s2.numero <= def.range[1]),
  }));

  const totalCompletas = plano.semanas.filter((s2) => s2.gate_status === 'completed').length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>O teu plano</Text>
          <Text style={s.pageSub}>{totalCompletas} de {plano.totalSemanas} semanas concluídas</Text>
        </View>

        <View style={s.progressTrack}>
          <View style={[s.progressBar, { width: `${(totalCompletas / plano.totalSemanas) * 100}%` as `${number}%` }]} />
        </View>

        <View style={s.blocosList}>
          {blocos.map((bloco, i) => (
            <BlocoSection key={bloco.titulo} bloco={bloco} index={i} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe:      { flex: 1, backgroundColor: c.background },
    center:    { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    scroll:    { flex: 1 },
    container: { paddingHorizontal: Spacing.screenH, paddingTop: 16 },

    pageHeader: { marginBottom: 12 },
    pageTitle:  { fontFamily: FontFamily.serifMedium, fontSize: 24, color: c.ink },
    pageSub:    { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkMute, marginTop: 4 },

    progressTrack: { height: 3, backgroundColor: c.hairline, borderRadius: 99, marginBottom: 24, overflow: 'hidden' },
    progressBar:   { height: '100%', backgroundColor: c.accent, borderRadius: 99 },

    blocosList: { gap: 10 },

    emptyIcon:  { fontFamily: FontFamily.sansRegular, fontSize: 48, color: c.accent,   marginBottom: 16, textAlign: 'center' },
    emptyTitle: { fontFamily: FontFamily.serifMedium, fontSize: 18, color: c.ink,      marginBottom: 10, textAlign: 'center' },
    emptyText:  { fontFamily: FontFamily.sansRegular, fontSize: 14, color: c.inkMute,  textAlign: 'center', lineHeight: 22 },
  });
}
