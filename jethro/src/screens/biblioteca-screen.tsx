import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JethroColors } from '@/constants/theme';
import { homeService, type PlanoCompleto, type PlanoSemanaCompleta } from '@/src/services/home/home-service';

type Bloco = {
  titulo: string;
  subtitulo: string;
  semanas: PlanoSemanaCompleta[];
};

const BLOCOS_DEF = [
  { titulo: 'Direcção e Fundamento',        subtitulo: 'Semanas 1–5',   range: [1, 5] },
  { titulo: 'Estrutura e Organização',       subtitulo: 'Semanas 6–10',  range: [6, 10] },
  { titulo: 'Controlo e Correcção',          subtitulo: 'Semanas 11–15', range: [11, 15] },
  { titulo: 'Crescimento e Multiplicação',   subtitulo: 'Semanas 16–20', range: [16, 20] },
  { titulo: 'Governo, Consolidação e Legado',subtitulo: 'Semanas 21–24', range: [21, 24] },
];

function gateIcon(status: string) {
  if (status === 'completed') return '✓';
  if (status === 'available')  return '●';
  return '○';
}

function gateColor(status: string) {
  if (status === 'completed') return JethroColors.gold;
  if (status === 'available')  return JethroColors.gold;
  return JethroColors.muted;
}

function faseLabel(fase: string) {
  const map: Record<string, string> = {
    fundamento: 'Fundamento',
    estrutura: 'Estrutura',
    escala: 'Escala',
    legado: 'Legado',
  };
  return map[fase] ?? fase;
}

function prioridadeColor(p: string) {
  if (p === 'critica') return '#E05C5C';
  if (p === 'alta')    return JethroColors.gold;
  if (p === 'media')   return '#6B9FD4';
  return JethroColors.muted;
}

