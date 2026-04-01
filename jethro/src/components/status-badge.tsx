import { StyleSheet, Text, View } from 'react-native';

type StatusBadgeProps = {
  label: string;
  tone: 'success' | 'error' | 'neutral';
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, toneStyles[tone].container]}>
      <Text style={[styles.label, toneStyles[tone].label]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

const toneStyles = {
  success: StyleSheet.create({
    container: {
      backgroundColor: 'rgba(76, 175, 125, 0.15)',
    },
    label: {
      color: '#4CAF7D',
    },
  }),
  error: StyleSheet.create({
    container: {
      backgroundColor: 'rgba(224, 92, 92, 0.15)',
    },
    label: {
      color: '#E05C5C',
    },
  }),
  neutral: StyleSheet.create({
    container: {
      backgroundColor: 'rgba(212, 175, 55, 0.15)',
    },
    label: {
      color: '#D4AF37',
    },
  }),
};
