import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JethroColors } from '@/constants/theme';

type Guide = {
  code: string;
  title: string;
  description: string;
};

type Pillar = {
  number: number;
  title: string;
  icon: string;
  guides: Guide[];
};

const PILLARS: Pillar[] = [
  {
    number: 1,
    title: 'Propósito e Identidade',
    icon: '✦',
    guides: [
      { code: 'G01', title: 'Propósito Empresarial', description: 'Definir o porquê do negócio e o impacto que quer causar.' },
      { code: 'G02', title: 'Identidade de Marca', description: 'Construir uma identidade coerente, memorável e autêntica.' },
    ],
  },
  {
    number: 2,
    title: 'Mercado e Posicionamento',
    icon: '◎',
    guides: [
      { code: 'G03', title: 'Análise de Mercado', description: 'Compreender o mercado, concorrência e oportunidades.' },
      { code: 'G04', title: 'Posicionamento Estratégico', description: 'Ocupar uma posição clara e vantajosa na mente do cliente.' },
    ],
  },
  {
    number: 3,
    title: 'Produto ou Serviço',
    icon: '◈',
    guides: [
      { code: 'G05', title: 'Proposta de Valor', description: 'Articular o que torna a tua oferta única e irresistível.' },
      { code: 'G06', title: 'Precificação Estratégica', description: 'Definir preços que reflitam valor e gerem lucro.' },
    ],
  },
  {
    number: 4,
    title: 'Vendas e Canal',
    icon: '→',
    guides: [
      { code: 'G07', title: 'Processo de Vendas', description: 'Construir um funil previsível do lead ao fechamento.' },
      { code: 'G08', title: 'Canal de Aquisição', description: 'Escolher e dominar os canais certos para o teu cliente.' },
    ],
  },
  {
    number: 5,
    title: 'Equipa e Liderança',
    icon: '◻',
    guides: [
      { code: 'G09', title: 'Construção de Equipa', description: 'Contratar, integrar e desenvolver as pessoas certas.' },
      { code: 'G10', title: 'Liderança com Propósito', description: 'Liderar com autoridade, cuidado e visão espiritual.' },
    ],
  },
  {
    number: 6,
    title: 'Finanças e Controlo',
    icon: '⊞',
    guides: [
      { code: 'G11', title: 'Controlo Financeiro', description: 'Dominar os números para tomar decisões com clareza.' },
      { code: 'G12', title: 'Fluxo de Caixa', description: 'Gerir entradas e saídas para garantir saúde financeira.' },
    ],
  },
  {
    number: 7,
    title: 'Crescimento e Escala',
    icon: '△',
    guides: [
      { code: 'G13', title: 'Estratégia de Crescimento', description: 'Planear a expansão com intencionalidade e fé.' },
      { code: 'G14', title: 'Escalabilidade', description: 'Construir sistemas que crescem sem depender só de ti.' },
    ],
  },
];

function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Pressable style={({ pressed }) => [styles.guideCard, pressed && styles.guideCardPressed]}>
      <View style={styles.guideLeft}>
        <View style={styles.guideBadge}>
          <Text style={styles.guideBadgeText}>{guide.code}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.guideTitle}>{guide.title}</Text>
          <Text style={styles.guideDesc}>{guide.description}</Text>
        </View>
      </View>
      <Text style={styles.guideArrow}>›</Text>
    </Pressable>
  );
}

function PillarSection({ pillar }: { pillar: Pillar }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.pillarSection}>
      <Pressable
        style={({ pressed }) => [styles.pillarHeader, pressed && styles.pillarHeaderPressed]}
        onPress={() => setExpanded((v) => !v)}
      >
        <View style={styles.pillarLeft}>
          <View style={styles.pillarNumBadge}>
            <Text style={styles.pillarNumText}>{pillar.icon}</Text>
          </View>
          <View>
            <Text style={styles.pillarNum}>Pilar {pillar.number}</Text>
            <Text style={styles.pillarTitle}>{pillar.title}</Text>
          </View>
        </View>
        <Text style={[styles.chevron, expanded && styles.chevronOpen]}>›</Text>
      </Pressable>

      {expanded && (
        <View style={styles.guidesContainer}>
          {pillar.guides.map((guide) => (
            <GuideCard key={guide.code} guide={guide} />
          ))}
        </View>
      )}
    </View>
  );
}

export function BibliotecaScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Biblioteca PBN</Text>
          <Text style={styles.headerSub}>14 guias · 7 pilares do negócio</Text>
        </View>

        {/* Intro card */}
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            O Programa Bases do Negócio é estruturado em 7 pilares fundamentais. Cada guia aprofunda
            uma dimensão essencial para o crescimento sustentável da tua empresa.
          </Text>
        </View>

        {/* Pillars */}
        {PILLARS.map((pillar) => (
          <PillarSection key={pillar.number} pillar={pillar} />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: JethroColors.navy,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: JethroColors.creme,
  },
  headerSub: {
    fontSize: 13,
    color: JethroColors.muted,
    marginTop: 4,
  },
  introCard: {
    backgroundColor: JethroColors.navySurface,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: JethroColors.gold,
    marginBottom: 20,
  },
  introText: {
    fontSize: 13,
    color: JethroColors.cremeMuted,
    lineHeight: 20,
  },
  pillarSection: {
    backgroundColor: JethroColors.navySurface,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  pillarHeaderPressed: {
    opacity: 0.75,
  },
  pillarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pillarNumBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: JethroColors.goldMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: JethroColors.gold,
  },
  pillarNumText: {
    fontSize: 16,
    color: JethroColors.gold,
    fontWeight: '700',
  },
  pillarNum: {
    fontSize: 11,
    color: JethroColors.gold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: JethroColors.creme,
    marginTop: 1,
  },
  chevron: {
    fontSize: 22,
    color: JethroColors.muted,
    fontWeight: '300',
    transform: [{ rotate: '0deg' }],
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  guidesContainer: {
    borderTopWidth: 1,
    borderTopColor: JethroColors.navyDeep,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JethroColors.navy,
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  guideCardPressed: {
    opacity: 0.75,
  },
  guideLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  guideBadge: {
    backgroundColor: JethroColors.goldMuted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 1,
  },
  guideBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: JethroColors.gold,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: JethroColors.creme,
    marginBottom: 3,
  },
  guideDesc: {
    fontSize: 12,
    color: JethroColors.muted,
    lineHeight: 18,
  },
  guideArrow: {
    fontSize: 20,
    color: JethroColors.muted,
    fontWeight: '300',
  },
});
