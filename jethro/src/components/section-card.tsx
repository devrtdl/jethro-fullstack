import { useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { getShadow, Radius } from '@/src/theme/spacing';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';

type SectionCardProps = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function SectionCard({ children, style }: SectionCardProps) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return <View style={[s.card, style]}>{children}</View>;
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius:    Radius.md,
      padding:         18,
      gap:             12,
      borderWidth:     1,
      borderColor:     c.hairline,
      ...getShadow(1),
    },
  });
}
