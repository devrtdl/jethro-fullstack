import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { ButtonSize, Radius } from '@/src/theme/spacing';
import { FontFamily } from '@/src/theme/typography';
import { useTheme } from '@/src/theme/ThemeContext';

type Props = {
  label:               string;
  onPress:             () => void;
  loading?:            boolean;
  disabled?:           boolean;
  textColor?:          string;
  style?:              ViewStyle;
  accessibilityLabel?: string;
};

export function GhostButton({
  label,
  onPress,
  loading,
  disabled,
  textColor,
  style,
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const tc = textColor ?? colors.ink;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        { borderColor: colors.hairline },
        isDisabled && styles.disabled,
        pressed  && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tc} />
      ) : (
        <Text style={[styles.label, { color: tc }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height:           ButtonSize.secondary,
    backgroundColor:  'transparent',
    borderRadius:     Radius.button,
    borderWidth:      1,
    alignItems:       'center',
    justifyContent:   'center',
    paddingHorizontal: 24,
  },
  label:    { fontFamily: FontFamily.sansMedium, fontSize: 15, letterSpacing: 0.1 },
  disabled: { opacity: 0.5 },
  pressed:  { opacity: 0.75 },
});
