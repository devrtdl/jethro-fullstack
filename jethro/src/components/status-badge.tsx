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
      backgroundColor: '#dff6df',
    },
    label: {
      color: '#146c2e',
    },
  }),
  error: StyleSheet.create({
    container: {
      backgroundColor: '#fde7e3',
    },
    label: {
      color: '#9f2d20',
    },
  }),
  neutral: StyleSheet.create({
    container: {
      backgroundColor: '#e9efe5',
    },
    label: {
      color: '#44513f',
    },
  }),
};
