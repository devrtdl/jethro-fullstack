import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { getShadow, ButtonSize, Radius } from '@/src/theme/spacing';
import { FontFamily } from '@/src/theme/typography';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';

type Props = {
  label:              string;
  onPress:            () => void;
  loading?:           boolean;
  disabled?:          boolean;
  style?:             ViewStyle;
  accessibilityLabel?: string;
};

export function PrimaryButton({ label, onPress, loading, disabled, style, accessibilityLabel }: Props) {
  const { colors, colorScheme } = useTheme();
  const isDisabled = disabled || loading;

  // Dark mode: gold btn + navy text (original dark skin feel)
  // Light mode: navy btn + cream text
  const btnBg    = colorScheme === 'dark' ? colors.accent      : colors.ink;
  const labelC   = colorScheme === 'dark' ? colors.background  : colors.surface;
  const spinnerC = labelC;

  const s = useMemo(() => makeStyles(btnBg, labelC), [btnBg, labelC]);

  return (
    <Pressable
      style={({ pressed }) => [
        s.btn,
        isDisabled && s.disabled,
        pressed && s.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerC} />
      ) : (
        <Text style={s.label}>{label}</Text>
      )}
    </Pressable>
  );
}

function makeStyles(btnBg: string, labelC: string) {
  return StyleSheet.create({
    btn: {
      height:           ButtonSize.primary,
      backgroundColor:  btnBg,
      borderRadius:     Radius.button,
      alignItems:       'center',
      justifyContent:   'center',
      paddingHorizontal: 24,
      ...getShadow(3),
    },
    label: {
      fontFamily:    FontFamily.sansSemiBold,
      fontSize:      16,
      color:         labelC,
      letterSpacing: 0.2,
    },
    disabled: { opacity: 0.5 },
    pressed:  { opacity: 0.88 },
  });
}
