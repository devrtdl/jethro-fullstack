import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

const palette = {
  background: '#0B1F3B',
  surface: '#112440',
  gold: '#D4AF37',
  goldGlow: 'rgba(212, 175, 55, 0.08)',
  goldBorder: 'rgba(212, 175, 55, 0.25)',
  cream: '#F8F9FA',
  muted: '#8A9BB0',
};

export function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.container}>
        {/* Brand block */}
        <View style={styles.brandBlock}>
          <Image
            source={require('@/assets/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />

          <View style={styles.wordmarkBlock}>
            <Text style={styles.brandName}>JETHRO</Text>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.brandTagline}>Mentor do Empreendedor Cristão</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>

          <View style={styles.pillRow}>
            <Text style={styles.pill}>Mentoria</Text>
            <Text style={styles.pillDot}>·</Text>
            <Text style={styles.pill}>Princípios Bíblicos</Text>
            <Text style={styles.pillDot}>·</Text>
            <Text style={styles.pill}>IA</Text>
          </View>
        </View>

        {/* Value props */}
        <View style={styles.propsBlock}>
          <ValueProp
            icon="◎"
            title="Diagnóstico personalizado"
            description="Entenda onde você está e o que precisa mudar no seu negócio."
          />
          <ValueProp
            icon="◈"
            title="Plano de ação bíblico"
            description="Orientação prática ancorada em princípios da Palavra de Deus."
          />
          <ValueProp
            icon="◉"
            title="Mentoria com IA"
            description="Respostas inteligentes disponíveis quando você precisar."
          />
        </View>

        {/* CTAs */}
        <View style={styles.ctaBlock}>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/auth/register')}>
            <Text style={styles.primaryButtonLabel}>Começar jornada</Text>
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Já tem uma conta?</Text>
            <Pressable onPress={() => router.replace('/auth/login')}>
              <Text style={styles.loginLink}>Entrar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ValueProp({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.prop}>
      <View style={styles.propIconWrap}>
        <Text style={styles.propIcon}>{icon}</Text>
      </View>
      <View style={styles.propText}>
        <Text style={styles.propTitle}>{title}</Text>
        <Text style={styles.propDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  glowTop: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    width: 340,
    height: 340,
    borderRadius: 999,
    backgroundColor: palette.goldGlow,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -60,
    alignSelf: 'center',
    width: 280,
    height: 200,
    borderRadius: 999,
    backgroundColor: 'rgba(11, 31, 59, 0.5)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },

  // Brand
  brandBlock: {
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 100,
    height: 100,
  },
  wordmarkBlock: {
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    color: palette.cream,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.gold,
    maxWidth: 36,
    opacity: 0.6,
  },
  brandTagline: {
    color: palette.gold,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    color: palette.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pillDot: {
    color: palette.gold,
    fontSize: 11,
    opacity: 0.7,
  },

  // Value props
  propsBlock: {
    gap: 14,
  },
  prop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: 'rgba(17, 36, 64, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  propIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propIcon: {
    color: palette.gold,
    fontSize: 15,
  },
  propText: {
    flex: 1,
    gap: 3,
  },
  propTitle: {
    color: palette.cream,
    fontSize: 14,
    fontWeight: '700',
  },
  propDescription: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },

  // CTAs
  ctaBlock: {
    gap: 14,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: palette.gold,
    minHeight: 54,
  },
  primaryButtonLabel: {
    color: palette.background,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loginText: {
    color: palette.muted,
    fontSize: 14,
  },
  loginLink: {
    color: palette.gold,
    fontSize: 14,
    fontWeight: '700',
  },
});