function SemanaCard({ semana }: { semana: PlanoSemanaCompleta }) {
  const [expanded, setExpanded] = useState(false);
  const isLocked = semana.gate_status === 'locked';
  const isGenerating = !isLocked && !semana.conteudo_completo;
  const canExpand = !isLocked && semana.conteudo_completo;

  return (
    <View style={[styles.semanaCard, isLocked && styles.semanaCardLocked]}>
      <Pressable
        style={styles.semanaHeader}
        onPress={() => canExpand && setExpanded((v) => !v)}
      >
        <View style={styles.semanaNumWrap}>
          <Text style={[styles.semanaGateIcon, { color: gateColor(semana.gate_status) }]}>
            {gateIcon(semana.gate_status)}
          </Text>
          <Text style={[styles.semanaNum, isLocked && styles.textMuted]}>S{semana.numero}</Text>
        </View>
        <View style={styles.semanaInfo}>
          <Text style={[styles.semanaNome, isLocked && styles.textMuted]} numberOfLines={2}>
            {semana.nome ?? semana.objetivo}
          </Text>
          <Text style={styles.semanaFase}>{faseLabel(semana.fase)}</Text>
        </View>
        {canExpand && (
          <Text style={[styles.chevron, expanded && styles.chevronOpen]}>›</Text>
        )}
        {isGenerating && <Text style={styles.generatingBadge}>⟳</Text>}
        {isLocked && <Text style={styles.lockIcon}>⊘</Text>}
      </Pressable>

      {isGenerating && (
        <View style={styles.generatingRow}>
          <Text style={styles.generatingText}>A preparar o conteúdo desta semana…</Text>
        </View>
      )}

      {expanded && semana.conteudo_completo && (
        <View style={styles.semanaDetail}>
          {/* Objetivo */}
          {semana.nome && (
            <Text style={styles.detailObjetivo}>{semana.objetivo}</Text>
          )}

          {/* Por que importa */}
          {semana.por_que_importa && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Por que esta semana importa</Text>
              <Text style={styles.detailText}>{semana.por_que_importa}</Text>
            </View>
          )}

          {/* Versículo */}
          {semana.versiculo && (
            <View style={styles.versiculoWrap}>
              <Text style={styles.versiculoText}>✦ {semana.versiculo}</Text>
            </View>
          )}

          {/* Tarefas */}
          {semana.tarefas.length > 0 && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Tarefas</Text>
              {semana.tarefas.map((t, i) => (
                <View key={i} style={styles.tarefaRow}>
                  <Text style={[styles.tarefaPrio, { color: prioridadeColor(t.prioridade) }]}>
                    ◆
                  </Text>
                  <Text style={[styles.tarefaDesc, t.completada && styles.tarefaDone]}>
                    {t.descricao}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Indicador */}
          {semana.indicador_conclusao && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Indicador de conclusão</Text>
              <Text style={styles.detailText}>{semana.indicador_conclusao}</Text>
            </View>
          )}

          {/* Resultado esperado */}
          {semana.resultado_esperado && (
            <View style={styles.resultadoWrap}>
              <Text style={styles.resultadoLabel}>Resultado esperado</Text>
              <Text style={styles.resultadoText}>{semana.resultado_esperado}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function BlocoSection({ bloco, index }: { bloco: Bloco; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const completadas = bloco.semanas.filter((s) => s.gate_status === 'completed').length;
  const total = bloco.semanas.length;

  return (
    <View style={styles.blocoSection}>
      <Pressable style={styles.blocoHeader} onPress={() => setExpanded((v) => !v)}>
        <View style={styles.blocoLeft}>
          <View style={styles.blocoNumBadge}>
            <Text style={styles.blocoNumText}>{index + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.blocoTitulo}>{bloco.titulo}</Text>
            <Text style={styles.blocoSub}>
              {bloco.subtitulo} · {completadas}/{total} semanas
            </Text>
          </View>
        </View>
        <Text style={[styles.chevron, expanded && styles.chevronOpen]}>›</Text>
      </Pressable>

      {expanded && (
        <View style={styles.blocoSemanas}>
          {bloco.semanas.map((s) => (
            <SemanaCard key={s.numero} semana={s} />
          ))}
        </View>
      )}
    </View>
  );
}

export function BibliotecaScreen() {
  const [plano, setPlano] = useState<PlanoCompleto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void homeService.getPlanoCompleto()
      .then((data) => setPlano(data))
      .catch(() => setPlano(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color={JethroColors.gold} />
      </SafeAreaView>
    );
  }

  if (!plano) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <Text style={styles.emptyIcon}>◈</Text>
        <Text style={styles.emptyTitle}>Plano ainda não gerado</Text>
        <Text style={styles.emptyText}>
          Completa o onboarding e gera o teu plano de 24 semanas para ver o teu percurso aqui.
        </Text>
      </SafeAreaView>
    );
  }

  const blocos: Bloco[] = BLOCOS_DEF.map((def) => ({
    titulo: def.titulo,
    subtitulo: def.subtitulo,
    semanas: plano.semanas.filter((s) => s.numero >= def.range[0] && s.numero <= def.range[1]),
  }));

  const totalCompletas = plano.semanas.filter((s) => s.gate_status === 'completed').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>O teu plano</Text>
          <Text style={styles.headerSub}>
            {totalCompletas} de {plano.totalSemanas} semanas concluídas
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${(totalCompletas / plano.totalSemanas) * 100}%` as `${number}%` }]} />
        </View>

        {/* Blocos */}
        <View style={styles.blocosList}>
          {blocos.map((bloco, i) => (
            <BlocoSection key={bloco.titulo} bloco={bloco} index={i} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: JethroColors.navy },
  center: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 16 },

  header:      { marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: JethroColors.creme },
  headerSub:   { fontSize: 13, color: JethroColors.muted, marginTop: 4 },

  progressTrack: {
    height: 3, backgroundColor: JethroColors.navyDeep,
    borderRadius: 99, marginBottom: 24, overflow: 'hidden',
  },
  progressBar: {
    height: '100%', backgroundColor: JethroColors.gold, borderRadius: 99,
  },

  blocosList: { gap: 10 },

  blocoSection: {
    backgroundColor: JethroColors.navySurface,
    borderRadius: 14, overflow: 'hidden',
  },
  blocoHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
  },
  blocoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  blocoNumBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: JethroColors.goldMuted,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: JethroColors.gold,
  },
  blocoNumText: { fontSize: 13, fontWeight: '800', color: JethroColors.gold },
  blocoTitulo:  { fontSize: 14, fontWeight: '700', color: JethroColors.creme },
  blocoSub:     { fontSize: 11, color: JethroColors.muted, marginTop: 2 },

  blocoSemanas: {
    borderTopWidth: 1, borderTopColor: JethroColors.navyDeep,
    paddingHorizontal: 12, paddingVertical: 8, gap: 6,
  },

  semanaCard: {
    backgroundColor: JethroColors.navy, borderRadius: 10,
    overflow: 'hidden',
  },
  semanaCardLocked: { opacity: 0.45 },
  semanaHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10,
  },
  semanaNumWrap: { alignItems: 'center', width: 28 },
  semanaGateIcon: { fontSize: 12, marginBottom: 2 },
  semanaNum:  { fontSize: 11, fontWeight: '700', color: JethroColors.creme },
  semanaInfo: { flex: 1 },
  semanaNome: { fontSize: 13, fontWeight: '600', color: JethroColors.creme, lineHeight: 18 },
  semanaFase: { fontSize: 11, color: JethroColors.muted, marginTop: 2 },
  textMuted:  { color: JethroColors.muted },
  chevron:    { fontSize: 20, color: JethroColors.muted },
  chevronOpen:{ transform: [{ rotate: '90deg' }] },
  lockIcon:        { fontSize: 14, color: JethroColors.muted },
  generatingBadge: { fontSize: 14, color: JethroColors.gold },
  generatingRow:   {
    borderTopWidth: 1, borderTopColor: JethroColors.navyDeep,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  generatingText:  { fontSize: 12, color: JethroColors.gold, fontStyle: 'italic' },

  semanaDetail: {
    borderTopWidth: 1, borderTopColor: JethroColors.navyDeep,
    padding: 14, gap: 12,
  },
  detailObjetivo: { fontSize: 13, color: JethroColors.cremeMuted, fontStyle: 'italic', lineHeight: 20 },
  detailBlock:    { gap: 6 },
  detailLabel:    { fontSize: 11, fontWeight: '700', color: JethroColors.gold, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailText:     { fontSize: 13, color: JethroColors.cremeMuted, lineHeight: 20 },

  versiculoWrap: {
    backgroundColor: JethroColors.navySurface, borderRadius: 8,
    borderLeftWidth: 2, borderLeftColor: JethroColors.gold, padding: 10,
  },
  versiculoText: { fontSize: 12, color: JethroColors.gold, fontStyle: 'italic', lineHeight: 18 },

  tarefaRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  tarefaPrio: { fontSize: 10, marginTop: 4 },
  tarefaDesc: { fontSize: 13, color: JethroColors.cremeMuted, flex: 1, lineHeight: 20 },
  tarefaDone: { textDecorationLine: 'line-through', color: JethroColors.muted },

  resultadoWrap: {
    backgroundColor: JethroColors.goldMuted, borderRadius: 8, padding: 10,
  },
  resultadoLabel: { fontSize: 11, fontWeight: '700', color: JethroColors.gold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  resultadoText:  { fontSize: 13, color: JethroColors.creme, lineHeight: 20 },

  emptyIcon:  { fontSize: 48, color: JethroColors.gold, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: JethroColors.creme, marginBottom: 10, textAlign: 'center' },
  emptyText:  { fontSize: 14, color: JethroColors.muted, textAlign: 'center', lineHeight: 22 },
});
