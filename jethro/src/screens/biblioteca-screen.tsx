import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';
import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';

type PilarItem = {
  pilar:     string;
  titulo:    string;
  subtitulo: string;
  icon:      string;
};

const PILARES: PilarItem[] = [
  { pilar: 'P1', titulo: 'Propósito e Chamado',   subtitulo: 'Encontrando o porquê do seu negócio',  icon: '🎯' },
  { pilar: 'P2', titulo: 'Gestão Financeira',      subtitulo: 'DRE, fluxo de caixa e margem',          icon: '📊' },
  { pilar: 'P3', titulo: 'Precificação Bíblica',   subtitulo: 'Cobrar com justiça e sustentabilidade', icon: '💰' },
  { pilar: 'P4', titulo: 'Vendas com Integridade', subtitulo: 'Persuasão que honra e serve',            icon: '🤝' },
  { pilar: 'P5', titulo: 'Liderança e Equipe',     subtitulo: 'Delegar, treinar e multiplicar',         icon: '👥' },
  { pilar: 'P6', titulo: 'Processos e Sistemas',   subtitulo: 'Negócio que funciona sem você',          icon: '⚙️' },
  { pilar: 'P7', titulo: 'Visão e Legado',         subtitulo: 'Construindo algo que permanece',         icon: '🌿' },
];

const RECOMENDADOS = [PILARES[1], PILARES[2]];

export function BibliotecaScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [busca, setBusca] = useState('');

  const filtrados = busca.trim()
    ? PILARES.filter((p) =>
        p.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        p.subtitulo.toLowerCase().includes(busca.toLowerCase())
      )
    : PILARES;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>

        {/* Cabeçalho + busca */}
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>Biblioteca PBN</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Buscar guias..."
            placeholderTextColor={colors.inkMute}
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        {/* Recomendados — carrossel horizontal */}
        {!busca.trim() && (
          <View style={s.recomendadosBlock}>
            <Text style={s.sectionLabel}>Recomendados para você</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.carrosselContent}
            >
              {RECOMENDADOS.map((item) => (
                <View key={item.pilar} style={s.carrosselCard}>
                  <Text style={s.carrosselIcon}>{item.icon}</Text>
                  <Text style={s.carrosselTitulo}>{item.titulo}</Text>
                  <Text style={s.carrosselSub}>{item.subtitulo}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Todos os pilares */}
        <View style={s.pilaresBlock}>
          <Text style={s.sectionLabel}>
            {busca.trim() ? 'Resultados' : 'Todos os pilares'}
          </Text>
          <View style={s.pilaresLista}>
            {filtrados.map((item) => (
              <Pressable key={item.pilar} style={s.pilarCard}>
                <View style={s.pilarIconWrap}>
                  <Text style={s.pilarIcon}>{item.icon}</Text>
                </View>
                <View style={s.pilarInfo}>
                  <Text style={s.pilarTag}>{item.pilar}</Text>
                  <Text style={s.pilarTitulo}>{item.titulo}</Text>
                  <Text style={s.pilarSub}>{item.subtitulo}</Text>
                </View>
                <Text style={s.pilarChevron}>›</Text>
              </Pressable>
            ))}
            {filtrados.length === 0 && (
              <Text style={s.emptyText}>Nenhum guia encontrado para "{busca}".</Text>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe:      { flex: 1, backgroundColor: c.background },
    scroll:    { flex: 1 },
    container: { paddingTop: 16 },

    pageHeader: { paddingHorizontal: Spacing.screenH, marginBottom: 24, gap: 14 },
    pageTitle:  { fontFamily: FontFamily.serifMedium, fontSize: 24, color: c.ink },

    searchInput: {
      borderRadius: Radius.md,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.hairline,
      paddingHorizontal: 16,
      paddingVertical: 13,
      fontFamily: FontFamily.sansRegular,
      fontSize: 14,
      color: c.ink,
    },

    sectionLabel: {
      fontFamily:    FontFamily.sansMedium,
      fontSize:      10,
      letterSpacing: 2.2,
      textTransform: 'uppercase',
      color:         c.accent,
      marginBottom:  12,
      paddingHorizontal: Spacing.screenH,
    },

    recomendadosBlock: { marginBottom: 28 },
    carrosselContent:  { paddingHorizontal: Spacing.screenH, gap: 12, paddingBottom: 4 },
    carrosselCard:     { width: 150, backgroundColor: palette.navy800, borderRadius: Radius.md, padding: 16, gap: 8 },
    carrosselIcon:     { fontSize: 24 },
    carrosselTitulo:   { fontFamily: FontFamily.serifMedium, fontSize: 13, color: palette.paper, lineHeight: 18 },
    carrosselSub:      { fontFamily: FontFamily.sansRegular, fontSize: 10, color: 'rgba(245,240,232,0.5)', lineHeight: 15 },

    pilaresBlock: { marginBottom: 8 },
    pilaresLista: { paddingHorizontal: Spacing.screenH, gap: 10 },

    pilarCard: {
      flexDirection:  'row',
      alignItems:     'center',
      gap:            14,
      backgroundColor: c.surface,
      borderRadius:   Radius.md,
      padding:        14,
      borderWidth:    1,
      borderColor:    c.hairline,
    },
    pilarIconWrap: {
      width:           46,
      height:          46,
      borderRadius:    14,
      backgroundColor: 'rgba(201,166,85,0.10)',
      alignItems:      'center',
      justifyContent:  'center',
      flexShrink:      0,
    },
    pilarIcon:    { fontSize: 22 },
    pilarInfo:    { flex: 1, gap: 2 },
    pilarTag:     { fontFamily: FontFamily.sansMedium, fontSize: 10, color: c.accent, letterSpacing: 1.5 },
    pilarTitulo:  { fontFamily: FontFamily.sansSemiBold, fontSize: 14, color: c.ink, lineHeight: 20 },
    pilarSub:     { fontFamily: FontFamily.sansRegular,  fontSize: 11, color: c.inkMute, lineHeight: 16 },
    pilarChevron: { fontFamily: FontFamily.sansRegular,  fontSize: 18, color: c.inkMute },

    emptyText: {
      fontFamily: FontFamily.sansRegular,
      fontSize:   14,
      color:      c.inkMute,
      textAlign:  'center',
      paddingVertical: 20,
    },
  });
}
