import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthSession } from '@/src/hooks/use-auth-session';
import { authService } from '@/src/services/auth/auth-service';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';
import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';
import { EyebrowLabel } from '@/src/components/ui/EyebrowLabel';
import { GhostButton } from '@/src/components/ui/GhostButton';
import { SectionCard } from '@/src/components/section-card';
import { StatusBadge } from '@/src/components/status-badge';

// ─── Helpers (unchanged) ─────────────────────────────────────────────────────

function getInitials(email: string): string {
  const name = email.split('@')[0] ?? '';
  const parts = name.split('.');
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function RowItem({ icon, label, value }: { icon: string; label: string; value?: string }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.rowItem}>
      <Text style={s.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {value ? <Text style={s.rowValue}>{value}</Text> : null}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function PerfilScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [signingOut, setSigningOut] = useState(false);

  const email    = session?.user?.email ?? '';
  const initials = getInitials(email);
  const createdAt = session?.user?.created_at
    ? new Date(session.user.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—';

  async function handleSignOut() {
    Alert.alert('Terminar sessão', 'Tens a certeza que queres sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await authService.signOut();
            router.replace('/auth/login');
          } catch {
            Alert.alert('Erro', 'Não foi possível terminar a sessão.');
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Text style={s.pageTitle}>Perfil</Text>

        {/* ── Avatar + identity ── */}
        <SectionCard style={s.avatarCard}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.userEmail}>{email}</Text>
          <Text style={s.userSince}>Membro desde {createdAt}</Text>
        </SectionCard>

        {/* ── Assinatura ── */}
        <EyebrowLabel style={s.sectionLabel}>Assinatura</EyebrowLabel>
        <SectionCard style={s.card}>
          <View style={s.subscriptionRow}>
            <StatusBadge label="✓ Activa" tone="success" variant="outline" />
            <Text style={s.subscriptionPlan}>Plano PBN 24 semanas</Text>
          </View>
          <Text style={s.subscriptionNote}>
            Acesso completo ao programa, mentor Jethro e biblioteca de guias.
          </Text>
        </SectionCard>

        {/* ── Progresso ── */}
        <EyebrowLabel style={s.sectionLabel}>Progresso</EyebrowLabel>
        <SectionCard style={s.card}>
          <View style={s.progressGrid}>
            <View style={s.progressItem}>
              <Text style={s.progressValue}>1</Text>
              <Text style={s.progressLabel}>Semana atual</Text>
            </View>
            <View style={s.progressDivider} />
            <View style={s.progressItem}>
              <Text style={s.progressValue}>24</Text>
              <Text style={s.progressLabel}>Semanas totais</Text>
            </View>
            <View style={s.progressDivider} />
            <View style={s.progressItem}>
              <Text style={s.progressValue}>0</Text>
              <Text style={s.progressLabel}>Gates concluídos</Text>
            </View>
          </View>
          <View style={s.progressBarBg}>
            <View style={[s.progressBarFill, { width: `${(1 / 24) * 100}%` }]} />
          </View>
          <Text style={s.progressNote}>Semana 1 de 24 · 4,2% do programa</Text>
        </SectionCard>

        {/* ── Conta ── */}
        <EyebrowLabel style={s.sectionLabel}>Conta</EyebrowLabel>
        <SectionCard style={s.card}>
          <RowItem icon="✉" label="Email" value={email} />
          <View style={s.cardDivider} />
          <RowItem icon="◎" label="Modelo de diagnóstico" value="—" />
          <View style={s.cardDivider} />
          <RowItem icon="◈" label="Onboarding" value="Completo" />
        </SectionCard>

        {/* ── Ajuda ── */}
        <EyebrowLabel style={s.sectionLabel}>Ajuda</EyebrowLabel>
        <Pressable
          style={({ pressed }) => [pressed && { opacity: 0.75 }]}
          onPress={() => router.push('/faq' as never)}
          accessibilityRole="button"
          accessibilityLabel="Perguntas Frequentes"
        >
          <SectionCard style={s.faqRow}>
            <View style={s.faqIconWrap}>
              <Text style={s.faqIconText}>?</Text>
            </View>
            <Text style={s.faqLabel}>Perguntas Frequentes</Text>
            <Text style={s.faqChevron}>›</Text>
          </SectionCard>
        </Pressable>

        {/* ── Diagnóstico ── */}
        <EyebrowLabel style={s.sectionLabel}>Diagnóstico</EyebrowLabel>
        <SectionCard style={s.card}>
          <Text style={s.diagInfo}>
            O diagnóstico identifica o modelo do seu negócio e orienta todo o plano de 24 semanas.
            Você pode refazê-lo a qualquer momento.
          </Text>
          <GhostButton
            label="◎ Fazer novo diagnóstico"
            textColor={colors.accent}
            style={s.diagBtn}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push('/diagnostico' as any)}
          />
        </SectionCard>

        {/* ── Terminar sessão ── */}
        <Pressable
          style={({ pressed }) => [
            s.signOutBtn,
            pressed && s.signOutBtnPressed,
            signingOut && s.signOutBtnDisabled,
          ]}
          onPress={() => void handleSignOut()}
          disabled={signingOut}
          accessibilityRole="button"
          accessibilityLabel="Terminar sessão"
        >
          <Text style={s.signOutText}>{signingOut ? 'A sair...' : 'Terminar sessão'}</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe:      { flex: 1, backgroundColor: c.background },
    scroll:    { flex: 1 },
    container: { paddingHorizontal: Spacing.screenH, paddingTop: 16 },

    pageTitle: {
      fontFamily:   FontFamily.serifMedium,
      fontSize:     28,
      lineHeight:   34,
      color:        c.ink,
      marginBottom: 20,
    },

    sectionLabel: { marginBottom: 10 },

    avatarCard: { alignItems: 'center', paddingVertical: 24, marginBottom: 24, gap: 6 },
    avatarCircle: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: palette.gold500,
      justifyContent: 'center', alignItems: 'center', marginBottom: 6,
    },
    avatarText:  { fontFamily: FontFamily.serifSemiBold, fontSize: 26, color: palette.navy800 },
    userEmail:   { fontFamily: FontFamily.sansSemiBold,  fontSize: 16, color: c.ink },
    userSince:   { fontFamily: FontFamily.sansRegular,   fontSize: 12, color: c.inkMute },

    card: { marginBottom: 24 },

    subscriptionRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    subscriptionPlan: { fontFamily: FontFamily.sansSemiBold, fontSize: 14, color: c.ink },
    subscriptionNote: { fontFamily: FontFamily.sansRegular,  fontSize: 13, color: c.inkMute, lineHeight: 19 },

    progressGrid:    { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    progressItem:    { flex: 1, alignItems: 'center' },
    progressDivider: { width: 1, backgroundColor: c.hairline },
    progressValue:   { fontFamily: FontFamily.serifSemiBold, fontSize: 28, color: c.ink, lineHeight: 34 },
    progressLabel:   { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute, textAlign: 'center', marginTop: 2 },
    progressBarBg:   { height: 3, backgroundColor: c.hairline, borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
    progressBarFill: { height: '100%', backgroundColor: c.accent, borderRadius: 2 },
    progressNote:    { fontFamily: FontFamily.sansRegular, fontSize: 12, color: c.inkMute },

    rowItem:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
    rowIcon:     { fontSize: 16, color: c.accent, width: 22, textAlign: 'center', marginTop: 1 },
    rowLabel:    { fontFamily: FontFamily.sansRegular, fontSize: 12, color: c.inkMute, marginBottom: 2 },
    rowValue:    { fontFamily: FontFamily.sansMedium,  fontSize: 14, color: c.ink },
    cardDivider: { height: 1, backgroundColor: c.hairline, marginVertical: 10 },

    faqRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12, marginBottom: 24 },
    faqIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.accentMuted, alignItems: 'center', justifyContent: 'center' },
    faqIconText: { fontFamily: FontFamily.sansBold, fontSize: 15, color: c.accent },
    faqLabel:    { flex: 1, fontFamily: FontFamily.sansSemiBold, fontSize: 15, color: c.ink },
    faqChevron:  { fontFamily: FontFamily.sansRegular, fontSize: 22, color: c.inkMute },

    diagInfo: { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkSoft, lineHeight: 19, marginBottom: 14 },
    diagBtn:  { borderColor: c.accent },

    signOutBtn:         { borderWidth: 1, borderColor: c.liveRed, borderRadius: Radius.button, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
    signOutBtnPressed:  { backgroundColor: 'rgba(226,72,60,0.06)' },
    signOutBtnDisabled: { opacity: 0.5 },
    signOutText:        { fontFamily: FontFamily.sansSemiBold, fontSize: 15, color: c.liveRed },
  });
}
