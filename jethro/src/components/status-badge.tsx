import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius } from '@/src/theme/spacing';

type Tone = 'success' | 'error' | 'neutral' | 'navy' | 'gold';
type Variant = 'fill' | 'outline';

type StatusBadgeProps = {
  label: string;
  tone?: Tone;
  variant?: Variant;
  style?: ViewStyle;
};

export function StatusBadge({ label, tone = 'neutral', variant = 'fill', style }: StatusBadgeProps) {
  const bg   = variant === 'outline' ? 'transparent' : toneMap[tone].bg;
  const text = toneMap[tone].text;
  const border = variant === 'outline' ? toneMap[tone].text : 'transparent';

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }, style]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const toneMap: Record<Tone, { bg: string; text: string }> = {
  success: { bg: 'rgba(76,175,125,0.15)',  text: palette.success },
  error:   { bg: 'rgba(226,72,60,0.12)',   text: palette.liveRed },
  neutral: { bg: palette.goldMuted,         text: palette.gold500 },
  navy:    { bg: palette.navy800,           text: palette.paper },
  gold:    { bg: palette.gold500,           text: palette.navy800 },
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  label: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
