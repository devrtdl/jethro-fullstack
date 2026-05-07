import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';
import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';
import { Ornament } from '@/src/components/ui/Ornament';

function ValueProp({ icon, title, description, borderColor, bgColor }: {
  icon: string; title: string; description: string; borderColor: string; bgColor: string;
}) {
  return (
    <View style={[vpStyles.prop, { borderColor, backgroundColor: bgColor }]}>
      <View style={[vpStyles.iconWrap, { backgroundColor: `${palette.gold500}18` }]}>
        <Text style={vpStyles.icon}>{icon}</Text>
      </View>
      <View style={vpStyles.text}>
        <Text style={vpStyles.title}>{title}</Text>
        <Text style={vpStyles.desc}>{description}</Text>
      </View>
    </View>
  );
}

const vpStyles = StyleSheet.create({
  prop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 14 },
  iconWrap: { width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  icon:  { color: palette.gold500, fontSize: 15 },
  text:  { flex: 1, gap: 3 },
  title: { fontFamily: FontFamily.sansSemiBold, fontSize: 14, color: palette.navy800 },
  desc:  { fontFamily: FontFamily.sansRegular,  fontSize: 13, lineHeight: 18 },
});

export function WelcomeScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.container}>
        {/* Brand */}
        <View style={s.brandBlock}>
          <Image source={require('@/assets/logo.png')} style={s.logo} contentFit="contain" />
          <View style={s.wordmarkBlock}>
            <Text style={s.brandName}>JETHRO</Text>
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Ornament width={60} />
              <View style={s.dividerLine} />
            </View>
            <Text style={s.brandTagline}>Mentor do Empreendedor Cristão</Text>
          </View>
          <View style={s.pillRow}>
            <Text style={s.pill}>Mentoria</Text>
            <Text style={s.pillDot}>·</Text>
            <Text style={s.pill}>Princípios Bíblicos</Text>
            <Text style={s.pillDot}>·</Text>
            <Text style={s.pill}>IA</Text>
          </View>
        </View>

        {/* Value props */}
        <View style={s.propsBlock}>
          <ValueProp icon="◎" title="Diagnóstico personalizado" description="Entenda onde você está e o que precisa mudar no seu negócio." borderColor={colors.hairline} bgColor={colors.surface} />
          <ValueProp icon="◈" title="Plano de ação bíblico"    description="Orientação prática ancorada em princípios da Palavra de Deus." borderColor={colors.hairline} bgColor={colors.surface} />
          <ValueProp icon="◉" title="Mentoria com IA"          description="Respostas inteligentes disponíveis quando você precisar." borderColor={colors.hairline} bgColor={colors.surface} />
        </View>

        {/* CTAs */}
        <View style={s.ctaBlock}>
          <Pressable style={s.primaryButton} onPress={() => router.replace('/auth/register')}>
            <Text style={s.primaryButtonLabel}>Começar jornada</Text>
          </Pressable>
          <View style={s.loginRow}>
            <Text style={s.loginText}>Já tem uma conta?</Text>
            <Pressable onPress={() => router.replace('/auth/login')}>
              <Text style={s.loginLink}>Entrar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safeArea:  { flex: 1, backgroundColor: c.background },
    container: { flex: 1, paddingHorizontal: Spacing.screenH, paddingTop: 32, paddingBottom: 24, justifyContent: 'space-between' },

    brandBlock:   { alignItems: 'center', gap: 16 },
    logo:         { width: 100, height: 100 },
    wordmarkBlock:{ alignItems: 'center', gap: 8 },
    brandName: {
      fontFamily:    FontFamily.serifSemiBold,
      fontSize:      42,
      letterSpacing: 6,
      color:         c.ink,
    },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dividerLine:{ flex: 1, height: 1, backgroundColor: c.accent, maxWidth: 36, opacity: 0.5 },
    brandTagline: { fontFamily: FontFamily.sansMedium, fontSize: 13, color: c.accent, letterSpacing: 0.5 },
    pillRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pill:       { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.inkMute, letterSpacing: 1, textTransform: 'uppercase' },
    pillDot:    { fontFamily: FontFamily.sansRegular, fontSize: 11, color: c.accent, opacity: 0.7 },

    propsBlock: { gap: 10 },

    ctaBlock: { gap: 14 },
    primaryButton: {
      alignItems:      'center',
      justifyContent:  'center',
      borderRadius:    Radius.button,
      backgroundColor: c.accent,
      minHeight:       54,
    },
    primaryButtonLabel: { fontFamily: FontFamily.sansBold, fontSize: 17, color: palette.navy800, letterSpacing: 0.3 },
    loginRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    loginText: { fontFamily: FontFamily.sansRegular, fontSize: 14, color: c.inkMute },
    loginLink: { fontFamily: FontFamily.sansBold, fontSize: 14, color: c.accent },
  });
}
