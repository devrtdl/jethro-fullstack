import { useCallback, useEffect, useMemo, useState } from 'react';
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

import { homeService, type PlanoCompleto, type PlanoSemanaCompleta } from '@/src/services/home/home-service';
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

type AcaoItem = PlanoSemanaCompleta['acoes'][number];

function AcaoRow({ acao }: { acao: AcaoItem }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeAcaoStyles(colors), [colors]);
  const [done, setDone] = useState(acao.completada);

  return (
    <View style={s.row}>
      <Pressable
        style={[s.checkbox, done && s.checkboxDone]}
        onPress={() => setDone(d => !d)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
      >
        {done && <Text style={s.checkMark}>✓</Text>}
      </Pressable>
      <View style={s.content}>
        {acao.tag ? <Text style={s.tag}>{acao.tag}</Text> : null}
        <Text style={[s.texto, done && s.textoDone]}>{acao.texto}</Text>
      </View>
    </View>
  );
}

function makeAcaoStyles(c: ThemeColors) {
  return StyleSheet.create({
    row:          { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.hairline },
    checkbox:     { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: c.hairline, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', marginTop: 2, flexShrink: 0 },
    checkboxDone: { borderColor: palette.gold500, backgroundColor: palette.gold500 },
    checkMark:    { fontFamily: FontFamily.sansBold, fontSize: 12, color: palette.navy800, lineHeight: 14 },
    content:      { flex: 1, gap: 4 },
    tag:          { fontFamily: FontFamily.sansMedium, fontSize: 10, color: palette.gold500, letterSpacing: 0.8, textTransform: 'uppercase' },
    texto:        { fontFamily: FontFamily.sansRegular, fontSize: 14, color: c.ink, lineHeight: 21 },
    textoDone:    { textDecorationLine: 'line-through', color: c.inkMute },
  });
}

type SemanaDetalheProps = {
  semana: PlanoSemanaCompleta;
  onBack: () => void;
};

function SemanaDetalhe({ semana, onBack }: SemanaDetalheProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeDetalheStyles(colors), [colors]);
  const [aba, setAba] = useState<'objetivo' | 'acoes' | 'materiais'>('objetivo');
  const abas = [
    { id: 'objetivo'  as const, label: 'Objetivo'  },
    { id: 'acoes'     as const, label: 'Ações'      },
    { id: 'materiais' as const, label: 'Materiais'  },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.headerWrap}>
        <Pressable style={s.backBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel="Voltar ao plano">
          <Ionicons name="arrow-back-outline" size={16} color={colors.inkMute} />
          <Text style={s.backText}>Voltar ao plano</Text>
        </Pressable>
        <Text style={s.semanaLabel}>Semana {semana.numero}</Text>
        <Text style={s.semanaTitle}>{semana.titulo ?? `Semana ${semana.numero}`}</Text>

        <View style={s.versiculo}>
          <Text style={s.versiculoTexto}>"{semana.versiculo_texto}"</Text>
          <Text style={s.versiculoAncora}>{semana.versiculo_ancora}</Text>
        </View>

        <View style={s.tabsRow}>
          {abas.map(a => (
            <Pressable
              key={a.id}
              style={[s.tabBtn, aba === a.id && s.tabBtnActive]}
              onPress={() => setAba(a.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: aba === a.id }}
            >
              <Text style={[s.tabLabel, aba === a.id && s.tabLabelActive]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {aba === 'objetivo' && (
          <View>
            <Text style={s.sectionLabel}>Por que importa</Text>
            <View style={s.card}>
              <Text style={s.bodyText}>{semana.por_que_importa}</Text>
            </View>
            <Text style={s.sectionLabel}>Objetivo da semana</Text>
            <View style={s.card}>
              <Text style={s.bodyText}>{semana.objetivo}</Text>
            </View>
            <Text style={s.sectionLabel}>Indicador de sucesso</Text>
            <View style={s.cardGold}>
              <Text style={s.bodyText}>{semana.indicador_sucesso}</Text>
            </View>
          </View>
        )}
        {aba === 'acoes' && (
          <View>
            <Text style={s.sectionLabel}>5 ações desta semana</Text>
            {semana.acoes.map((acao, i) => (
              <AcaoRow key={i} acao={acao} />
            ))}
          </View>
        )}
        {aba === 'materiais' && (
          <View>
            <Text style={s.sectionLabel}>Materiais recomendados</Text>
            {(semana.materiais_biblioteca ?? []).map(pilarId => {
              const item = BIBLIOTECA_ITENS[pilarId];
              if (!item) return null;
              return (
                <View key={pilarId} style={s.materialCard}>
                  <View style={s.materialIcon}>
                    <Text style={s.materialIconText}>{pilarId}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.materialTitulo}>{item.titulo}</Text>
                    <Text style={s.materialSub}>{item.subtitulo}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeDetalheStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe:          { flex: 1, backgroundColor: c.background },
    headerWrap:    { paddingHorizontal: Spacing.screenH, paddingTop: 16, paddingBottom: 0 },
    backBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
    backText:      { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkMute },
    semanaLabel:   { fontFamily: FontFamily.sansSemiBold, fontSize: 10, color: palette.gold500, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
    semanaTitle:   { fontFamily: FontFamily.serifMedium, fontSize: 22, color: c.ink, lineHeight: 27, marginBottom: 14 },
    versiculo:     { backgroundColor: palette.navy800, borderRadius: Radius.sm, padding: 14, marginBottom: 14 },
    versiculoTexto:{ fontFamily: FontFamily.serifMediumItalic, fontSize: 14, color: palette.paper, lineHeight: 22 },
    versiculoAncora:{ fontFamily: FontFamily.sansRegular, fontSize: 11, color: 'rgba(212,175,55,0.75)', marginTop: 6 },
    tabsRow:       { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.hairline },
    tabBtn:        { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabBtnActive:  { borderBottomColor: palette.gold500 },
    tabLabel:      { fontFamily: FontFamily.sansMedium, fontSize: 13, color: c.inkMute },
    tabLabelActive:{ color: palette.navy800 },
    scroll:        { flex: 1 },
    scrollContent: { paddingHorizontal: Spacing.screenH, paddingTop: 20 },
    sectionLabel:  { fontFamily: FontFamily.sansSemiBold, fontSize: 10, color: palette.gold500, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
    card:          { backgroundColor: c.surface, borderRadius: Radius.md, padding: 16, marginBottom: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, ...getShadow(1) },
    cardGold:      { backgroundColor: c.surface, borderRadius: Radius.md, padding: 16, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: palette.gold500, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, ...getShadow(1) },
    bodyText:      { fontFamily: FontFamily.sansRegular, fontSize: 14, color: c.ink, lineHeight: 22 },
    materialCard:  { backgroundColor: c.surface, borderRadius: Radius.md, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, ...getShadow(1) },
    materialIcon:  { width: 44, height: 44, borderRadius: Radius.xs, backgroundColor: palette.goldMuted, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    materialIconText:{ fontFamily: FontFamily.serifSemiBold, fontSize: 12, color: palette.navy800 },
    materialTitulo:{ fontFamily: FontFamily.serifMedium, fontSize: 14, color: c.ink, marginBottom: 2 },
    materialSub:   { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute },
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

  const rangeLabel = `S${bloco.range[0]}–S${bloco.range[1]}`;

  return (
    <View style={s.wrap}>
      <Pressable
        style={[s.header, aberto && s.headerOpen]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
      >
        <View style={{ flex: 1 }}>
          <View style={s.headerTop}>
            <Text style={[s.blocoLabel, aberto && s.blocoLabelOpen]}>Bloco {index + 1}</Text>
            <View style={[s.badge, { backgroundColor: BADGE_COLORS[bloco.titulo]?.bg ?? 'rgba(11,31,59,0.08)' }]}>
              <Text style={[s.badgeText, { color: BADGE_COLORS[bloco.titulo]?.text ?? palette.navy800 }]}>{bloco.titulo}</Text>
            </View>
          </View>
          <Text style={[s.blocoTitulo, aberto && s.blocoTituloOpen]}>{bloco.titulo}</Text>
          <Text style={[s.blocoMeta, aberto && s.blocoMetaOpen]}>{rangeLabel} · {bloco.versiculo}</Text>
        </View>
        <Text style={[s.chevron, aberto && s.chevronOpen]}>{aberto ? '∧' : '∨'}</Text>
      </Pressable>

      {aberto && (
        <View style={s.semanasList}>
          {bloco.semanas.map((semana, i) => {
            const ativa = isAtiva(semana);
            return (
              <Pressable
                key={semana.numero}
                style={[s.semanaRow, i > 0 && s.semanaRowBorder, !ativa && s.semanaRowLocked]}
                onPress={() => ativa && onSemanaPress(semana)}
                disabled={!ativa}
                accessibilityRole="button"
                accessibilityState={{ disabled: !ativa }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.semanaNum}>S{semana.numero}</Text>
                  <Text style={s.semanaTitulo}>{semana.titulo ?? `Semana ${semana.numero}`}</Text>
                </View>
                <Text style={[s.semanaIcon, ativa && s.semanaIconAtiva]}>
                  {ativa ? '→' : '🔒'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  Fundamento:  { bg: 'rgba(212,175,55,0.15)',  text: '#7A5A10' },
  Estrutura:   { bg: 'rgba(11,31,59,0.10)',    text: palette.navy800 },
  Controle:    { bg: 'rgba(59,95,203,0.12)',   text: '#1A3A8F' },
  Crescimento: { bg: 'rgba(39,120,58,0.12)',   text: '#1A5E2C' },
  Legado:      { bg: 'rgba(120,39,90,0.12)',   text: '#6B1D52' },
};

function makeAccordionStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrap:              { marginBottom: 10 },
    header:            { padding: 16, backgroundColor: c.surface, borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, ...getShadow(1) },
    headerOpen:        { backgroundColor: palette.navy800, borderRadius: Radius.md, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderColor: palette.navy800 },
    headerTop:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    blocoLabel:        { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute },
    blocoLabelOpen:    { color: 'rgba(212,175,55,0.70)' },
    badge:             { borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
    badgeText:         { fontFamily: FontFamily.sansMedium, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
    blocoTitulo:       { fontFamily: FontFamily.serifMedium, fontSize: 16, color: c.ink, marginBottom: 2 },
    blocoTituloOpen:   { color: palette.paper },
    blocoMeta:         { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute },
    blocoMetaOpen:     { color: 'rgba(239,239,234,0.50)' },
    chevron:           { fontFamily: FontFamily.sansRegular, fontSize: 16, color: c.inkMute, marginLeft: 8 },
    chevronOpen:       { color: palette.gold500 },
    semanasList:       { backgroundColor: c.surface, borderBottomLeftRadius: Radius.md, borderBottomRightRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, borderTopWidth: 0, borderColor: c.hairline, overflow: 'hidden' },
    semanaRow:         { flexDirection: 'row', alignItems: 'center', padding: 14 },
    semanaRowBorder:   { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline },
    semanaRowLocked:   { opacity: 0.45 },
    semanaNum:         { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute, marginBottom: 2 },
    semanaTitulo:      { fontFamily: FontFamily.sansRegular, fontSize: 14, color: c.ink },
    semanaIcon:        { fontFamily: FontFamily.sansRegular, fontSize: 14, color: c.inkMute },
    semanaIconAtiva:   { color: palette.gold500 },
  });
}

export function PlanoScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeScreenStyles(colors), [colors]);

  const [plano,          setPlano]          = useState<PlanoCompleto | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [blocoAberto,    setBlocoAberto]    = useState<number | null>(0);
  const [semanaDetalhe,  setSemanaDetalhe]  = useState<PlanoSemanaCompleta | null>(null);

  const loadPlano = useCallback(async () => {
    try {
      const data = await homeService.getPlanoCompleto();
      setPlano(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPlano(); }, [loadPlano]);

  if (semanaDetalhe) {
    return <SemanaDetalhe semana={semanaDetalhe} onBack={() => setSemanaDetalhe(null)} />;
  }

  const blocos: BlocoData[] = BLOCOS.map(b => ({
    titulo:   b.titulo,
    range:    b.range,
    versiculo: b.versiculo,
    semanas:  (plano?.semanas ?? []).filter(s => s.numero >= b.range[0] && s.numero <= b.range[1]),
  }));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Meu Plano</Text>
        <Text style={s.pageSub}>24 semanas · 5 blocos</Text>
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
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

function makeScreenStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe:        { flex: 1, backgroundColor: c.background },
    pageHeader:  { paddingHorizontal: Spacing.screenH, paddingTop: 16, paddingBottom: 12 },
    pageTitle:   { fontFamily: FontFamily.serifMedium, fontSize: 26, color: c.ink, marginBottom: 2 },
    pageSub:     { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkMute },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll:      { flex: 1 },
    scrollContent:{ paddingHorizontal: Spacing.screenH, paddingTop: 4 },
  });
}
