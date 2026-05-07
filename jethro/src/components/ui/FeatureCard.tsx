import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';

import { palette } from '@/src/theme/colors';
import { getShadow, Radius, Spacing } from '@/src/theme/spacing';

type Props = PropsWithChildren<{
  style?: ViewStyle;
  colors?: [string, string, ...string[]];
}>;

// Default gradient: navy-800 → navy-700 (top to bottom)
const DEFAULT_COLORS: [string, string] = [palette.navy800, palette.navy700];

export function FeatureCard({ children, style, colors = DEFAULT_COLORS }: Props) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={[styles.card, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.hero,
    padding: Spacing.xxl,
    overflow: 'hidden',
    ...getShadow(2),
  },
});
