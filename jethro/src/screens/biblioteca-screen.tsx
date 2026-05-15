import { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';
import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';
import {
  type TipoMaterial,
  type Material,
  TYPE_COLORS,
  TIPO_LABELS,
  MODEL_PILAR_FOCO,
  MODEL_RECURSO_SEMANA,
  CATALOGO,
} from '@/src/data/biblioteca-catalog';

type TipoItem = {
  id: TipoMaterial;
  emoji: string;
  nome: string;
  count: number;
  emBreve: boolean;
};

type PilarItem = {
  id: string;
  nome: string;
  sub: string;
  guias: number | null;
  lidos: number;
  transversal?: boolean;
};

type Props = {
  userModel?: string;
  weekNumber?: number;
};

// ─── Dados estáticos ───────────────────────────────────────────────────────────

const TABS = ['Para Você', 'Por Tipo', 'Pilares'] as const;

const TIPOS: TipoItem[] = [
  { id: 'video',    emoji: '🎬', nome: 'Vídeos',       count: 5,  emBreve: true  },
  { id: 'template', emoji: '📋', nome: 'Templates',    count: 3,  emBreve: false },
  { id: 'calc',     emoji: '🧮', nome: 'Calculadoras', count: 2,  emBreve: false },
  { id: 'script',   emoji: '📝', nome: 'Scripts',      count: 2,  emBreve: false },
  { id: 'guia',     emoji: '📖', nome: 'Guias PBN',    count: 23, emBreve: false },
];

const PILARES: PilarItem[] = [
  { id: 'P1', nome: 'Governo Pessoal',           sub: 'Hábitos, foco e liderança',       guias: 4,    lidos: 0 },
  { id: 'P2', nome: 'Validação e Oferta',         sub: 'Produto, preço e primeira venda', guias: 3,    lidos: 0 },
  { id: 'P3', nome: 'Propósito',                  sub: 'Missão, visão e planejamento',    guias: 2,    lidos: 0 },
  { id: 'P4', nome: 'Estrutura Operacional',      sub: 'Delegar, processos e time',       guias: 7,    lidos: 0 },
  { id: 'P5', nome: 'Clareza Financeira',         sub: 'DRE, lucro e fluxo de caixa',    guias: 7,    lidos: 0 },
  { id: 'P6', nome: 'Multiplicação e Aquisição',  sub: 'Marketing, vendas e escala',      guias: 6,    lidos: 0 },
  { id: 'P7', nome: 'Reino e Integridade',        sub: 'Integrado em todos os pilares',   guias: null, lidos: 0, transversal: true },
];

// Mapeamento pilar → códigos do CATALOGO
const PILAR_MATERIAIS: Record<string, string[]> = {
  P1: ['G01', 'G04', 'G10', 'G19'],
  P2: ['G03', 'G15', 'G16', 'T-C2'],
  P3: ['G09', 'G14'],
  P4: ['G05', 'G06', 'G08', 'G13', 'G20', 'G21', 'T-H1'],
  P5: ['G02', 'G12', 'G17', 'T02', 'T-C2', 'T-D1', 'T-D2'],
  P6: ['G07', 'G11', 'G18', 'G22', 'G23', 'T11', 'T-X1'],
  P7: ['G14', 'G20'],
};

const PILAR_ICONS: Record<string, string> = {
  P1: '🎯', P2: '📈', P3: '🌱', P4: '👥', P5: '💰', P6: '🚀', P7: '🌿',
};

// ─── Sub-componentes ───────────────────────────────────────────────────────────

function TipoBadge({ tipo }: { tipo: TipoMaterial }) {
  const colors = TYPE_COLORS[tipo];
  return (
    <View style={[badge.wrap, { backgroundColor: colors.bg }]}>
      <Text style={[badge.text, { color: colors.text }]}>{TIPO_LABELS[tipo]}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  text: { fontSize: 8, fontFamily: FontFamily.sansSemiBold, textTransform: 'uppercase' },
});

function MatCard({ item, destaque }: { item: Material; destaque?: boolean }) {
  const tc = TYPE_COLORS[item.tipo];
  return (
    <Pressable
      style={[mc.card, destaque && mc.cardDestaque]}
      onPress={() => Linking.openURL(item.url)}
      android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
    >
      <View style={[mc.iconWrap, { backgroundColor: tc.bg }]}>
        <Text style={mc.emoji}>{item.emoji}</Text>
      </View>
      <View style={mc.body}>
        <View style={mc.meta}>
          <TipoBadge tipo={item.tipo} />
          <Text style={mc.codigo}>{item.codigo}</Text>
          {item.lido && (
            <View style={mc.lidoBadge}>
              <Text style={mc.lidoText}>Lido</Text>
            </View>
          )}
        </View>
        <Text style={mc.nome}>{item.nome}</Text>
        <Text style={mc.desc} numberOfLines={2}>{item.desc}</Text>
        <Text style={mc.acao}>{item.acao} →</Text>
      </View>
    </Pressable>
  );
}

const mc = StyleSheet.create({
  card:        { marginHorizontal: 16, marginBottom: 8, backgroundColor: palette.paperCard, borderRadius: 12, padding: 10, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardDestaque:{ borderWidth: 1.5, borderColor: palette.gold500 },
  iconWrap:    { width: 40, height: 40, minWidth: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emoji:       { fontSize: 18 },
  body:        { flex: 1 },
  meta:        { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  nome:        { fontSize: 13, fontFamily: FontFamily.sansSemiBold, color: palette.navy800, marginBottom: 2 },
  desc:        { fontSize: 10.5, fontFamily: FontFamily.sansRegular, color: palette.inkMute, lineHeight: 15 },
  acao:        { fontSize: 10, fontFamily: FontFamily.sansSemiBold, color: palette.gold500, marginTop: 5 },
  codigo:      { fontSize: 9, fontFamily: FontFamily.sansRegular, color: palette.inkMute },
  lidoBadge:   { backgroundColor: '#E8FAF0', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  lidoText:    { fontSize: 8, fontFamily: FontFamily.sansSemiBold, color: '#1A6B3A' },
});

function RecursoSemanaCard({ material, semana }: { material: Material; semana: number }) {
  return (
    <Pressable
      style={rs.card}
      onPress={() => Linking.openURL(material.url)}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
    >
      <View style={rs.badge}>
        <Text style={rs.badgeText}>★ Semana {semana} · Indicado pelo Jethro</Text>
      </View>
      <Text style={rs.tipo}>{TIPO_LABELS[material.tipo].toUpperCase()}</Text>
      <Text style={rs.nome}>{material.nome}</Text>
      <Text style={rs.desc}>{material.desc}</Text>
      <View style={rs.btn}>
        <Text style={rs.btnText}>Abrir material →</Text>
      </View>
      <Text style={rs.codigo}>{material.codigo} · Biblioteca › {TIPO_LABELS[material.tipo]}s</Text>
    </Pressable>
  );
}

const rs = StyleSheet.create({
  card:     { marginHorizontal: 16, marginBottom: 10, backgroundColor: palette.navy800, borderRadius: 12, padding: 14 },
  badge:    { backgroundColor: palette.gold500, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText:{ fontSize: 8, fontFamily: FontFamily.sansSemiBold, color: palette.navy800 },
  tipo:     { fontSize: 9, fontFamily: FontFamily.sansSemiBold, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, marginBottom: 4 },
  nome:     { fontSize: 14, fontFamily: FontFamily.sansSemiBold, color: '#FFFFFF', marginBottom: 4, lineHeight: 19 },
  desc:     { fontSize: 11, fontFamily: FontFamily.sansRegular, color: 'rgba(255,255,255,0.6)', lineHeight: 16, marginBottom: 10 },
  btn:      { backgroundColor: palette.gold500, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start' },
  btnText:  { fontSize: 11, fontFamily: FontFamily.sansSemiBold, color: palette.navy800 },
  codigo:   { fontSize: 8, fontFamily: FontFamily.sansRegular, color: 'rgba(255,255,255,0.35)', marginTop: 7 },
});

function TipoCard({ item, fullWidth, onPress }: { item: TipoItem; fullWidth?: boolean; onPress?: () => void }) {
  const tc = TYPE_COLORS[item.id];
  return (
    <Pressable
      style={[tc2.card, fullWidth && tc2.cardFull]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
    >
      <View style={[tc2.iconWrap, { backgroundColor: tc.bg }, fullWidth && tc2.iconWrapFull]}>
        <Text style={tc2.emoji}>{item.emoji}</Text>
      </View>
      <View style={fullWidth ? tc2.infoFull : undefined}>
        <Text style={tc2.nome}>{item.nome}</Text>
        <Text style={tc2.cnt}>{item.emBreve ? 'Em produção' : `${item.count} disponíveis`}</Text>
      </View>
    </Pressable>
  );
}

const tc2 = StyleSheet.create({
  card:         { width: '47%', backgroundColor: palette.paperCard, borderRadius: 12, padding: 12 },
  cardFull:     { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  iconWrapFull: { marginBottom: 0 },
  emoji:        { fontSize: 18 },
  nome:         { fontSize: 13, fontFamily: FontFamily.sansSemiBold, color: palette.navy800, marginBottom: 2 },
  cnt:          { fontSize: 10, fontFamily: FontFamily.sansRegular, color: palette.inkMute },
  infoFull:     { flex: 1 },
});

function PilarCard({ pilar, foco, aberto, onPress }: { pilar: PilarItem; foco: boolean; aberto: boolean; onPress: () => void }) {
  const pct = pilar.guias ? Math.round((pilar.lidos / pilar.guias) * 100) : 0;
  const materiais = (PILAR_MATERIAIS[pilar.id] ?? [])
    .map((code) => CATALOGO.find((m) => m.codigo === code))
    .filter(Boolean) as Material[];

  return (
    <View style={[pc.wrap, aberto && pc.wrapAberto]}>
      <Pressable
        style={[pc.card, aberto && pc.cardAberto, pilar.transversal && pc.cardTransversal]}
        onPress={onPress}
        android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
      >
        <View style={pc.iconWrap}>
          <Text style={{ fontSize: 18 }}>{PILAR_ICONS[pilar.id]}</Text>
        </View>
        <View style={pc.info}>
          <Text style={pc.num}>
            {foco ? `${pilar.id} · FOCO DO SEU MODELO` : pilar.id}
          </Text>
          <Text style={pc.nome}>{pilar.nome}</Text>
          <Text style={pc.sub}>{pilar.sub}</Text>
        </View>
        {!pilar.transversal ? (
          <View style={pc.right}>
            <Text style={pc.cnt}>{pilar.guias} guias</Text>
            <View style={pc.progWrap}>
              <View style={[pc.progFill, { width: `${pct}%` }]} />
            </View>
          </View>
        ) : (
          <View style={pc.right}>
            <Text style={pc.cnt}>Transversal</Text>
          </View>
        )}
        <Text style={pc.chevron}>{aberto ? '▴' : '▾'}</Text>
      </Pressable>

      {aberto && (
        <View style={pc.expanded}>
          {materiais.length > 0 ? materiais.map((m) => (
            <Pressable key={m.id} style={pc.matRow} onPress={() => Linking.openURL(m.url)} android_ripple={{ color: 'rgba(0,0,0,0.04)' }}>
              <View style={[pc.matIcon, { backgroundColor: TYPE_COLORS[m.tipo].bg }]}>
                <Text style={{ fontSize: 15 }}>{m.emoji}</Text>
              </View>
              <Text style={pc.matNome} numberOfLines={2}>{m.nome}</Text>
              <TipoBadge tipo={m.tipo} />
            </Pressable>
          )) : (
            <Text style={pc.expandedEmpty}>Nenhum material disponível ainda.</Text>
          )}
        </View>
      )}
    </View>
  );
}

const pc = StyleSheet.create({
  wrap:            { marginHorizontal: 16, marginBottom: 8 },
  wrapAberto:      { marginBottom: 14 },
  card:            { backgroundColor: palette.paperCard, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardAberto:      { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  cardTransversal: { borderWidth: 0.5, borderColor: 'rgba(11,28,53,0.15)' },
  iconWrap:        { width: 40, height: 40, minWidth: 40, backgroundColor: palette.paper, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info:            { flex: 1 },
  num:             { fontSize: 9, fontFamily: FontFamily.sansSemiBold, color: palette.gold500, letterSpacing: 0.5, marginBottom: 2 },
  nome:            { fontSize: 13, fontFamily: FontFamily.sansSemiBold, color: palette.navy800, marginBottom: 1 },
  sub:             { fontSize: 10, fontFamily: FontFamily.sansRegular, color: palette.inkMute },
  right:           { alignItems: 'flex-end', gap: 3 },
  cnt:             { fontSize: 9, fontFamily: FontFamily.sansRegular, color: palette.inkMute },
  progWrap:        { width: 40, height: 3, backgroundColor: 'rgba(11,28,53,0.10)', borderRadius: 2, overflow: 'hidden' },
  progFill:        { height: '100%', backgroundColor: palette.gold500, borderRadius: 2 },
  chevron:         { fontSize: 11, color: palette.inkMute, paddingLeft: 4 },
  expanded:        {
    backgroundColor: palette.paperCard,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,28,53,0.07)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 4,
  },
  matRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 9 },
  matIcon:     { width: 32, height: 32, minWidth: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  matNome:     { flex: 1, fontSize: 12, fontFamily: FontFamily.sansSemiBold, color: palette.navy800 },
  expandedEmpty: { fontFamily: FontFamily.sansRegular, fontSize: 12, color: palette.inkMute, textAlign: 'center', paddingVertical: 14 },
});

// ─── Tela principal ────────────────────────────────────────────────────────────

export function BibliotecaScreen({ userModel = 'H', weekNumber = 1 }: Props) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [abaAtiva, setAbaAtiva] = useState(0);
  const [busca, setBusca] = useState('');
  const [verTodosModelo, setVerTodosModelo] = useState(false);
  const [verTodosUniversais, setVerTodosUniversais] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoMaterial | null>(null);
  const [pilarAberto, setPilarAberto] = useState<string | null>(null);

  const pilarFocoId = MODEL_PILAR_FOCO[userModel] ?? 'P4';

  // Materiais do modelo: prioritários para este modelo, excluindo universais
  const materiaisModelo = useMemo(
    () => CATALOGO.filter((m) => m.modelos.includes(userModel) && !m.modelos.includes('universal')),
    [userModel],
  );

  // Universais
  const materiaisUniversais = useMemo(
    () => CATALOGO.filter((m) => m.modelos.includes('universal')),
    [],
  );

  // Recurso da semana: primeiro item do código mapeado para o modelo
  const recursoSemana = useMemo(() => {
    const codigo = MODEL_RECURSO_SEMANA[userModel] ?? 'T02';
    return CATALOGO.find((m) => m.codigo === codigo) ?? CATALOGO.find((m) => m.modelos.includes('universal'))!;
  }, [userModel]);

  // Aba "Por Tipo" — filtro e busca
  const materiaisTipo = useMemo(() => {
    let lista = tipoSelecionado
      ? CATALOGO.filter((m) => m.tipo === tipoSelecionado)
      : CATALOGO.filter((m) => m.tipo !== 'video');

    if (busca.trim() && abaAtiva === 1) {
      const q = busca.toLowerCase();
      lista = lista.filter((m) =>
        m.nome.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q),
      );
    }
    return lista;
  }, [tipoSelecionado, busca, abaAtiva]);

  const modeloVisiveis = verTodosModelo ? materiaisModelo : materiaisModelo.slice(0, 3);
  const universaisVisiveis = verTodosUniversais ? materiaisUniversais : materiaisUniversais.slice(0, 2);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="dark" backgroundColor={palette.paperCard} translucent={false} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Biblioteca</Text>
        <TextInput
          style={s.search}
          placeholder="Buscar materiais..."
          placeholderTextColor={colors.inkMute}
          value={busca}
          onChangeText={setBusca}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {TABS.map((tab, i) => (
          <Pressable
            key={tab}
            style={[s.tabItem, abaAtiva === i && s.tabItemAtivo]}
            onPress={() => setAbaAtiva(i)}
          >
            <Text style={[s.tabText, abaAtiva === i && s.tabTextAtivo]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      {/* Conteúdo */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ─── ABA 1: PARA VOCÊ ─── */}
        {abaAtiva === 0 && (
          <>
            <Text style={s.sectionLabel}>Recurso desta semana</Text>
            <RecursoSemanaCard material={recursoSemana} semana={weekNumber} />

            {materiaisModelo.length > 0 && (
              <>
                <Text style={s.sectionLabel}>Do seu modelo — Modelo {userModel}</Text>
                {modeloVisiveis.map((m) => <MatCard key={m.id} item={m} />)}
                {materiaisModelo.length > 3 && (
                  <Pressable style={s.verMais} onPress={() => setVerTodosModelo((v) => !v)}>
                    <Text style={s.verMaisText}>
                      {verTodosModelo ? 'Ver menos ↑' : `Ver todos os ${materiaisModelo.length} materiais →`}
                    </Text>
                  </Pressable>
                )}
              </>
            )}

            <Text style={s.sectionLabel}>Universais — alta prioridade</Text>
            {universaisVisiveis.map((m) => <MatCard key={m.id} item={m} destaque />)}

            {materiaisUniversais.length > 2 && (
              <Pressable style={s.verMais} onPress={() => setVerTodosUniversais((v) => !v)}>
                <Text style={s.verMaisText}>
                  {verTodosUniversais ? 'Ver menos ↑' : 'Ver todos os materiais universais →'}
                </Text>
              </Pressable>
            )}
          </>
        )}

        {/* ─── ABA 2: POR TIPO ─── */}
        {abaAtiva === 1 && (
          <>
            <Text style={s.sectionLabel}>Escolha um formato</Text>

            <View style={s.tipoGrid}>
              {TIPOS.filter((t) => t.id !== 'guia').map((t) => (
                <TipoCard
                  key={t.id}
                  item={t}
                  onPress={() => setTipoSelecionado(tipoSelecionado === t.id ? null : t.id)}
                />
              ))}
            </View>
            <View style={s.tipoGridFull}>
              <TipoCard
                item={TIPOS.find((t) => t.id === 'guia')!}
                fullWidth
                onPress={() => setTipoSelecionado(tipoSelecionado === 'guia' ? null : 'guia')}
              />
            </View>

            {materiaisTipo.length > 0 && (
              <>
                <Text style={[s.sectionLabel, { marginTop: 4 }]}>
                  {tipoSelecionado ? `${TIPO_LABELS[tipoSelecionado]}s — todos` : 'Todos os materiais'}
                </Text>
                {materiaisTipo.map((m) => <MatCard key={m.id} item={m} />)}
              </>
            )}

            {materiaisTipo.length === 0 && busca.trim() !== '' && (
              <Text style={s.emptyText}>Nenhum material encontrado para "{busca}".</Text>
            )}
          </>
        )}

        {/* ─── ABA 3: PILARES ─── */}
        {abaAtiva === 2 && (
          <>
            <Text style={s.sectionLabel}>7 Pilares PBN</Text>
            {PILARES.map((p) => (
              <PilarCard
                key={p.id}
                pilar={p}
                foco={p.id === pilarFocoId}
                aberto={p.id === pilarAberto}
                onPress={() => setPilarAberto((cur) => cur === p.id ? null : p.id)}
              />
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estilos principais ────────────────────────────────────────────────────────

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe:          { flex: 1, backgroundColor: c.surface },
    scroll:        { flex: 1, backgroundColor: c.background },
    scrollContent: { paddingBottom: 100 },

    header:      { backgroundColor: c.surface, paddingHorizontal: Spacing.screenH, paddingTop: 14 },
    headerTitle: { fontSize: 22, fontFamily: FontFamily.serifMedium, color: c.ink, marginBottom: 10 },

    search: {
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.hairline,
      borderRadius: Radius.sm,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 13,
      fontFamily: FontFamily.sansRegular,
      color: c.ink,
      marginBottom: 10,
    },

    tabBar:       { flexDirection: 'row', backgroundColor: c.surface, borderBottomWidth: 1.5, borderBottomColor: c.hairline },
    tabItem:      { flex: 1, paddingVertical: 9, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1.5 },
    tabItemAtivo: { borderBottomColor: palette.gold500 },
    tabText:      { fontSize: 11, fontFamily: FontFamily.sansSemiBold, color: c.inkMute },
    tabTextAtivo: { color: c.ink },

    sectionLabel: {
      fontSize: 9, fontFamily: FontFamily.sansSemiBold,
      letterSpacing: 0.7, textTransform: 'uppercase',
      color: c.accent, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
    },

    tipoGrid:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
    tipoGridFull: { paddingHorizontal: 16, marginTop: 8 },

    verMais:     { marginHorizontal: 16, marginTop: 4, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.hairline, alignItems: 'center' },
    verMaisText: { fontSize: 11, fontFamily: FontFamily.sansSemiBold, color: c.accent },

    emptyText: { fontFamily: FontFamily.sansRegular, fontSize: 14, color: c.inkMute, textAlign: 'center', paddingVertical: 20 },
  });
}
