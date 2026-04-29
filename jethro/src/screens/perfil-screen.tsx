import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JethroColors } from '@/constants/theme';
import { useAuthSession } from '@/src/hooks/use-auth-session';
import { authService } from '@/src/services/auth/auth-service';

function getInitials(email: string): string {
  const name = email.split('@')[0] ?? '';
  const parts = name.split('.');
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function RowItem({ icon, label, value }: { icon: string; label: string; value?: string }) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
    </View>
  );
}

export function PerfilScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const [signingOut, setSigningOut] = useState(false);

  const email = session?.user?.email ?? '';
  const initials = getInitials(email);
  const createdAt = session?.user?.created_at
    ? new Date(session.user.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.pageTitle}>Perfil</Text>

        {/* Avatar + identity */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userEmail}>{email}</Text>
          <Text style={styles.userSince}>Membro desde {createdAt}</Text>
        </View>

        {/* Subscription status */}
        <Text style={styles.sectionTitle}>Assinatura</Text>
        <View style={styles.card}>
          <View style={styles.subscriptionRow}>
            <View style={styles.subscriptionBadge}>
              <Text style={styles.subscriptionBadgeText}>✓ Activa</Text>
            </View>
            <Text style={styles.subscriptionPlan}>Plano PBN 24 semanas</Text>
          </View>
          <Text style={styles.subscriptionNote}>
            Acesso completo ao programa, mentor Jethro e biblioteca de guias.
          </Text>
        </View>

        {/* Progresso */}
        <Text style={styles.sectionTitle}>Progresso</Text>
        <View style={styles.card}>
          <View style={styles.progressGrid}>
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>1</Text>
              <Text style={styles.progressLabel}>Semana actual</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>24</Text>
              <Text style={styles.progressLabel}>Semanas totais</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={styles.progressValue}>0</Text>
              <Text style={styles.progressLabel}>Gates concluídos</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(1 / 24) * 100}%` }]} />
          </View>
          <Text style={styles.progressNote}>Semana 1 de 24 · 4,2% do programa</Text>
        </View>

        {/* Account details */}
        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={styles.card}>
          <RowItem icon="✉" label="Email" value={email} />
          <View style={styles.cardDivider} />
          <RowItem icon="◎" label="Modelo de diagnóstico" value="—" />
          <View style={styles.cardDivider} />
          <RowItem icon="◈" label="Onboarding" value="Completo" />
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Ajuda</Text>
        <Pressable
          style={({ pressed }) => [styles.card, styles.faqRow, pressed && { opacity: 0.75 }]}
          onPress={() => router.push('/faq' as never)}
        >
          <Text style={styles.faqIcon}>?</Text>
          <Text style={styles.faqLabel}>Perguntas Frequentes</Text>
          <Text style={styles.faqChevron}>›</Text>
        </Pressable>

        {/* Novo diagnóstico */}
        <Text style={styles.sectionTitle}>Diagnóstico</Text>
        <View style={styles.card}>
          <Text style={styles.diagInfo}>
            O diagnóstico identifica o modelo do teu negócio e orienta todo o plano de 24 semanas.
            Podes refazê-lo a qualquer momento.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.diagBtn, pressed && { opacity: 0.8 }]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push('/diagnostico' as any)}
          >
            <Text style={styles.diagBtnText}>◎ Fazer novo diagnóstico</Text>
          </Pressable>
        </View>

        {/* Sign out */}
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && styles.signOutBtnPressed, signingOut && styles.signOutBtnDisabled]}
          onPress={handleSignOut}
          disabled={signingOut}
        >
          <Text style={styles.signOutText}>{signingOut ? 'A sair...' : 'Terminar sessão'}</Text>
        </Pressable>

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
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: JethroColors.creme,
    marginBottom: 20,
  },
  avatarCard: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: JethroColors.navySurface,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: JethroColors.goldMuted,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: JethroColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: JethroColors.navy,
  },
  userEmail: {
    fontSize: 16,
    color: JethroColors.creme,
    fontWeight: '600',
    marginBottom: 4,
  },
  userSince: {
    fontSize: 12,
    color: JethroColors.muted,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: JethroColors.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  card: {
    backgroundColor: JethroColors.navySurface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  subscriptionBadge: {
    backgroundColor: 'rgba(76, 175, 125, 0.15)',
    borderWidth: 1,
    borderColor: JethroColors.success,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  subscriptionBadgeText: {
    fontSize: 12,
    color: JethroColors.success,
    fontWeight: '600',
  },
  subscriptionPlan: {
    fontSize: 14,
    color: JethroColors.creme,
    fontWeight: '600',
  },
  subscriptionNote: {
    fontSize: 13,
    color: JethroColors.muted,
    lineHeight: 19,
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressDivider: {
    width: 1,
    backgroundColor: JethroColors.navyDeep,
  },
  progressValue: {
    fontSize: 28,
    fontWeight: '800',
    color: JethroColors.gold,
    lineHeight: 34,
  },
  progressLabel: {
    fontSize: 11,
    color: JethroColors.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: JethroColors.navyDeep,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: JethroColors.gold,
    borderRadius: 3,
  },
  progressNote: {
    fontSize: 12,
    color: JethroColors.muted,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  rowIcon: {
    fontSize: 16,
    color: JethroColors.gold,
    width: 22,
    textAlign: 'center',
    marginTop: 1,
  },
  rowLabel: {
    fontSize: 12,
    color: JethroColors.muted,
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 14,
    color: JethroColors.creme,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: JethroColors.navyDeep,
    marginVertical: 10,
  },
  signOutBtn: {
    borderWidth: 1,
    borderColor: JethroColors.danger,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  signOutBtnPressed: {
    backgroundColor: 'rgba(224, 92, 92, 0.08)',
  },
  signOutBtnDisabled: {
    opacity: 0.5,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: JethroColors.danger,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  faqIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: JethroColors.gold,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 32,
    fontSize: 16,
    fontWeight: '700',
    color: JethroColors.navy,
    overflow: 'hidden',
  },
  faqLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: JethroColors.creme,
  },
  faqChevron: {
    fontSize: 22,
    color: JethroColors.muted,
    fontWeight: '300',
  },
  diagInfo: {
    fontSize: 13,
    color: JethroColors.muted,
    lineHeight: 19,
    marginBottom: 14,
  },
  diagBtn: {
    backgroundColor: JethroColors.navyDeep,
    borderWidth: 1,
    borderColor: JethroColors.gold,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  diagBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: JethroColors.gold,
  },
});
