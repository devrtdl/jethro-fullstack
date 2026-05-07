import { StyleSheet, Text, type TextStyle } from 'react-native';

import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';

type Props = {
  children: string;
  color?: string;
  size?: 'sm' | 'lg';
  style?: TextStyle;
};

export function EyebrowLabel({ children, color = palette.gold500, size = 'sm', style }: Props) {
  return (
    <Text
      style={[styles.base, size === 'lg' ? styles.lg : styles.sm, { color }, style]}
      accessibilityRole="text"
    >
      {children.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: FontFamily.sansSemiBold,
    textTransform: 'uppercase',
  },
  sm: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 2,
  },
  lg: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 2.5,
  },
});
