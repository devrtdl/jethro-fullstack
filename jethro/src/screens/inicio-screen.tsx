import { useRouter } from 'expo-router';
import { mentorContext } from '@/src/lib/mentor-context';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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



type BibliotecaItem = { tipo: 'AULA' | 'TEMPLATE' | 'ARTIGO'; titulo: string };

const BIBLIOTECA_CONTEUDO: Record<string, BibliotecaItem[]> = {
  P1: [
    { tipo: 'AULA',     titulo: 'Definindo Seu Propósito Empresarial' },
    { tipo: 'ARTIGO',   titulo: 'O Empresário Cristão e Seu Chamado' },
    { tipo: 'TEMPLATE', titulo: 'Manifesto de Propósito do Negócio' },
  ],
  P2: [
    { tipo: 'AULA',     titulo: 'DRE Simplificado para Pequenas Empresas' },
    { tipo: 'TEMPLATE', titulo: 'Planilha de Fluxo de Caixa Mensal' },
    { tipo: 'ARTIGO',   titulo: 'Separando Finanças Pessoais das Empresariais' },
  ],
  P3: [
    { tipo: 'AULA',     titulo: 'Precificação com Justiça e Margem Real' },
    { tipo: 'TEMPLATE', titulo: 'Calculadora de Preço Justo' },
    { tipo: 'ARTIGO',   titulo: 'Por Que Cobrar Pouco É um Erro Espiritual' },
  ],
  P4: [
    { tipo: 'AULA',     titulo: 'Processo de Venda que Honra o Cliente' },
    { tipo: 'TEMPLATE', titulo: 'Script de Proposta de Valor' },
    { tipo: 'ARTIGO',   titulo: 'Persuasão vs Manipulação: A Linha Bíblica' },
  ],
  P5: [
    { tipo: 'AULA',     titulo: 'Como Delegar com Autoridade e Confiança' },
    { tipo: 'TEMPLATE', titulo: 'Manual de Onboarding para Equipe' },
    { tipo: 'ARTIGO',   titulo: 'O Líder que Multiplica, não Centraliza' },
  ],
  P6: [
    { tipo: 'AULA',     titulo: 'Mapeamento de Processos Essenciais' },
    { tipo: 'TEMPLATE', titulo: 'Checklist de Rotinas Operacionais' },
    { tipo: 'ARTIGO',   titulo: 'Negócio que Funciona Sem Você' },
  ],
  P7: [
    { tipo: 'AULA',     titulo: 'Construindo uma Visão de 10 Anos' },
    { tipo: 'TEMPLATE', titulo: 'Canvas de Legado Empresarial' },
    { tipo: 'ARTIGO',   titulo: 'Mateus 25:21 — O Padrão do Legado Fiel' },
  ],
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
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [data,           setData]           = useState<HomeData | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
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

  const plano              = data?.plano      ?? null;
  const onboardingCompleto = data?.onboardingCompleto ?? false;

  const tarefas       = plano?.tarefas ?? [];
  const completadas   = tarefas.filter(t => t.completada).length;
  const totalTarefas  = tarefas.length;
  const acaoPrincipal = tarefas.find(t => !t.completada) ?? tarefas[0] ?? null;

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
            onPress={() => router.push('/(tabs)/perfil' as Parameters<typeof router.push>[0])}
            accessibilityRole="button"
            accessibilityLabel="Ver perfil"
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
              // Monta lista de itens reais (AULA/TEMPLATE/ARTIGO)
              // Fonte prioritária: materiais_semana do plano (gerado pelo Claude para esta semana)
              // Fallback: pega 1 item de cada pilar sugerido (materiais_biblioteca) ou do pilar atual
              const matSemana = plano.materiais_semana ?? [];
              const pilaresRef = (plano.materiais_biblioteca ?? []).length > 0
                ? (plano.materiais_biblioteca ?? []).slice(0, 3)
                : plano.pilar ? [plano.pilar] : [];

              const itensFinais: BibliotecaItem[] = matSemana.length > 0
                ? matSemana.map((m) => ({ tipo: m.tipo, titulo: m.titulo } as BibliotecaItem))
                : pilaresRef.flatMap((pid) => (BIBLIOTECA_CONTEUDO[pid] ?? []).slice(0, 1));

              return (
                <View style={s.bibCard}>
                  <Text style={s.bibLabelMain}>BIBLIOTECA DO JETHRO</Text>
                  <Text style={s.bibLabelSub}>Materiais recomendados para esta semana</Text>
                  <View style={s.bibDivider} />
                  {itensFinais.map((item, idx) => (
                    <View key={idx}>
                      <View style={s.bibItem}>
                        <View style={[s.bibBadge, matBadgeBg(item.tipo)]}>
                          <Text style={[s.bibBadgeTx, matBadgeTx(item.tipo)]}>{item.tipo}</Text>
                        </View>
                        <Text style={s.bibTitulo}>{item.titulo}</Text>
                      </View>
                      {idx < itensFinais.length - 1 && <View style={s.bibSep} />}
                    </View>
                  ))}
                  <View style={s.bibDivider} />
                  <Pressable onPress={() => router.push('/(tabs)/biblioteca' as Parameters<typeof router.push>[0])}>
                    <Text style={s.bibVerTodos}>Ver todos na Biblioteca →</Text>
                  </Pressable>
                </View>
              );
            })()}

            {/* ⑥ Dashboard de Progresso */}
            {(() => {
              const spark = data?.sparklineConfianca ?? [];
              const hasData = spark.length > 0;
              const placeholders = [0.4, 0.55, 0.35, 0.6, 0.5];
              return (
                <View style={s.dashCard}>
                  <View style={s.dashHeader}>
                    <Text style={s.dashLabel}>DASHBOARD DE PROGRESSO</Text>
                    <Text style={[s.sparkTrend, !hasData && { color: '#DDD6C8' }]}>
                      {hasData ? '▲ Confiança histórico' : '— Confiança histórico'}
                    </Text>
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
                    {/* Sparkline — real ou placeholder */}
                    <View style={s.sparkWrap}>
                      {hasData
                        ? spark.map((val, idx) => {
                            const max = Math.max(...spark);
                            const isLast = idx === spark.length - 1;
                            const h = Math.max(4, (val / max) * 44);
                            return (
                              <View key={idx} style={s.sparkBarWrap}>
                                <View style={[s.sparkBar, { height: h, backgroundColor: isLast ? palette.gold500 : '#DDD6C8' }]} />
                                <Text style={[s.sparkLbl, isLast && { color: palette.gold500 }]}>S{idx + 1}</Text>
                              </View>
                            );
                          })
                        : placeholders.map((ratio, idx) => (
                            <View key={idx} style={s.sparkBarWrap}>
                              <View style={[s.sparkBar, { height: ratio * 44, backgroundColor: '#EEE8DF', opacity: 0.5 }]} />
                              <Text style={s.sparkLbl}>·</Text>
                            </View>
                          ))}
                    </View>
                  </View>
                </View>
              );
            })()}

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

    emptyCard:   { marginBottom: 24, alignItems: 'center' },
    emptyTitle:  { fontFamily: FontFamily.serifMedium, fontSize: 16, color: c.ink,     marginBottom: 8 },
    emptyText:   { fontFamily: FontFamily.sansRegular,  fontSize: 13, color: c.inkSoft, lineHeight: 20, textAlign: 'center', marginBottom: 16 },
    generateBtn: { alignSelf: 'stretch' },

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
